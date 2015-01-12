function Engine() { }

// *************************************************************************************
// External dependencies
// *************************************************************************************
Engine.Dependencies =
[
	"enginejs/css/engine.css",
	"enginejs/script/third_party/hashCode-v1.0.0.js",
	"enginejs/script/third_party/webtoolkit.md5.js",
	"enginejs/script/third_party/gl-matrix-min.js",
	"enginejs/script/third_party/jquery-ui.min.js",
	"enginejs/css/third_party/jquery-ui/jquery-ui.css",
];

// *************************************************************************************
// EngineJS Modules
// *************************************************************************************
Engine.Modules =
[
	{ name : "EngineJS-Util",     js : "enginejs/modules/enginejs-util.js"     },
	{ name : "EngineJS-Time",     js : "enginejs/modules/enginejs-time.js"     },
	{ name : "EngineJS-Colour",   js : "enginejs/modules/enginejs-colour.js"   },
	{ name : "EngineJS-Debug",    js : "enginejs/modules/enginejs-debug.js"    },
	{ name : "EngineJS-Array",    js : "enginejs/modules/enginejs-array.js"    },
	{ name : "EngineJS-Math",     js : "enginejs/modules/enginejs-math.js"     },
	{ name : "EngineJS-Net",      js : "enginejs/modules/enginejs-net.js"      },
	{ name : "EngineJS-Resource", js : "enginejs/modules/enginejs-resource.js" },
	{ name : "EngineJS-Audio",    js : "enginejs/modules/enginejs-audio.js"    },
	{ name : "EngineJS-Keyboard", js : "enginejs/modules/enginejs-keyboard.js" },
	{ name : "EngineJS-Mouse",    js : "enginejs/modules/enginejs-mouse.js"    },
	{ name : "EngineJS-2D",       js : "enginejs/modules/enginejs-2d.js"       },
];

Engine.LoadModules = function(modules, on_complete)
{
	ExecuteAsyncLoop(modules, function(_module, carry_on)
	{
		Engine.Log("Loading module: " + _module.name);
		Engine.LoadJS(_module.js, function()
		{
			carry_on(true); // Load next module
		});
	}, on_complete);
};

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
	fs_grid_3d           : { file: "enginejs/shaders/grid-3d.fs" },
	fs_grid_3d_fog       : { file: "enginejs/shaders/grid-3d-fog.fs" },
	fs_2d_background     : { file: "enginejs/shaders/2d/background.fs" },
	fs_2d_sprite         : { file: "enginejs/shaders/2d/sprite.fs" },

	// Models
	ml_quad              : { file: "enginejs/models/quad.model"       },
	ml_floor_tile        : { file: "enginejs/models/floor_tile.model" },
	ml_tri               : { file: "enginejs/models/tri.model"        },
	ml_cube              : { file: "enginejs/models/cube.model"       },
};

// *************************************************************************************
// Cache linked shader programs for performance
Engine.ShaderProgramCache = { };

// *************************************************************************************
// Main initialisation
Engine.Init = function(on_user_init, user_resources, canvas)
{
	// First load in JS dependencies...
	Engine.LoadDependencies(function()
	{
		// Carry out asynchronous jobs
		ExecuteAsyncJobQueue(
		{
			jobs :
			[
				{
					// 1. Load internal modules
					first : function(cb)
					{
						Engine.LogSection("Initialising WebGL");
						Engine.InitWebGL(canvas, cb)
					}
				},
				{
					// 2. Load internal modules
					first : function(cb)
					{
						Engine.LogSection("Loading internal modules");
						Engine.LoadModules(Engine.Modules, cb);
					}
				},
				{
					// 3. Load internal resources
					first : function(cb)
					{
						Engine.LogSection("Loading internal resources");
						Engine.Resource.LoadBatch(Engine.Resources, cb);
					}
				},
				{
					// 4. Load user resources
					first : function(cb)
					{
						Engine.LogSection("Loading user resources");
						Engine.Resource.LoadBatch(user_resources, cb);
					}
				}
			],
			finally: function(ok)
			{
				Engine.Log(ok? "Initialised successfully" : "Initialised failed");
				if(!on_user_init) { return; }

				// User init handler returns the user render function
				var on_user_render = on_user_init(ok? Engine.GL : null);
				if(on_user_render)
				{
					Engine.LogSection("Starting game loop");
					Engine.RunGameLoop(on_user_render);
				}
			}
		});
	});
}

