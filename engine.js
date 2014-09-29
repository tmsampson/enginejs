function Engine() { }

// *************************************************************************************
// External dependencies
Engine.Dependencies =
[
	"enginejs/script/third_party/hashCode-v1.0.0.js",
	"enginejs/script/third_party/webtoolkit.md5.js",
	"enginejs/script/third_party/gl-matrix-min.js",
];

// *************************************************************************************
// Resources
Engine.Resources =
{
	// Vertex shaders
	vs_basic             : { file: "enginejs/shaders/basic.vs" },
	vs_basic_transformed : { file: "enginejs/shaders/basic-transformed.vs" },

	// Fragment shaders
	fs_basic             : { file: "enginejs/shaders/basic.fs" },
	fs_basic_colour      : { file: "enginejs/shaders/basic-colour.fs" },
	fs_basic_textured    : { file: "enginejs/shaders/basic-textured.fs" },
	fs_grid              : { file: "enginejs/shaders/grid.fs" },

	// Models
	ml_quad              : { file: "enginejs/models/quad.model" },
};

// *************************************************************************************
// Cache linked shader programs for performance
Engine.prototype.ShaderProgramCache = { };

// *************************************************************************************
// Main initialisation
Engine.prototype.Init = function(on_user_init, user_resources, canvas)
{
	var _this = this;

	// First load out JS dependencies...
	_this.LoadDependencies(function()
	{
		Engine.Log("Initialising WebGL context");
		try
		{
			// Try to grab the standard context. If it fails, fallback to experimental
			canvas = canvas || document.getElementsByTagName("canvas")[0];
			_this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
			_this.canvas = canvas;
		}
		catch(e)
		{
			$(canvas).html("EngineJS initialisation failed");
			Engine.Log("Failed initialising WebGL context");
			if(on_user_init) { on_user_init(null); }
			return;
		}

		// Internal setup
		Engine.IdentityMatrix = mat4.create();
		Engine.DrawModeFromString =
		{
			triangle        : _this.gl.TRIANGLES,
			triangles       : _this.gl.TRIANGLES,
			triangle_strip  : _this.gl.TRIANGLE_STRIP,
			triangle_strips : _this.gl.TRIANGLE_STRIP,
			triangle_fan    : _this.gl.TRIANGLE_FAN,
			triangle_fans   : _this.gl.TRIANGLE_FAN
		};

		// Load internal & user resources
		ExecuteAsyncJobQueue(
		{
			jobs : [{ first : function(cb) { Engine.LogSection("Loading internal resources"); _this.LoadResources(Engine.Resources, cb); }},
			        { first : function(cb) { Engine.LogSection("Loading user resources"); _this.LoadResources(user_resources, cb); }}],
			finally: function(ok)
			{
				Engine.Log(ok? "Initialised successfully" : "Initialised failed");
				if(on_user_init)
				{
					// User init handler returns the user render function
					var on_user_render = on_user_init(ok? _this.gl : null);
					if(on_user_render)
					{
						// Setup internal render loop
						var on_render_internal = function()
						{
							// How long did last frame take?
							var delta = Engine.GetTime() - last_frame_time;

							// Request next render frame
							_this.SetRenderCallback(on_render_internal);

							// Call user render loop
							last_frame_time = Engine.GetTime();
							on_user_render(delta);
						};

						// Request first render frame
						var last_frame_time = Engine.GetTime();
						_this.SetRenderCallback(on_render_internal);
					}
				}
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

	// Skip null / empty lists
	if(!resource_list) { return on_complete(); }

	// Extract optional on_loaded callback from list
	var on_loaded = resource_list["on_loaded"];

	// Process all descriptors in resource list
	var i = 0; var property_count = Object.keys(resource_list).length - (on_loaded? 1 : 0);
	ExecuteAsyncLoopProps(resource_list, function(prop_key, descriptor, carry_on)
	{
		// Don't try and load the user callback as a resource!
		if(prop_key == "on_loaded") { return carry_on(true); }

		Engine.Log("Loading resource: " + descriptor.file);
		descriptor.prop_key = prop_key; // Pass prop_key through closure
		_this.LoadResourceByDescriptor(descriptor, function(resource_object)
		{
			resource_list[descriptor.prop_key] = resource_object;
			delete descriptor.prop_key; // No use to client
			if(on_loaded) { on_loaded(descriptor.file, ++i, property_count); }
			carry_on(true);
		});
	}, on_complete);
}

// *************************************************************************************
// Generic resource load (type determined by fie extension)
Engine.prototype.LoadResourceByDescriptor = function(descriptor, on_complete)
{
	var _this = this;

	// Supported resource extension --> load handler func
	var resource_load_functions =
	{
		png   : function(descriptor, callback) { _this.LoadTexture(descriptor, callback); },
		jpg   : function(descriptor, callback) { _this.LoadTexture(descriptor, callback); },
		vs    : function(descriptor, callback) { _this.LoadShader(descriptor, callback);  },
		fs    : function(descriptor, callback) { _this.LoadShader(descriptor, callback);  },
		model : function(descriptor, callback) { _this.LoadModel(descriptor, callback);   },
	}

	// Is this resource type supported?
	var extension = descriptor.file.split('.').pop();
	if(extension in resource_load_functions)
	{
		resource_load_functions[extension](descriptor, function(texture_object)
		{
			on_complete(texture_object);
		});
	}
	else
	{
		Engine.LogError("Resource type with extension '" + extension + "' not supported");
		on_complete(null);
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

	// If no sampler name is specified use default based on index e.g. "u_tx0"
	if(sampler_name == undefined) { sampler_name = ("u_tx" + idx); }

	// Bind texture
	this.gl.activeTexture(this.gl.TEXTURE0 + idx);
	this.gl.bindTexture(this.gl.TEXTURE_2D, tx_resource);
	this.SetShaderConstant(sampler_name, idx, Engine.SC_SAMPLER);
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
		error_msg : success? ""  : ("Failed linking shader program: " + id_string),
		uniform_location_cache   : { },
		attribute_location_cache : { }
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

	// Bind camera?
	if(this.active_camera)
	{
		this.SetShaderConstant("u_trans_proj", this.active_camera.mtx_proj, Engine.SC_MATRIX4);
	}
}

Engine.prototype.SetShaderConstant = function(constant_name, constant_value, setter_func)
{
	var uniform_location = null;
	var program = this.current_shader_program;

	// Asking WebGL for uniform locations is slow, can we
	// re-use a cached result?
	if(constant_name in program.uniform_location_cache)
	{
		uniform_location = program.uniform_location_cache[constant_name];
	}
	else
	{
		uniform_location = engine.gl.getUniformLocation(program.resource, constant_name);
		program.uniform_location_cache[constant_name] = uniform_location; // Cache for later
	}

	// Set the constant
	setter_func(this.gl, uniform_location, constant_value);
}

// *************************************************************************************
// Model operations
Engine.prototype.LoadModel = function(descriptor, callback)
{
	var _this = this;

	_this.FetchResource(descriptor.file, function(model_json)
	{
		// Build vertex buffers
		var model = jQuery.parseJSON(model_json);
		var vertex_buffers = model.model_data.vertex_buffers;
		for(var i = 0; i < vertex_buffers.length; ++i)
		{
			// Place vertex buffer object immediately inside buffer object
			vertex_buffers[i].vbo = _this.CreateVertexBuffer(vertex_buffers[i]);
		}

		// Finalise
		model.is_loaded = true;
		callback(model);
	});
}

// *************************************************************************************
// Vertex buffer operations
Engine.prototype.CreateVertexBuffer = function(vertex_buffer_descriptor)
{
	var buffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertex_buffer_descriptor.stream), this.gl.STATIC_DRAW);

	var vertex_buffer_object =
	{
		descriptor     : vertex_buffer_descriptor,
		resource       : buffer,
		item_size      : vertex_buffer_descriptor.item_size,
		item_count     : vertex_buffer_descriptor.stream.length / vertex_buffer_descriptor.item_size,
		attribute_name : vertex_buffer_descriptor.attribute_name,
		draw_mode      : Engine.DrawModeFromString[vertex_buffer_descriptor.draw_mode]
	};

	return vertex_buffer_object;
}

Engine.prototype.BindVertexBuffer = function(vertex_buffer_object)
{
	this.current_vertex_buffer = vertex_buffer_object;

	var program = this.current_shader_program;
	var attribute_name = vertex_buffer_object.attribute_name;

	// Asking WebGL for attribute locations is slow, can we
	// re-use a cached result?
	var attribute_location = null;
	if(attribute_name in program.attribute_location_cache)
	{
		attribute_location = program.attribute_location_cache[attribute_name];
	}
	else
	{
		attribute_location = this.gl.getAttribLocation(program.resource, attribute_name);
		program.attribute_location_cache[attribute_name] = attribute_location; // Cache for later
	}

	// Bind vertex buffer to program attribute location
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertex_buffer_object.resource);
	this.gl.enableVertexAttribArray(attribute_location);
	this.gl.vertexAttribPointer(attribute_location, vertex_buffer_object.item_size, this.gl.FLOAT, false, 0, 0);
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
	this.gl.drawArrays(this.current_vertex_buffer.draw_mode, 0, this.current_vertex_buffer.item_count);
}

Engine.prototype.DrawModel = function(model)
{
	// NOTE: This is a very basic implementation which simply binds all of
	// the model's vertex streams and issues a draw call. This will need
	// developing and maintaining as the model format matures to support shader,
	// material, texture binding etc.

	// Make sure model has been "loaded" (vertex buffer objects have been created)
	if(!model.hasOwnProperty("is_loaded"))
	{
		Engine.LogError("Attempt to draw unloaded model: " + model.name);
		return false;
	}

	// Bind vertex buffers
	var vertex_buffers = model.model_data.vertex_buffers;
	for(var i = 0; i < vertex_buffers.length; ++i)
	{
		this.BindVertexBuffer(vertex_buffers[i].vbo);
	}

	// Draw model
	this.DrawArray();
	return true;
}

Engine.prototype.DrawQuad = function()
{
	// Draw full-screen quad
	this.DrawModel(Engine.Resources["ml_quad"]);
}

// *************************************************************************************
// Camera
Engine.prototype.SetActiveCamera = function(cam)
{
	this.active_camera = cam;
}

// *************************************************************************************
// Geometry
Engine.prototype.GenerateCircleModel = function(params)
{
	// Setup empty model
	var model = { name : "Circle", is_loaded : true, model_data : { vertex_buffers : [] } };

	// Generate verts
	if(!params.hasOwnProperty("segment_count"))
		return false;

	var vertex_buffer = { name : "vertices", attribute_name : "a_pos", item_size : 3, draw_mode : "triangle_fan", stream : [0.0, 0.0, 0.0] };
	var theta = (2 * Math.PI) / params.segment_count;
	for(var i = 0; i <= params.segment_count; ++i)
	{
		vertex_buffer.stream.push(Math.cos(theta * i), Math.sin(theta * i), 0.0);
	}

	// Create vertex buffer
	vertex_buffer.vbo = this.CreateVertexBuffer(vertex_buffer);
	model.model_data.vertex_buffers.push(vertex_buffer);

	// Generate UVs?
	if(params.hasOwnProperty("generate_uvs") && !params.generate_uvs)
		return model;

	var uv_buffer = { name : "texture-coordinates", attribute_name : "a_uv", item_size : 2, draw_mode : "triangle_fan", stream : [0.5, -0.5] };
	var normalise = function (x) { return ((x + 1) / 2); }
	for(var i = 0; i <= params.segment_count; ++i)
	{
		uv_buffer.stream.push(normalise(Math.cos(theta * i)), -normalise(Math.sin(theta * i)));
	}

	// Create uv buffer
	uv_buffer.vbo = this.CreateVertexBuffer(uv_buffer);
	model.model_data.vertex_buffers.push(uv_buffer);

	return model;
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
		},
		error   : function(err)
		{
			Engine.LogError("Failed fetching resource: " + resource_url);
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
// Matrix
Engine.prototype.IdentityMatrix = null; // Set on init

// *************************************
// Draw mode lookup
Engine.DrawModeFromString = { };

// *************************************
// Uniform setter functions (passed to SetShaderConstant)
Engine.SC_FLOAT   = function(gl, uniform_location, new_value) { gl.uniform1f(uniform_location,        new_value); }
Engine.SC_INT     = function(gl, uniform_location, new_value) { gl.uniform1i(uniform_location,        new_value); }
Engine.SC_SAMPLER = function(gl, uniform_location, new_value) { gl.uniform1i(uniform_location,        new_value); }
Engine.SC_VEC4    = function(gl, uniform_location, new_value) { gl.uniform4fv(uniform_location,       new_value); }
Engine.SC_MATRIX4 = function(gl, uniform_location, new_value) { gl.uniformMatrix4fv(uniform_location, false, new_value); }

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
Engine.GetTime = function()
{
	return (new Date).getTime();
}

Engine.Sleep = function(milliseconds)
{
	var start = new Date().getTime();
	for(var i = 0; i < 1e7; i++)
	{
		if((new Date().getTime() - start) > milliseconds)
		{
			break;
		}
	}
}

// *************************************
// EngineResourceBase
function EngineResourceBase(descriptor, resource_object)
{
	$.extend(this, resource_object);
	this.descriptor = descriptor;
}

EngineResourceBase.prototype.IsValid = function()
{
	return !(typeof this.resource === 'undefined') && (this.resource != null);
}

// *************************************
// EngineCameraOrtho
function EngineCameraOrtho(config)
{
	$.extend(this, config);
	this.mtx_proj = mat4.create();

	// By default, centre camera
	this.x = 0;
	this.y = 0;
	this.UpdateMtx();
}

EngineCameraOrtho.prototype.UpdateMtx = function()
{
	// Camera x/y represents bottom left of view region
	mat4.ortho(this.mtx_proj,
	           this.x, this.x + this.width,
	           this.y, this.y + this.height,
	           -1.0, 1.0);
}