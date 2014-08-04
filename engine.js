function Engine() { }

// *************************************************************************************
// External dependencies
Engine.Dependencies =
[
	"enginejs/script/third_party/hashCode-v1.0.0.js",
	"enginejs/script/third_party/webtoolkit.md5.js",
];

// *************************************************************************************
// Resources
Engine.Resources =
{
	// Vertex shaders
	vs_basic                 : { file: "enginejs/shaders/basic.vs" },
	vs_basic_flip_y          : { file: "enginejs/shaders/basic.vs", define: ["FLIP_Y"] },

	// Fragment shaders
	fs_basic                 : { file: "enginejs/shaders/basic.fs" },
	fs_basic_textured        : { file: "enginejs/shaders/basic-textured.fs" },
	fs_basic_textured_flip_y : { file: "enginejs/shaders/basic-textured.fs", define: ["FLIP_Y"] },
};

// *************************************************************************************
// Cache linked shader programs for performance
Engine.prototype.ShaderProgramCache = { };

// *************************************************************************************
// Main initialisation
Engine.prototype.Init = function(canvas, user_resources, on_complete, on_render)
{
	var _this = this;

	// First load out JS dependencies...
	_this.LoadDependencies(function()
	{
		Engine.Log("Initialising WebGL context");
		try
		{
			// Try to grab the standard context. If it fails, fallback to experimental
			_this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
			_this.canvas = canvas;
		}
		catch(e)
		{
			Engine.Log("Failed initialising WebGL context");
			if(on_complete) { on_complete(null); }
			return;
		}

		// Load internal & user resources
		ExecuteAsyncJobQueue(
		{
			jobs : [{ first : function(cb) { Engine.LogSection("Loading internal resources"); _this.LoadResources(Engine.Resources, cb); }},
			        { first : function(cb) { Engine.LogSection("Loading user resources"); _this.LoadResources(user_resources, cb); }}],
			finally: function(ok)
			{
				Engine.Log(ok? "Initialised successfully" : "Initialised failed");
				if(on_complete) { on_complete(ok? _this.gl : null); }

				// Setup internal render loop
				var on_render_internal = function()
				{
					// Request next render frame
					_this.SetRenderCallback(on_render_internal);

					// Call client render loop
					on_render();
				};

				// Request first render frame
				_this.SetRenderCallback(on_render_internal);
			}
		});
	});
}

Engine.prototype.SetRenderCallback = function(callback)
{
	var request_func = window.requestAnimationFrame       ||
	                   window.webkitRequestAnimationFrame ||
	                   window.mozRequestAnimationFrame    ||
	                   function(callback) { window.setTimeout(callback, 1000 / 60); };
	request_func(callback, this.canvas);
}

// *************************************************************************************
// Runtime javascript dependency load & init
Engine.prototype.LoadDependencies = function(on_complete)
{
	var _this = this;

	// 1. Load ajq for better async jobs/loops
	Engine.LogSection("Loading Dependencies");
	$.getScript("enginejs/script/third_party/ajq/ajq.js", function(script)
	{
		eval(script); // Hotload ajq.js

		// 2. Use ajq to load remaining dependencies
		ExecuteAsyncLoop(Engine.Dependencies, function(entry, carry_on)
		{
			Engine.Log("Loading dependency: " + entry);
			$.getScript(entry, function(script)
			{
				eval(script); // Hotload dependency
				carry_on(true);
			});
		}, on_complete);
	});
}

Engine.prototype.LoadResources = function(resource_list, on_complete)
{
	var _this = this;

	// Process all descriptors in resource list
	ExecuteAsyncLoopProps(resource_list, function(prop_key, descriptor, carry_on)
	{
		Engine.Log("Loading resource: " + descriptor.file);
		descriptor.prop_key = prop_key; // Pass prop_key through closure
		_this.LoadResourceByDescriptor(descriptor, function(resource_object)
		{
			resource_list[descriptor.prop_key] = resource_object;
			delete descriptor.prop_key; // No use to client
			carry_on(true);
		});
	}, on_complete);
}