Engine.InitWebGL = function(canvas, callback)
{
	Engine.Log("Initialising WebGL context");
	try
	{
		// Try to grab the standard context. If it fails, fallback to experimental
		Engine.Canvas = canvas || document.getElementsByTagName("canvas")[0];
		Engine.GL = Engine.Canvas.getContext("webgl") || Engine.Canvas.getContext("experimental-webgl");

		// Canvas helper methods
		Engine.Canvas.GetSize   = function() { return [this.width, this.height] };
		Engine.Canvas.GetWidth  = function() { return this.width; };
		Engine.Canvas.GetHeight = function() { return this.height; };
		Engine.Canvas.GetCentre = function() { return [this.width / 2, this.height / 2, 0] };

		// Setup global constants
		Engine.IdentityMatrix = mat4.create();
		Engine.DrawModeFromString =
		{
			"triangle"        : Engine.GL.TRIANGLES,
			"triangles"       : Engine.GL.TRIANGLES,
			"triangle_strip"  : Engine.GL.TRIANGLE_STRIP,
			"triangle_strips" : Engine.GL.TRIANGLE_STRIP,
			"triangle_fan"    : Engine.GL.TRIANGLE_FAN,
			"triangle_fans"   : Engine.GL.TRIANGLE_FAN
		};

		// Initialise default state
		this.StateTracking = { };
		this.StateTracking[Engine.GL.BLEND] = 0;
		this.StateTracking[Engine.GL.DEPTH_TEST] = 0;

		// WebGL initialised successfully
		callback(true);
	}
	catch(e)
	{
		$(canvas).html("EngineJS initialisation failed");
		Engine.Log("Failed initialising WebGL context");
		callback(false);
	}
};

// *************************************************************************************
// Render callback registration
Engine.SetRenderCallback = function(callback)
{
	var request_func = window.requestAnimationFrame       ||
	                   window.webkitRequestAnimationFrame ||
	                   window.mozRequestAnimationFrame    ||
	                   function(callback) { window.setTimeout(callback, 1000 / 60); };
	request_func(callback, this.canvas);
}

// *************************************************************************************
// Runtime javascript dependency load & init
Engine.LoadDependencies = function(on_complete)
{
	var dependency_load_functions =
	{
		js  : function(url, callback) { Engine.LoadJS(url, callback);  },
		css : function(url, callback) { Engine.LoadCSS(url, callback); },
	};

	// 1. Load ajq for better async jobs/loops
	Engine.LogSection("Loading Dependencies");
	$.getScript("enginejs/script/third_party/ajq/ajq.js", function(script)
	{
		eval(script); // Hotload ajq.js

		// 2. Use ajq to dynamically load remaining dependencies
		ExecuteAsyncLoop(Engine.Dependencies, function(entry, carry_on)
		{
			Engine.Log("Loading dependency: " + entry);
			var extension = entry.split('.').pop();
			if(extension in dependency_load_functions)
			{
				dependency_load_functions[extension](entry, function()
				{
					carry_on(true);
				});
			}
			else
			{
				Engine.LogError("Dependency type with extension '" + extension + "' not supported");
				on_complete(null);
			}
		}, on_complete);
	});
}

Engine.LoadJS = function(url, callback)
{
	$.getScript(url, function(script)
	{
		eval(script); // Hotload script
		callback(script);
	}).fail(function(jqxhr, settings, exception)
	{
		Engine.LogError("Failed to load " + url);
		Engine.LogError(exception);
	});
}

Engine.LoadCSS = function(url, callback)
{
	$("<link/>", { rel: "stylesheet", type: "text/css", href: url }).appendTo("head");
	callback();
}

Engine.RunGameLoop = function(on_user_render)
{
	var on_render_internal = function()
	{
		// Generate frame stats
		var elapsed_ms = Engine.Time.Now() - first_frame_time;
		var delta_ms   = Engine.Time.Now() - last_frame_time;

		// Request next render frame
		Engine.SetRenderCallback(on_render_internal);

		// Flip input buffers
		Engine.Mouse.Update();
		Engine.Keyboard.Update();

		// Toggle wireframe mode?
		if(Engine.Keyboard.IsPressed("f9", true))
		{
			Engine.force_wireframe_mode = !Engine.force_wireframe_mode;
		}

		// Setup per-frame info for client
		var info =
		{
			elapsed_s  : elapsed_ms / 1000,
			elapsed_ms : elapsed_ms,
			delta_s    : delta_ms / 1000,
			delta_ms   : delta_ms,
		}

		// Call user render function
		last_frame_time = Engine.Time.Now();
		on_user_render(info);
	};

	// Request first render frame
	var first_frame_time = Engine.Time.Now();
	var last_frame_time  = Engine.Time.Now();
	Engine.SetRenderCallback(on_render_internal);
}

