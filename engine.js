function Engine() { }

// *************************************************************************************
// External dependencies
Engine.prototype.Dependencies =
[
	"script/third_party/ajq/ajq.js",
	"script/third_party/hashCode-v1.0.0.js",
	"script/third_party/webtoolkit.md5.js",
];

// *************************************************************************************
// Resource collections
Engine.prototype.Textures       = { };
Engine.prototype.Shaders        = { };
Engine.prototype.ShaderPrograms = { };
Engine.prototype.RenderTargets  = { };

// *************************************************************************************
// Main initialisation
Engine.prototype.Init = function(canvas, callback)
{
	_this = this;

	Engine.Log("Preloading external dependencies...");
	for(var i = 0; i < _this.Dependencies.length; ++i)
	{
		$.getScript(_this.Dependencies[i], function(script) { eval(script); });
	}

	Engine.Log("Initialising WebGL context");
	try
	{
		// Try to grab the standard context. If it fails, fallback to experimental
		this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		this.canvas = canvas;
	}
	catch(e)
	{
		Engine.Log("Failed initialising WebGL context");
		if(callback) { callback(null); }
		return;
	}

	// Setup texture slots for easy access by index
	Engine.Log("Setting up texture slots");

	Engine.Log("Building shader library load chain");
	var async_jobs =
	[
		// Load built-in shaders
		{ first : function(cb) { _this.LoadShader("vs_basic",                 "script/engine/shaders/basic.vs",          cb);             } },
		{ first : function(cb) { _this.LoadShader("vs_basic_flip_y",          "script/engine/shaders/basic.vs",          cb, ["FLIP_Y"]); } },
		{ first : function(cb) { _this.LoadShader("fs_basic",                 "script/engine/shaders/basic.fs",          cb);             } },
		{ first : function(cb) { _this.LoadShader("fs_basic_textured",        "script/engine/shaders/basic-textured.fs", cb);             } },
		{ first : function(cb) { _this.LoadShader("fs_basic_textured_flip_y", "script/engine/shaders/basic-textured.fs", cb, ["FLIP_Y"]); } }
	];

	Engine.Log("Loading shader library");
	ExecuteAsyncJobQueue(
	{
		jobs : async_jobs,
		finally: function(ok)
		{
			Engine.Log(ok? "Initialised successfully" : "Initialised failed");
			if(callback) { callback(ok? _this.gl : null); }
		}
	});
}

// *************************************************************************************
// Texture operations
Engine.prototype.LoadTexture = function(texture_url, callback)
{
	var _this = this;
	img = new Image();

	// Generate a texture name from the url
	var texture_name = texture_url.replace(/^.*[\\\/]/, '');
	texture_name = texture_name.replace(' ', '_').replace('.', '_');

	// Return shader object
	var texture_object =
	{
		name         : texture_name,
		status       : "ok",
		src          : texture_url,
		resource     : null,
		image_object : img,
		error_msg    : "",
		width        : 0,
		height       : 0
	};

	// Handle success
	img.onload = function()
	{
		// Create gl texture
		texture_object.resource = _this.gl.createTexture();
		texture_object.width  = this.width;
		texture_object.height = this.height;

		// Bind
		_this.gl.bindTexture(_this.gl.TEXTURE_2D, texture_object.resource);

		// Setup params
		_this.gl.texImage2D(_this.gl.TEXTURE_2D, 0, _this.gl.RGBA, _this.gl.RGBA, _this.gl.UNSIGNED_BYTE, texture_object.image_object);
		_this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_MAG_FILTER, _this.gl.LINEAR);
		_this.gl.texParameteri(_this.gl.TEXTURE_2D, _this.gl.TEXTURE_MIN_FILTER, _this.gl.LINEAR_MIPMAP_NEAREST);
		_this.gl.generateMipmap(_this.gl.TEXTURE_2D);

		// Unbind
		_this.gl.bindTexture(_this.gl.TEXTURE_2D, null);

		// Done
		_this.Textures[texture_name] = texture_object;
		if(callback) { callback(texture_object); }
	};

	// Handle errors
	img.onerror = function()
	{
		texture_object.error_msg = "Failed loading texture: " + texture_url;
		Engine.LogError(texture_object.error_msg);
		if(callback) { callback(texture_object); }
	};

	// Initiate load
	img.src = texture_url;
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
Engine.prototype.LoadShader = function(shader_name, shader_url, callback, defines)
{
	_this = this;

	var id_string = shader_name + " (" + shader_url + ")";
	_this.FetchResource(shader_url, function(shader_code)
	{
		var extension = shader_url.split('.').pop();
		var shader = (extension == "vs")? _this.CompileVertexShader(shader_name, shader_code, defines) :
		                                  _this.CompileFragmentShader(shader_name, shader_code, defines);
		shader.src = shader_url;
		
		if(shader.status != "ok")
		{
			Engine.LogError("Failed loading shader: " + id_string);
			Engine.LogError(shader.error_msg);
		}

		Engine.Log("Successfully loaded shader: " + id_string);
		if(callback) { callback(shader); }
	});
}