// *************************************************************************************
// Generic resource load (type determined by fie extension)
Engine.prototype.LoadResourceByDescriptor = function(descriptor, on_complete)
{
	var _this = this;

	var extension = descriptor.file.split('.').pop();
	switch(extension)
	{
		case "png":
		{
			_this.LoadTexture(descriptor, function(texture_object)
			{
				on_complete(texture_object);
			});
			break;
		}
		case "vs":
		case "fs":
		{
			_this.LoadShader(descriptor, function(shader_object)
			{
				on_complete(shader_object);
			});
			break;
		}
	}
}

// *************************************************************************************
// Texture operations
Engine.prototype.LoadTexture = function(descriptor, callback)
{
	var _this = this;
	var img_object = new Image();

	// Handle success
	img_object.onload = function()
	{
		// Create gl texture
		var texture_object =
		{
			resource : _this.gl.createTexture(),
			width    : this.width,
			height   : this.height
		};

		// Bind
		_this.gl.bindTexture(_this.gl.TEXTURE_2D, texture_object.resource);

		// Setup params
		_this.gl.texImage2D(_this.gl.TEXTURE_2D, 0, _this.gl.RGBA, _this.gl.RGBA, _this.gl.UNSIGNED_BYTE, img_object);
		_this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_MAG_FILTER, _this.gl.LINEAR);
		_this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_MIN_FILTER, _this.gl.LINEAR_MIPMAP_NEAREST);
		_this.gl.generateMipmap(_this.gl.TEXTURE_2D);

		// Unbind
		_this.gl.bindTexture(_this.gl.TEXTURE_2D, null);

		// Done
		if(callback) { callback(new EngineResourceBase(descriptor, texture_object)); }
	};

	// Handle errors
	img_object.onerror = function()
	{
		var error_msg = "Failed loading texture: " + descriptor.file;
		Engine.LogError(error_msg);
		if(callback) { callback(new EngineResourceBase(descriptor, null)); }
	};

	// Initiate load
	img_object.src = descriptor.file;
}

Engine.prototype.BindTexture = function(texture, idx, sampler_name)
{
	// We support binding by our texture (wrapper) object or raw WebGL texture
	var tx_resource = texture.hasOwnProperty("resource")? texture.resource :
	                                                      texture;

	// If no sampler name is specified use default based on index e.g. "tx0"
	if(sampler_name == undefined) { sampler_name = ("tx" + idx); }

	// Bind texture
	this.gl.activeTexture(this.gl.TEXTURE0 + idx);
	this.gl.bindTexture(this.gl.TEXTURE_2D, tx_resource);
	this.gl.uniform1i(this.gl.getUniformLocation(this.current_shader_program.resource, sampler_name), idx);
}

// *************************************************************************************
// Shader operations
Engine.prototype.LoadShader = function(descriptor, callback)
{
	var _this = this;

	// Setup pre-processor defines...
	var defines = (descriptor.define)? descriptor.define : [];

	_this.FetchResource(descriptor.file, function(shader_code)
	{
		var extension = descriptor.file.split('.').pop();
		var shader = (extension == "vs")? _this.CompileVertexShader(shader_code, defines) :
		                                  _this.CompileFragmentShader(shader_code, defines);

		if(shader)
		{
			Engine.Log("Successfully loaded shader: " + descriptor.file);
		}

		if(callback) { callback(new EngineResourceBase(descriptor, shader)); }
	});
}

Engine.prototype.CompileVertexShader = function(code, defines)
{
	return this.CompileShader(code, this.gl.VERTEX_SHADER, defines);
}

Engine.prototype.CompileFragmentShader = function(code, defines)
{
	return this.CompileShader(code, this.gl.FRAGMENT_SHADER, defines);
}