// *************************************************************************************
// Texture operations
Engine.LoadTexture = function(descriptor, callback)
{
	var img_object = new Image();

	// Handle success
	img_object.onload = function()
	{
		// Create gl texture
		var texture_object =
		{
			resource : Engine.GL.createTexture(),
			width    : this.width,
			height   : this.height
		};

		// Bind
		Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, texture_object.resource);

		// Setup params
		Engine.GL.texImage2D(Engine.GL.TEXTURE_2D, 0, Engine.GL.RGBA, Engine.GL.RGBA, Engine.GL.UNSIGNED_BYTE, img_object);
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MAG_FILTER, Engine.GL.LINEAR);
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MIN_FILTER, Engine.GL.LINEAR_MIPMAP_NEAREST);
		Engine.GL.generateMipmap(Engine.GL.TEXTURE_2D);

		// Unbind
		Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, null);

		// Done
		if(callback) { callback(new Engine.Resource.Base(descriptor, texture_object)); }
	};

	// Handle errors
	img_object.onerror = function()
	{
		var error_msg = "Failed loading texture: " + descriptor.file;
		Engine.LogError(error_msg);
		if(callback) { callback(new Engine.Resource.Base(descriptor, null)); }
	};

	// Initiate load
	img_object.src = descriptor.file;
}

Engine.BindTexture = function(texture, idx, sampler_name)
{
	// We support binding by our texture (wrapper) object or raw WebGL texture
	var tx_resource = texture.hasOwnProperty("resource")? texture.resource :
	                                                      texture;

	// If no sampler name is specified use default based on index e.g. "u_tx0"
	if(sampler_name == undefined) { sampler_name = ("u_tx" + idx); }

	// Bind texture
	Engine.GL.activeTexture(Engine.GL.TEXTURE0 + idx);
	Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, tx_resource);
	this.SetShaderConstant(sampler_name, idx, Engine.SC_SAMPLER);
}

Engine.BindTextureArray = function(texture_array, sampler_name)
{
	// If no sampler name is specified use default sampler array
	if(sampler_name == undefined) { sampler_name = ("u_tx"); }

	// Bind textures
	var sampler_indices = new Int32Array(texture_array.length);
	for(var idx = 0; idx < texture_array.length; ++idx)
	{
		var texture = texture_array[idx];

		// We support binding by our texture (wrapper) object or raw WebGL texture
		var tx_resource = texture.hasOwnProperty("resource")? texture.resource :
		                                                      texture;

		Engine.GL.activeTexture(Engine.GL.TEXTURE0 + idx);
		Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, tx_resource);
		sampler_indices[idx] = idx;
	}

	// Setup sampler array
	this.SetShaderConstant(sampler_name, sampler_indices, Engine.SC_SAMPLER_ARRAY);
}

// *************************************************************************************
// Shader operations
Engine.LoadShader = function(descriptor, callback)
{
	// Setup pre-processor defines...
	var defines = (descriptor.define)? descriptor.define : [];

	Engine.Net.FetchResource(descriptor.file, function(shader_code)
	{
		var extension = descriptor.file.split('.').pop();
		var shader = (extension == "vs")? Engine.CompileVertexShader(shader_code, defines) :
		                                  Engine.CompileFragmentShader(shader_code, defines);

		if(shader)
		{
			Engine.Log("Successfully loaded shader: " + descriptor.file);
		}

		if(callback) { callback(new Engine.Resource.Base(descriptor, shader)); }
	});
}

Engine.CompileVertexShader = function(code, defines)
{
	return Engine.CompileShader(code, Engine.GL.VERTEX_SHADER, defines);
}

Engine.CompileFragmentShader = function(code, defines)
{
	return Engine.CompileShader(code, Engine.GL.FRAGMENT_SHADER, defines);
}