Engine.prototype.CompileVertexShader = function(shader_name, code, defines)
{
	return this.CompileShader(shader_name, code, this.gl.VERTEX_SHADER, defines);
}

Engine.prototype.CompileFragmentShader = function(shader_name, code, defines)
{
	return this.CompileShader(shader_name, code, this.gl.FRAGMENT_SHADER, defines);
}

Engine.prototype.CompileShader = function(shader_name, shader_code, shader_type, defines)
{
	var shader_resource = this.gl.createShader(shader_type);

	// Add pre-processor defines...
	if(defines)
	{
		$.each(defines, function(idx, definition)
		{
			shader_code = "#define " + definition + "\n" + shader_code;
		});
	}

	// Compile code
	this.gl.shaderSource(shader_resource, shader_code);
	this.gl.compileShader(shader_resource);
	var success = this.gl.getShaderParameter(shader_resource, this.gl.COMPILE_STATUS);

	// Return shader object
	var shader_object =
	{
		name      : shader_name,
		status    : success? "ok" : "fail",
		type      : shader_type,
		src       : "?",
		defines   : defines,
		code      : shader_code,
		resource  : success? shader_resource : null,
		error_msg : success? "" : this.gl.getShaderInfoLog(shader_resource)
	};

	if(success)
	{
		Engine.Log("Successfully compiled shader: " + shader_name);
		this.Shaders[shader_name] = shader_object;
	}
	else
	{
		Engine.LogError("Failed compiling shader: " + shader_name);
	}

	return shader_object;
}

Engine.prototype.CreateShaderProgram = function(vertex_shader, fragment_shader)
{
	// Generate a name for this resource based on MD5 of both shaders
	var uid = this.MD5([vertex_shader, fragment_shader]);
	if(uid in this.ShaderPrograms) { return this.ShaderPrograms[uid]; }

	// Create new shader program
	var shader_program = this.gl.createProgram();
	this.gl.attachShader(shader_program, vertex_shader.resource);
	this.gl.attachShader(shader_program, fragment_shader.resource);
	this.gl.linkProgram(shader_program);
	var success = this.gl.getProgramParameter(shader_program, this.gl.LINK_STATUS);

	// Create shader program object
	var id_string = uid + " (" + vertex_shader.name + " --> " + fragment_shader.name + ")";
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
		this.ShaderPrograms[uid] = shader_program_object;
	}
	else
	{
		Engine.LogError(shader_program_object.error_msg);
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
	this.gl.clear(gl.COLOR_BUFFER_BIT);
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
Engine.Log = function(msg)
{
	console.log("[engine]  INFO: " + msg)
};

Engine.LogError = function(msg)
{
	console.error("[engine] ERROR: " + msg);
};