Engine.prototype.CompileShader = function(shader_code, shader_type, defines)
{
	var shader_resource = this.gl.createShader(shader_type);

	// Add pre-processor defines...
	$.each(defines, function(idx, definition)
	{
		shader_code = "#define " + definition + "\n" + shader_code;
	});

	// Compile code
	this.gl.shaderSource(shader_resource, shader_code);
	this.gl.compileShader(shader_resource);
	var success = this.gl.getShaderParameter(shader_resource, this.gl.COMPILE_STATUS);

	// Return shader object
	var shader_object =
	{
		resource  : success? shader_resource : null,
		type      : shader_type,
		code      : shader_code,
		defines   : defines
	};

	// Report errors?
	if(!success)
	{
		var error_msg = "Failed compiling shader: " + this.gl.getShaderInfoLog(shader_resource);
		Engine.LogError(error_msg);
	}

	return success? shader_object : null;
}

Engine.prototype.CreateShaderProgram = function(vertex_shader, fragment_shader)
{
	// Generate a name for this resource based on MD5 of both shaders
	var uid = this.MD5([vertex_shader, fragment_shader]);
	if(uid in this.ShaderProgramCache) { return this.ShaderProgramCache[uid]; }

	// Create new shader program
	var shader_program = this.gl.createProgram();
	this.gl.attachShader(shader_program, vertex_shader.resource);
	this.gl.attachShader(shader_program, fragment_shader.resource);
	this.gl.linkProgram(shader_program);
	var success = this.gl.getProgramParameter(shader_program, this.gl.LINK_STATUS);

	// Create shader program object
	var id_string = uid + " (" + vertex_shader.descriptor.file + " --> " + fragment_shader.descriptor.file + ")";
	var shader_program_object =
	{
		name      : uid,
		status    : success? "ok" : "fail",
		resource  : success? shader_program : null,
		v_shader  : vertex_shader,
		f_shader  : fragment_shader,
		error_msg : success? "" : ("Failed linking shader program: " + id_string)
	};

	if(success)
	{
		Engine.Log("Successfully linked shader program: " + id_string);
		this.ShaderProgramCache[uid] = shader_program_object;
	}
	else
	{
		Engine.LogError(shader_program_object.error_msg);
		Engine.LogError(this.gl.getProgramInfoLog(shader_program));
	}

	return shader_program_object;
}

Engine.prototype.BindShaderProgram = function(program)
{
	this.current_shader_program = program;
	this.gl.useProgram(program.resource);
}

// *************************************************************************************
// Vertex buffer operations
Engine.prototype.CreateVertexBuffer = function(vertex_buffer_descriptor)
{
	var buffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertex_buffer_descriptor.Data), this.gl.STATIC_DRAW);

	var vertex_buffer_object =
	{
		descriptor     : vertex_buffer_descriptor,
		resource       : buffer,
		item_size      : vertex_buffer_descriptor.ItemSize,
		item_count     : vertex_buffer_descriptor.Data.length / vertex_buffer_descriptor.ItemSize,
		attribute_name : vertex_buffer_descriptor.AttributeName
	};

	return vertex_buffer_object;
}

Engine.prototype.BindVertexBuffer = function(vertex_buffer_object)
{
	this.current_vertex_buffer = vertex_buffer_object;
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertex_buffer_object.resource);
	var vertex_attrib = this.gl.getAttribLocation(this.current_shader_program.resource, vertex_buffer_object.attribute_name);
	this.gl.enableVertexAttribArray(vertex_attrib);
	this.gl.vertexAttribPointer(vertex_attrib, vertex_buffer_object.item_size, this.gl.FLOAT, false, 0, 0);
}

// *************************************************************************************
// Render target operations
Engine.prototype.CreateRenderTarget = function(rt_name, rt_width, rt_height)
{
	// Create texture
	var rt_texture = this.CreateRenderTargetTexture(rt_width, rt_height);

	// Create buffer
	var rt_buffer = this.gl.createFramebuffer();
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, rt_buffer);

	// Bind the two
	this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, rt_texture, 0);

	// Setup render target object
	var rt_object =
	{
		name     : rt_name,
		resource : rt_buffer,
		texture  : rt_texture,
		width    : rt_width,
		height   : rt_height
	};

	// Register and return render target object
	this.RenderTargets[rt_name] = rt_object;
	return rt_object;
}