Engine.CompileShader = function(shader_code, shader_type, defines)
{
	var shader_resource = Engine.GL.createShader(shader_type);

	// Add pre-processor defines...
	$.each(defines, function(idx, definition)
	{
		shader_code = "#define " + definition + "\n" + shader_code;
	});

	// Compile code
	Engine.GL.shaderSource(shader_resource, shader_code);
	Engine.GL.compileShader(shader_resource);
	var success = Engine.GL.getShaderParameter(shader_resource, Engine.GL.COMPILE_STATUS);

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
		var error_msg = "Failed compiling shader: " + Engine.GL.getShaderInfoLog(shader_resource);
		Engine.LogError(error_msg);
	}

	return success? shader_object : null;
}

Engine.CreateShaderProgram = function(vertex_shader, fragment_shader)
{
	// Generate a name for this resource based on MD5 of both shaders
	var uid = Engine.Util.MD5([vertex_shader, fragment_shader]);
	if(uid in Engine.ShaderProgramCache) { return Engine.ShaderProgramCache[uid]; }

	// Create new shader program
	var shader_program = Engine.GL.createProgram();
	Engine.GL.attachShader(shader_program, vertex_shader.resource);
	Engine.GL.attachShader(shader_program, fragment_shader.resource);
	Engine.GL.linkProgram(shader_program);
	var success = Engine.GL.getProgramParameter(shader_program, Engine.GL.LINK_STATUS);

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
		Engine.ShaderProgramCache[uid] = shader_program_object;
	}
	else
	{
		Engine.LogError(shader_program_object.error_msg);
		Engine.LogError(Engine.GL.getProgramInfoLog(shader_program));
	}

	return shader_program_object;
}

Engine.BindShaderProgram = function(program)
{
	this.current_shader_program = program;
	Engine.GL.useProgram(program.resource);

	// Bind camera?
	if(this.active_camera)
	{
		this.SetShaderConstant("u_trans_view", this.active_camera.mtx_view, Engine.SC_MATRIX4);
		this.SetShaderConstant("u_trans_proj", this.active_camera.mtx_proj, Engine.SC_MATRIX4);
	}
}

Engine.SetShaderConstant = function(constant_name, constant_value, setter_func)
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
		uniform_location = Engine.GL.getUniformLocation(program.resource, constant_name);
		program.uniform_location_cache[constant_name] = uniform_location; // Cache for later
	}

	// Set the constant
	setter_func(Engine.GL, uniform_location, constant_value);
}

// *************************************************************************************
// Model operations
Engine.LoadModel = function(descriptor, callback)
{
	// Redirect member-function call to global function (required by global resource load mechanism)
	return Engine.LoadModel(this, descriptor, callback);
}

Engine.LoadModel = function(descriptor, callback)
{
	Engine.Net.FetchResource(descriptor.file, function(model_json)
	{
		var model = jQuery.parseJSON(model_json);

		// For each primitive...
		var prims = model.model_data.primitives;
		for(var i = 0; i < prims.length; ++i)
		{
			// Build vertex buffers
			var vertex_buffers = prims[i].vertex_buffers;
			for(var j = 0; j < vertex_buffers.length; ++j)
			{
				// Place vertex buffer object immediately inside buffer object
				vertex_buffers[j].vbo = Engine.CreateVertexBuffer(vertex_buffers[j]);
			}
		}

		// Finalise
		model.is_loaded = true;
		callback(model);
	});
}

// *************************************************************************************
// Vertex buffer operations
Engine.CreateVertexBuffer = function(vertex_buffer_descriptor)
{
	// Determine buffer type (normal/index)?
	var is_index_buffer = (vertex_buffer_descriptor.name == "indices");
	var vertex_buffer_type = is_index_buffer? Engine.GL.ELEMENT_ARRAY_BUFFER :
	                                          Engine.GL.ARRAY_BUFFER;

	// Create and bind the new buffer
	var buffer = Engine.GL.createBuffer();
	Engine.GL.bindBuffer(vertex_buffer_type, buffer);

	// Bind data stream to buffer
	var vertex_data_stream = is_index_buffer? new Uint16Array(vertex_buffer_descriptor.stream) :
	                                          new Float32Array(vertex_buffer_descriptor.stream);
	Engine.GL.bufferData(vertex_buffer_type, vertex_data_stream, Engine.GL.STATIC_DRAW);

	// Use default draw mode?
	var vertex_draw_mode = Engine.DrawModeFromString["triangles"];
	if(vertex_buffer_descriptor.hasOwnProperty("draw_mode"))
	{
		vertex_draw_mode = Engine.DrawModeFromString[vertex_buffer_descriptor.draw_mode];
	}

	// Setup our own VBO type
	var vertex_buffer_object =
	{
		descriptor     : vertex_buffer_descriptor,
		buffer_type    : vertex_buffer_type,
		resource       : buffer,
		item_size      : vertex_buffer_descriptor.item_size,
		item_count     : vertex_buffer_descriptor.stream.length / vertex_buffer_descriptor.item_size,
		attribute_name : vertex_buffer_descriptor.attribute_name,
		draw_mode      : vertex_draw_mode
	};
	return vertex_buffer_object;
}

Engine.BindVertexBuffer = function(vertex_buffer_object)
{
	this.current_vertex_buffer_object = vertex_buffer_object;

	// Bind vertex buffer
	var is_index_buffer = (vertex_buffer_object.buffer_type == Engine.GL.ELEMENT_ARRAY_BUFFER);
	Engine.GL.bindBuffer(is_index_buffer? Engine.GL.ELEMENT_ARRAY_BUFFER :
	                                    Engine.GL.ARRAY_BUFFER,
	                   vertex_buffer_object.resource);

	// Bind to shader attribute (indices not passed to shaders)
	if(!is_index_buffer)
	{
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
			attribute_location = Engine.GL.getAttribLocation(program.resource, attribute_name);
			program.attribute_location_cache[attribute_name] = attribute_location; // Cache for later
		}

		// Bind vertex buffer to program attribute location?
		// Note: If attribute_location == -1, the attribute was not present in the currently
		//       bound shader program (or was optimised out if unused etc). For example, this might
		//       occur if the vertex data being bound contains a uv stream (e.g. "a_uv") which is
		//       referenced and forwarded by the linked *vertex* shader, but is not referenced within
		//       the linked *fragment* shader (i.e "a_uv" got deadstripped when the program was linked).
		if(attribute_location != -1)
		{
			Engine.GL.enableVertexAttribArray(attribute_location);
			Engine.GL.vertexAttribPointer(attribute_location, vertex_buffer_object.item_size, Engine.GL.FLOAT, false, 0, 0);
		}
	}
}

// *************************************************************************************
// Render target operations
Engine.CreateRenderTarget = function(rt_name, rt_width, rt_height)
{
	// Create texture
	var rt_texture = this.CreateRenderTargetTexture(rt_width, rt_height);

	// Create buffer
	var rt_buffer = Engine.GL.createFramebuffer();
	Engine.GL.bindFramebuffer(Engine.GL.FRAMEBUFFER, rt_buffer);

	// Bind the two
	Engine.GL.framebufferTexture2D(Engine.GL.FRAMEBUFFER, Engine.GL.COLOR_ATTACHMENT0, Engine.GL.TEXTURE_2D, rt_texture, 0);

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

Engine.CreateRenderTargetTexture = function(width, height)
{
	// Create
	var texture = Engine.GL.createTexture();

	// Set params
	Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, texture);
	Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_WRAP_S, Engine.GL.CLAMP_TO_EDGE);
	Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_WRAP_T, Engine.GL.CLAMP_TO_EDGE);
	Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MIN_FILTER, Engine.GL.NEAREST);
	Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MAG_FILTER, Engine.GL.NEAREST);
	Engine.GL.texImage2D(Engine.GL.TEXTURE_2D, 0, Engine.GL.RGBA, width, height, 0, Engine.GL.RGBA, Engine.GL.UNSIGNED_BYTE, null);
	return texture;
}

Engine.BindRenderTarget = function(render_target)
{
	Engine.GL.bindFramebuffer(Engine.GL.FRAMEBUFFER, render_target.resource);
}

Engine.UnBindRenderTarget = function(render_target)
{
	Engine.GL.bindFramebuffer(Engine.GL.FRAMEBUFFER, null);
}

// *************************************************************************************
// Camera
Engine.BindCamera = function(cam)
{
	this.active_camera = cam;
}

// *************************************************************************************
// Drawing
Engine.Clear = function(colour)
{
	Engine.GL.clearColor(colour.r, colour.g, colour.b, colour.a);
	Engine.GL.clear(Engine.GL.COLOR_BUFFER_BIT);
}