Engine.prototype.CreateRenderTargetTexture = function(width, height)
{
	// Create
	var texture = this.gl.createTexture();

	// Set params
	this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
	this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
	return texture;
}

Engine.prototype.BindRenderTarget = function(render_target)
{
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, render_target.resource);
}

Engine.prototype.UnBindRenderTarget = function(render_target)
{
	this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
}

// *************************************************************************************
// Drawing
Engine.prototype.Clear = function(colour)
{
	this.gl.clearColor(colour.r, colour.g, colour.b, colour.a);
	this.gl.clear(this.gl.COLOR_BUFFER_BIT);
}

Engine.prototype.DrawArray = function()
{
	this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.current_vertex_buffer.item_count);
}

// *************************************************************************************
// Misc
Engine.prototype.FetchResource = function(resource_url, callback)
{
	callback = callback || false;
	jQuery.ajax(
	{
		url     : resource_url,
		async   : callback,
		cache   : false,
		success : function(data)
		{
			if(callback) { callback(data); }
		}
	});
}

Engine.prototype.MD5 = function(data)
{
	return HashCode.value(data);
}

// *************************************
// Constants
Engine.DefaultVertexSize = 3;

// *************************************
// Basic primitives
Engine.Primitive =
{
	Quad : 
	{
		Vertices :
		{
			AttributeName : "vs_in_pos",
			ItemSize      : 3,
			Data          :
			[
				 1.0,  1.0,  0.0,
				-1.0,  1.0,  0.0,
				 1.0, -1.0,  0.0,
				-1.0, -1.0,  0.0
			]
		},

		TextureCoordinates : 
		{
			AttributeName : "vs_in_uv",
			ItemSize      : 2,
			Data          :
			[
				1.0, 0.0,
				0.0, 0.0,
				1.0, 1.0,
				0.0, 1.0
			]
		}
	},
	QuadFlipY :
	{
		Vertices :
		{
			AttributeName : "vs_in_pos",
			ItemSize      : 3,
			Data          :
			[
				 1.0, -1.0,  0.0,
				-1.0, -1.0,  0.0,
				 1.0,  1.0,  0.0,
				-1.0,  1.0,  0.0
			]
		},

		TextureCoordinates : 
		{
			AttributeName : "vs_in_uv",
			ItemSize      : 2,
			Data          :
			[
				1.0, 0.0,
				0.0, 0.0,
				1.0, 1.0,
				0.0, 1.0
			]
		}
	}
};

// *************************************
// Basic colours
Engine.Colour =
{
	Black : { r : 0.0, g : 0.0, b : 0.0, a : 1.0 },
	White : { r : 1.0, g : 1.0, b : 1.0, a : 1.0 },
	Red   : { r : 1.0, g : 0.0, b : 0.0, a : 1.0 },
	Green : { r : 0.0, g : 1.0, b : 0.0, a : 1.0 },
	Blue  : { r : 0.0, g : 0.0, b : 1.0, a : 1.0 }
};

// *************************************
// Logging
Engine.LogSection = function(msg)
{
	console.log("[engine] *****************************************");
	console.log("[engine]  " + msg);
	console.log("[engine] *****************************************");
};

Engine.Log = function(msg)
{
	console.log("[engine]  INFO: " + msg)
};

Engine.LogError = function(msg)
{
	console.error("[engine] ERROR: " + msg);
};

// *************************************
// Misc
function EngineResourceBase(descriptor, resource_object)
{
	$.extend(this, resource_object);
	this.descriptor = descriptor;
}

EngineResourceBase.prototype.IsValid = function()
{
	return !(typeof this.resource === 'undefined') && (this.resource != null);
}