Engine.DrawArray = function()
{
	var wireframe = (this.wireframe_mode || this.force_wireframe_mode);
	var draw_mode = wireframe? Engine.GL.LINE_LOOP : this.current_vertex_buffer_object.draw_mode;
	var item_count = this.current_vertex_buffer_object.item_count;
	var is_index_buffer = (this.current_vertex_buffer_object.buffer_type  == Engine.GL.ELEMENT_ARRAY_BUFFER);
	if(is_index_buffer)
	{
		// Draw indexed
		Engine.GL.drawElements(draw_mode, item_count, Engine.GL.UNSIGNED_SHORT, 0);
	}
	else
	{
		// Draw non-indexed
		Engine.GL.drawArrays(draw_mode, 0, item_count);
	}
}

Engine.DrawModel = function(model)
{
	// Make sure model has been "loaded" (vertex buffer objects have been created)
	if(!model.hasOwnProperty("is_loaded"))
	{
		Engine.LogError("Attempt to draw unloaded model: " + model.name);
		return false;
	}

	// For each primitive...
	var prims = model.model_data.primitives
	for(var i = 0; i < prims.length; ++i)
	{
		var index_buffer = null;

		// Bind vertex buffers
		var vertex_buffers = prims[i].vertex_buffers;
		for(var j = 0; j < vertex_buffers.length; ++j)
		{
			// Is this an index buffer?
			if(vertex_buffers[j].vbo.buffer_type == Engine.GL.ELEMENT_ARRAY_BUFFER)
			{
				// Only allow a single index buffer per-prim
				if(index_buffer)
				{
					Engine.LogError("Model '" + model.name + "' primitive: " + i + ", attempting to bind multiple index buffers");
					return false;
				}

				// Always bind index buffers last
				index_buffer = vertex_buffers[j];
				continue;
			}

			this.BindVertexBuffer(vertex_buffers[j].vbo);
		}

		// Always bind index buffer last
		if(index_buffer) { this.BindVertexBuffer(index_buffer.vbo); }

		// Draw primitive
		this.DrawArray();
	}

	return true;
}

Engine.DrawQuad = function()
{
	// Draw full-screen quad
	this.DrawModel(Engine.Resources["ml_quad"]);
}

Engine.EnableWireframeMode = function(do_enable)
{
	this.wireframe_mode = do_enable;
}

// *************************************************************************************
// Geometry
Engine.GenerateCircleModel = function(params)
{
	// Setup empty model with 1 prim
	var prim = { vertex_buffers : [] }
	var model = { name : "Circle", is_loaded : true, model_data : { primitives : [prim] } };

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
	prim.vertex_buffers.push(vertex_buffer);

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
	prim.vertex_buffers.push(uv_buffer);

	return model;
}

// *************************************
// Matrix
Engine.IdentityMatrix = null; // Set on init

// *************************************
// Uniform setter functions (passed to SetShaderConstant)
Engine.SC_FLOAT         = function(gl, uniform_location, new_value) { gl.uniform1f(uniform_location,        new_value); }
Engine.SC_FLOAT_ARRAY   = function(gl, uniform_location, new_value) { gl.uniform1fv(uniform_location,       new_value); }
Engine.SC_INT           = function(gl, uniform_location, new_value) { gl.uniform1i(uniform_location,        new_value); }
Engine.SC_INT_ARRAY     = function(gl, uniform_location, new_value) { gl.uniform1iv(uniform_location,       new_value); }
Engine.SC_SAMPLER       = function(gl, uniform_location, new_value) { gl.uniform1i(uniform_location,        new_value); }
Engine.SC_SAMPLER_ARRAY = function(gl, uniform_location, new_value) { gl.uniform1iv(uniform_location,       new_value); }
Engine.SC_VEC2          = function(gl, uniform_location, new_value) { gl.uniform2fv(uniform_location,       new_value); }
Engine.SC_VEC2_ARRAY    = function(gl, uniform_location, new_value) { gl.uniform2fv(uniform_location,       new_value); }
Engine.SC_VEC3          = function(gl, uniform_location, new_value) { gl.uniform3fv(uniform_location,       new_value); }
Engine.SC_VEC3_ARRAY    = function(gl, uniform_location, new_value) { gl.uniform3fv(uniform_location,       new_value); }
Engine.SC_VEC4          = function(gl, uniform_location, new_value) { gl.uniform4fv(uniform_location,       new_value); }
Engine.SC_VEC4_ARRAY    = function(gl, uniform_location, new_value) { gl.uniform4fv(uniform_location,       new_value); }
Engine.SC_COLOUR        = function(gl, uniform_location, new_value) { gl.uniform4fv(uniform_location,       new_value); }
Engine.SC_MATRIX4       = function(gl, uniform_location, new_value) { gl.uniformMatrix4fv(uniform_location, false, new_value); }

// *************************************
// State management
Engine.SetStateBool = function(state, new_value)
{
	if(new_value == this.StateTracking[state]) { return; }

	// Update state
	this.StateTracking[state] = new_value;
	if(new_value)
	{
		Engine.GL.enable(state);
	}
	else
	{
		Engine.GL.disable(state)
	}
}

Engine.EnableBlend = function(new_value)
{
	this.SetStateBool(Engine.GL.BLEND, new_value);
}

Engine.SetBlendMode = function(a, b, also_enable)
{
	Engine.GL.blendFunc(a, b);
	if(also_enable) { this.EnableBlend(true); }
}

Engine.EnableDepthTest = function(new_value)
{
	this.SetStateBool(Engine.GL.DEPTH_TEST, new_value);
}

Engine.SetDepthTestMode = function(mode, also_enable)
{
	Engine.GL.depthFunc(mode);
	if(also_enable) { this.EnableDepthTest(true); }
}

// *************************************
// Param editor
Engine.BuildParamEditor = function(shader_object)
{
	// Parse shader for [EDITOR] blocks
	var shader_params = { }; var match;
	var regex = /uniform float ([^;]*).* \[EDITOR\] (.*)/g;
	while(match = regex.exec(shader_object.code))
	{
		var entry = $.extend({ var_name : match[1] }, eval("(" + match[2] + ")"));
		if(!shader_params.hasOwnProperty(entry.group)) {shader_params[entry.group] = [] }
		shader_params[entry.group].push(entry);
	}

	// Build editor
	var editor = $("<div>", { id : "param_editor" });
	$.each(shader_params, function(group, entries)
	{
		var heading = $("<h2>", { text : group }).appendTo(editor);
		var table   = $("<table>").appendTo(editor);
		for(var i = 0; i < entries.length; ++i)
		{
			var row    = $("<tr>").appendTo(table);
			var call_l = $("<td>", { text : entries[i].label }).appendTo(row);
			var cell_r = $("<td>").appendTo(row);
			var slider = $("<div id='" + entries[i].var_name + "' style='width:200px'/>");
			slider.slider(entries[i]).appendTo(cell_r);
		}
	});
	return editor;
}

Engine.BindParamEditor = function(param_editor)
{
	var _this = this;
	param_editor.find("td div").each(function()
	{
		_this.SetShaderConstant($(this).attr("id"), $(this).slider("value"), Engine.SC_FLOAT);
	});
}

// *************************************
// Fullscreen mode
Engine.EnableFullScreen = function()
{
	var _this = this;
	var canvas = Engine.Canvas;

	// Cache the original size of the canvas
	var original_canvas_size  = Engine.Canvas.GetSize();

	// Handle transition between windowed / fullscreen
	var toggle_fullscreen = function(is_fullscreen)
	{
		_this.is_full_screen = is_fullscreen;
		Engine.Log(is_fullscreen? "Going full screen..." :
		                          "Going into windowed mode...");

		// Update canvas size accordingly
		canvas.width  = is_fullscreen? screen.width  : original_canvas_size[0];
		canvas.height = is_fullscreen? screen.height : original_canvas_size[1];

		// Update gl viewport to match canvas
		Engine.GL.viewport(0, 0, canvas.width, canvas.height);

		// If we have an active camera, let's update this to cope with the new canvas size
		if(_this.active_camera)
		{
			_this.active_camera.ResizeViewport(Engine.Canvas.GetSize());
		}
	};

	// Hookup event handlers
	document.onwebkitfullscreenchange = function() { toggle_fullscreen(document.webkitIsFullScreen); };
	document.onmozfullscreenchange = function() { toggle_fullscreen(document.mozFullScreenElement != null); };

	// Initiate transition to fullscreen mode
	if(canvas.webkitRequestFullScreen)
	{
		toggle_fullscreen(true); // Needed as Chrome doesn't fire first event
		canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
	}
	else
	{
		canvas.mozRequestFullScreen();
	}
}

Engine.IsFullScreen = function()
{
	return this.is_full_screen;
}

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
Engine.EnableContextMenu = function(do_enable)
{
	// Suppress canvas right-click context menu?
	Engine.Canvas.oncontextmenu = do_enable? null : function(e)
	{
		e.preventDefault();
	};
}

// *************************************
// EngineCameraBase
function EngineCameraBase()
{
	this.helpers  = [];
	this.mtx_view = mat4.create();
	this.mtx_proj = mat4.create();

	this.AttachHelper = function(helper_class)
	{
		this.helpers.push(helper_class);
	};

	this.Update = function(info)
	{
		// Run any helpers
		for(var i = 0; i < this.helpers.length; ++i)
		{
			this.helpers[i].Update(this, info);
		}

		// Update matrices
		this.UpdateMatrices();
	}
}

// *************************************
// EngineCameraOrtho
function EngineCameraOrtho(user_config)
{
	// Inherit base
	$.extend(this, new EngineCameraBase());

	// Set defaults
	this.position = [0, 0];
	this.size     = [512, 512];

	$.extend(this, user_config); // Override defaults
	this.UpdateMatrices();       // Run first update
}

EngineCameraOrtho.prototype.UpdateMatrices = function()
{
	mat4.identity(this.mtx_view);

	// Camera x/y represents bottom left of view region
	mat4.ortho(this.mtx_proj,
	           this.position[0], this.position[0] + this.size[0],
	           this.position[1], this.position[1] + this.size[1],
	           -1000.0, 1000.0);
}

EngineCameraOrtho.prototype.ResizeViewport = function(new_size)
{
	this.size = new_size;
}

// *************************************
// EngineCameraPersp
function EngineCameraPersp(user_config)
{
	// Inherit base
	$.extend(this, new EngineCameraBase());

	// Set defaults
	this.position = [0.0, 0.0, 0.0]; // Start at origin
	this.look_at  = [0.0, 0.0, 1.0]; // Looking down z-axis
	this.up       = [0.0, 1.0, 0.0]; // Default up
	this.fov      = 45.0;
	this.aspect   = 1.0;
	this.near     = 0.1;
	this.far      = 100;

	$.extend(this, user_config); // Override defaults
	this.UpdateMatrices();       // Run first update
}

EngineCameraPersp.prototype.UpdateMatrices = function()
{
	mat4.lookAt(this.mtx_view, this.position, this.look_at, this.up);
	mat4.perspective(this.mtx_proj, this.fov, this.aspect, this.near, this.far);
}

EngineCameraPersp.prototype.ResizeViewport = function(new_size)
{
	this.aspect = new_size[0] / new_size[1];
}

// *************************************
// EngineCamera Helpers
function EngineCameraHelper_Orbit(user_config)
{
	this.process_input = true;      // Update based on user input
	this.look_at       = [0.0, 0.0, 0.0]; // Look at origin
	this.up            = [0.0, 1.0, 0.0]; // Default up
	this.angles        = [0, 0];
	this.radius        = 5;
	this.min_y         = -(Math.PI / 2) + 0.1; // prevent alignment with -ve y-axis
	this.max_y         =  (Math.PI / 2) - 0.1; // prevent alignment with +ve y-axis

	// Override defaults
	$.extend(this, user_config);
}

EngineCameraHelper_Orbit.prototype.Update = function(camera, info)
{
	// Zoom
	var wheel_delta = info.mouse.GetWheelDelta();
	if(wheel_delta != 0) { this.radius -= wheel_delta * info.delta_s / 3; }

	// Pan
	if(info.mouse.IsPressed())
	{
		var mouse_delta = info.mouse.GetDelta();
		this.angles[0] += mouse_delta[0] * info.delta_s / 3;
		this.angles[1] = Engine.Clamp(this.angles[1] - mouse_delta[1] * info.delta_s / 3, this.min_y, this.max_y);
	}

	// Update
	camera.look_at  = this.look_at;
	camera.up       = this.up;
	camera.position = [this.look_at[0] + this.radius * Math.cos(this.angles[0]) * Math.cos(this.angles[1]),
	                   this.look_at[1] + this.radius * Math.sin(this.angles[1]),
	                   this.look_at[2] + this.radius * Math.sin(this.angles[0]) * Math.cos(this.angles[1])];
}