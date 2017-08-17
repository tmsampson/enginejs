// *******************************************
//# sourceURL=modules/enginejs-gfx.js
// *******************************************

Engine.Gfx =
{
	// **********************************************
	// Extensions
	// **********************************************
	Extension_Anisotropic_Filtering : null,

	// **********************************************
	// Init
	// **********************************************
	PreResourceLoadInit : function()
	{
		// Grab anisotropic filtering extension (if present)
		Engine.Gfx.Extension_Anisotropic_Filtering = Engine.GL.getExtension("EXT_texture_filter_anisotropic") ||
		                                             Engine.GL.getExtension("MOZ_EXT_texture_filter_anisotropic") ||
		                                             Engine.GL.getExtension("WEBKIT_EXT_texture_filter_anisotropic");

		// Grab depth textures (fallback to standard depth buffer where required)
		Engine.Gfx.Extension_Depth_Textures = Engine.GL.getExtension("WEBGL_depth_texture") ||
		                                      Engine.GL.getExtension("MOZ_WEBGL_depth_texture") ||
		                                      Engine.GL.getExtension("WEBKIT_WEBGL_depth_texture");

		// Extensions report
		Engine.Log("[extension] Anisotropic filtering: " + (Engine.Gfx.Extension_Anisotropic_Filtering? "ENABLED" : "DISABLED"));
		Engine.Log("[extension] Depth textures: " + (Engine.Gfx.Extension_Depth_Textures? "ENABLED" : "DISABLED"));
	},

	// **********************************************
	// Vertex buffer functionality
	// **********************************************
	CreateVertexBuffer : function(vertex_buffer_descriptor)
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
		var vertex_draw_mode = Engine.Gfx.DrawModeFromString["triangles"];
		if(vertex_buffer_descriptor.hasOwnProperty("draw_mode"))
		{
			vertex_draw_mode = Engine.Gfx.DrawModeFromString[vertex_buffer_descriptor.draw_mode];
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
	},

	UpdateDynamicVertexBuffer : function(vertex_buffer_object, vertex_buffer_descriptor)
	{
		var buffer_type = vertex_buffer_object.buffer_type;
		var is_index_buffer = (buffer_type == Engine.GL.ELEMENT_ARRAY_BUFFER);

		// Re-bind the buffer
		Engine.GL.bindBuffer(buffer_type, vertex_buffer_object.resource);

		// Update the data stream
		Engine.GL.bufferData(buffer_type, vertex_buffer_descriptor.stream, Engine.GL.DYNAMIC_DRAW);
	},

	BindVertexBuffer : function(vertex_buffer_object)
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
	},

	// **********************************************
	// Shader functionality
	// **********************************************
	LoadShader : function(descriptor, callback)
	{
		// Setup pre-processor defines...
		var defines = (descriptor.define)? descriptor.define : [];

		Engine.Net.FetchResource(descriptor.file, function(shader_code)
		{
			var extension = descriptor.file.split('.').pop();
			var shader_object = (extension == "vs")? Engine.Gfx.CompileVertexShader(shader_code, defines) :
			                                         Engine.Gfx.CompileFragmentShader(shader_code, defines);

			if(shader_object)
			{
				Engine.Log("Successfully loaded shader: " + descriptor.file);
			}

			callback(shader_object);
		});
	},

	CompileVertexShader : function(code, defines)
	{
		return Engine.Gfx.CompileShader(code, Engine.GL.VERTEX_SHADER, defines);
	},

	CompileFragmentShader : function(code, defines)
	{
		return Engine.Gfx.CompileShader(code, Engine.GL.FRAGMENT_SHADER, defines);
	},

	CompileShader : function(shader_code, shader_type, shader_defines)
	{
		var shader_resource = Engine.GL.createShader(shader_type);

		// Add pre-processor defines...
		$.each(shader_defines, function(idx, definition)
		{
			shader_code = "#define " + definition + "\n" + shader_code;
		});

		// Extract property information (fragment shader only)
		var shader_property_info;
		var property_info_start_token = "#if PROPERTY_INFO";
		if(shader_type == Engine.GL.FRAGMENT_SHADER)
		{
			var start = shader_code.indexOf(property_info_start_token);
			if(start != -1)
			{
				var property_info_end_token = "#endif";
				var property_info_end_token_length = property_info_end_token.length;
				var end = shader_code.indexOf(property_info_end_token, start);
				if(end == -1)
				{
					Engine.LogError("Failed compiling shader: PROPERTY_INFO missing #endif");
					return;
				}

				end += property_info_end_token_length; // include end token in match
				var property_info_block = shader_code.substring(start, end);
				shader_code = shader_code.replace(property_info_block, "");

				// Parse property info JSON
				var property_info_json = property_info_block.replace(property_info_start_token, "");
				property_info_json = property_info_json.replace(property_info_end_token, "");
				try
				{
					shader_property_info = Engine.Util.ParseJSON(property_info_json, true);
				}
				catch(e)
				{
					Engine.LogError("Failed compiling shader: PROPERTY_INFO syntax error " + e);
				}

				// Parse uniforms and build name --> type lookup
				var uniform_regex = /uniform\s(\w*)\s+(\w*)(\s)?;/g; var match;
				var uniform_name_to_type = { };
				while (match = uniform_regex.exec(shader_code))
				{
					var uniform_type = match[1];
					var uniform_name = match[2];
					uniform_name_to_type[uniform_name] = uniform_type;
				}

				// Cross reference properties with uniforms and deduce types / setter functions
				for (var property_name in shader_property_info)
				{
					if (!shader_property_info.hasOwnProperty(property_name))
						continue;
					var property_info = shader_property_info[property_name];
					if(!uniform_name_to_type.hasOwnProperty(property_name))
					{
						Engine.LogError("Failed compiling shader: PROPERTY_INFO property '" + property_name + "' has no matching uniform");
						continue;
					}
					property_info.type = uniform_name_to_type[property_name];
					if(!Engine.Gfx.ShaderPropertySetterFuncFromString.hasOwnProperty(property_info.type))
					{
						Engine.LogError("Failed compiling shader: PROPERTY_INFO property '" + property_name + "' unknown uniform type: " + property_info.type);
						continue;
					}
					property_info.setter_func = Engine.Gfx.ShaderPropertySetterFuncFromString[property_info.type];
				}
			}
		}

		// Compile code
		Engine.GL.shaderSource(shader_resource, shader_code);
		Engine.GL.compileShader(shader_resource);
		var success = Engine.GL.getShaderParameter(shader_resource, Engine.GL.COMPILE_STATUS);

		// Return shader object
		var shader_object =
		{
			resource      : success? shader_resource : null,
			type          : shader_type,
			code          : shader_code,
			defines       : shader_defines,
			property_info : shader_property_info
		};

		// Report errors?
		if(!success)
		{
			var error_msg = "Failed compiling shader: " + Engine.GL.getShaderInfoLog(shader_resource);
			Engine.LogError(error_msg);
		}

		return success? shader_object : null;
	},

	CreateShaderProgram : function(vertex_shader, fragment_shader)
	{
		// Generate a name for this resource based on MD5 of both shaders
		var uid = Engine.Util.MD5([vertex_shader, fragment_shader]);
		if(uid in Engine.Gfx.ShaderProgramCache) { return Engine.Gfx.ShaderProgramCache[uid]; }

		// Create new shader program
		var shader_program = Engine.GL.createProgram();
		Engine.GL.attachShader(shader_program, vertex_shader.resource);
		Engine.GL.attachShader(shader_program, fragment_shader.resource);
		Engine.GL.linkProgram(shader_program);
		var success = Engine.GL.getProgramParameter(shader_program, Engine.GL.LINK_STATUS);

		// Select names for vert/frag shaders (use filename or fall-back to "?")
		var vertex_shader_name = Engine.Util.IsDefined(vertex_shader.descriptor)? vertex_shader.descriptor.file : "?";
		var fragment_shader_name = Engine.Util.IsDefined(fragment_shader.descriptor)? fragment_shader.descriptor.file : "?";

		// Create shader program object
		var id_string = uid + " (" + vertex_shader_name + " --> " + fragment_shader_name + ")";
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
			Engine.Gfx.ShaderProgramCache[uid] = shader_program_object;
		}
		else
		{
			Engine.LogError(shader_program_object.error_msg);
			Engine.LogError(Engine.GL.getProgramInfoLog(shader_program));
		}

		return shader_program_object;
	},

	BindShaderProgram : function(program)
	{
		this.current_shader_program = program;
		Engine.GL.useProgram(program.resource);

		// Bind camera?
		if(this.active_camera)
		{
			this.SetShaderProperty("u_cam_pos", this.active_camera.position, Engine.Gfx.SP_VEC3, true);
			this.SetShaderProperty("u_trans_view", this.active_camera.mtx_view, Engine.Gfx.SP_MATRIX4, true);
			this.SetShaderProperty("u_trans_view_inverse", this.active_camera.mtx_view_inverse, Engine.Gfx.SP_MATRIX4, true);
			this.SetShaderProperty("u_trans_proj", this.active_camera.mtx_proj, Engine.Gfx.SP_MATRIX4, true);
		}
		
		// Set time
		this.SetShaderProperty("u_time", Engine.Time.elapsed_s, Engine.Gfx.SP_FLOAT, true);
	},

	SetShaderProperty : function(constant_name, constant_value, setter_func, ignore_errors)
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

			// Cache for later?
			if(uniform_location != null)
			{
				program.uniform_location_cache[constant_name] = uniform_location;
			}
		}

		// Set the constant
		if(uniform_location != null)
		{
			setter_func(Engine.GL, uniform_location, constant_value);
		}
		else if(!ignore_errors)
		{
			Engine.LogErrorOnce("Failed setting shader constant: " + constant_name);
		}
	},

	// **********************************************
	// Texture functionality
	// **********************************************
	LoadTexture : function(descriptor, callback)
	{
		var img_object = new Image();

		// Handle success
		img_object.onload = function()
		{
			// Create gl texture
			var texture_object =
			{
				resource   : Engine.GL.createTexture(),
				width      : this.width,
				height     : this.height,
				descriptor : descriptor,
				is_npot    : !Engine.Math.IsPowerOfTwo(this.width) || !Engine.Math.IsPowerOfTwo(this.height),
				img_object : img_object
			};

			// Warn about N.P.O.T (Non Power of Two) textures
			if(texture_object.is_npot)
			{
				Engine.LogWarning(descriptor.file + " texture dimensions not a power of two. Mipmapping & tiling will be disabled!");
			}

			// Bind
			Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, texture_object.resource);

			// Setup params
			Engine.GL.texImage2D(Engine.GL.TEXTURE_2D, 0, Engine.GL.RGBA, Engine.GL.RGBA, Engine.GL.UNSIGNED_BYTE, img_object);

			// Generate mip chain?
			if(!texture_object.is_npot)
			{
				Engine.GL.generateMipmap(Engine.GL.TEXTURE_2D);
				Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MAG_FILTER, Engine.GL.LINEAR);
				Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MIN_FILTER, Engine.GL.LINEAR_MIPMAP_NEAREST);
			}
			else
			{
				Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MAG_FILTER, Engine.GL.LINEAR);
				Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MIN_FILTER, Engine.GL.LINEAR);
			}

			// Set uv wrap mode
			if(!texture_object.is_npot)
			{
				Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_WRAP_S, Engine.GL.REPEAT);
				Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_WRAP_T, Engine.GL.REPEAT);
			}
			else
			{
				Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_WRAP_S, Engine.GL.CLAMP_TO_EDGE);
				Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_WRAP_T, Engine.GL.CLAMP_TO_EDGE);
			}
			

			// Enable anisotropic filtering?
			if(Engine.Gfx.Extension_Anisotropic_Filtering)
			{
				Engine.GL.texParameterf(Engine.GL.TEXTURE_2D, Engine.Gfx.Extension_Anisotropic_Filtering.TEXTURE_MAX_ANISOTROPY_EXT, 4);
			}

			// Unbind
			Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, null);

			// Done
			callback(texture_object);
		};

		// Handle errors
		img_object.onerror = function()
		{
			var error_msg = "Failed loading texture: " + descriptor.file;
			Engine.LogError(error_msg);
			callback({});
		};

		// Initiate load
		img_object.src = descriptor.file;
	},

	BindTexture : function(texture, idx, sampler_name)
	{
		// We support binding by our texture (wrapper) object or raw WebGL texture
		var tx_resource = texture.hasOwnProperty("resource")? texture.resource :
		                                                      texture;

		// If no sampler name is specified use default based on index e.g. "u_tx0"
		if(sampler_name == undefined) { sampler_name = ("u_tx" + idx); }

		// Bind texture
		Engine.GL.activeTexture(Engine.GL.TEXTURE0 + idx);
		Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, tx_resource);
		this.SetShaderProperty(sampler_name, idx, Engine.Gfx.SP_SAMPLER);
	},

	BindCubeMap : function(cube_map, idx, sampler_name)
	{
		// We support binding by our cube-map (wrapper) object or raw WebGL cube-map texture
		var cube_map_resource = cube_map.hasOwnProperty("resource")? cube_map.resource :
		                                                             cube_map;

		// If no sampler name is specified use default based on index e.g. "u_tx0"
		if(sampler_name == undefined) { sampler_name = ("u_tx" + idx); }

		// Bind texture
		Engine.GL.activeTexture(Engine.GL.TEXTURE0 + idx);
		Engine.GL.bindTexture(Engine.GL.TEXTURE_CUBE_MAP, cube_map_resource);
		this.SetShaderProperty(sampler_name, idx, Engine.Gfx.SP_SAMPLER_CUBE);
	},

	BindTextureArray : function(texture_array, sampler_name)
	{
		// If no sampler name is specified use default sampler array
		if(sampler_name == undefined) { sampler_name = ("u_tx"); }

		// Bind textures
		var sampler_indices = [];
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
		this.SetShaderProperty(sampler_name, sampler_indices, Engine.Gfx.SP_SAMPLER_ARRAY);
	},

	SetTextureFiltering : function(mag, min)
	{
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MAG_FILTER, mag);
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MIN_FILTER, min);
	},

	// **********************************************
	// Cube / reflection map functionality
	// **********************************************
	LoadCubeMap : function(descriptor, callback)
	{
		Engine.Net.FetchResource(descriptor.file, function(cubemap_json)
		{
			var cubemap = Engine.Util.ParseJSON(cubemap_json, true);

			// Load in textures
			Engine.Resource.LoadBatch(cubemap.textures, function()
			{
				// Ensure each face texture is present
				if(!Engine.Util.IsDefined(cubemap.textures.tx_left))   { Engine.LogError("Cubemap missing left face texture");  return; }
				if(!Engine.Util.IsDefined(cubemap.textures.tx_right))  { Engine.LogError("Cubemap missing right face texture");  return; }
				if(!Engine.Util.IsDefined(cubemap.textures.tx_top))    { Engine.LogError("Cubemap missing top face texture"); return; }
				if(!Engine.Util.IsDefined(cubemap.textures.tx_bottom)) { Engine.LogError("Cubemap missing bottom face texture");  return; }
				if(!Engine.Util.IsDefined(cubemap.textures.tx_front))  { Engine.LogError("Cubemap missing front face texture");  return; }
				if(!Engine.Util.IsDefined(cubemap.textures.tx_back))   { Engine.LogError("Cubemap missing back face texture");  return; }

				// Setup & bind cubemap texture
				var cubemap_texture = Engine.GL.createTexture();
				Engine.GL.bindTexture(Engine.GL.TEXTURE_CUBE_MAP, cubemap_texture);

				// Add faces textures to cubemap
				Engine.GL.texImage2D(Engine.GL.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, Engine.GL.RGBA, Engine.GL.RGBA, Engine.GL.UNSIGNED_BYTE, cubemap.textures.tx_left.img_object);
				Engine.GL.texImage2D(Engine.GL.TEXTURE_CUBE_MAP_POSITIVE_X, 0, Engine.GL.RGBA, Engine.GL.RGBA, Engine.GL.UNSIGNED_BYTE, cubemap.textures.tx_right.img_object);
				Engine.GL.texImage2D(Engine.GL.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, Engine.GL.RGBA, Engine.GL.RGBA, Engine.GL.UNSIGNED_BYTE, cubemap.textures.tx_bottom.img_object);
				Engine.GL.texImage2D(Engine.GL.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, Engine.GL.RGBA, Engine.GL.RGBA, Engine.GL.UNSIGNED_BYTE, cubemap.textures.tx_top.img_object);
				Engine.GL.texImage2D(Engine.GL.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, Engine.GL.RGBA, Engine.GL.RGBA, Engine.GL.UNSIGNED_BYTE, cubemap.textures.tx_front.img_object);
				Engine.GL.texImage2D(Engine.GL.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, Engine.GL.RGBA, Engine.GL.RGBA, Engine.GL.UNSIGNED_BYTE, cubemap.textures.tx_back.img_object);

				// Configure cubemap texture
				Engine.GL.texParameteri(Engine.GL.TEXTURE_CUBE_MAP, Engine.GL.TEXTURE_MAG_FILTER, Engine.GL.LINEAR);
				Engine.GL.texParameteri(Engine.GL.TEXTURE_CUBE_MAP, Engine.GL.TEXTURE_MIN_FILTER, Engine.GL.LINEAR);
				Engine.GL.texParameteri(Engine.GL.TEXTURE_CUBE_MAP, Engine.GL.TEXTURE_WRAP_S, Engine.GL.CLAMP_TO_EDGE);
				Engine.GL.texParameteri(Engine.GL.TEXTURE_CUBE_MAP, Engine.GL.TEXTURE_WRAP_T, Engine.GL.CLAMP_TO_EDGE);

				// Create cubemap object
				var cubemap_object =
				{
					descriptor    : descriptor,
					resource      : cubemap_texture,
					face_textures : cubemap.textures
				};

				// Return cubemap resource
				callback(cubemap_object);
			});
		});
	},

	// **********************************************
	// Material functionality
	// **********************************************
	SetDirectionalLight : function(directional_light)
	{
		this.directional_light = directional_light;
	},

	SetShadowParams : function(shadow_map_rt, shadow_map_type, shadow_map_mtx)
	{
		this.shadow_map_rt = shadow_map_rt;
		this.shadow_map_type = shadow_map_type;
		this.shadow_map_mtx = shadow_map_mtx;
	},

	BindMaterial : function(material, use_shadows)
	{
		material.Bind(this.directional_light, use_shadows);
	},

	// **********************************************
	// Render target functionality
	// **********************************************
	CreateRenderTarget : function(rt_name, rt_width, rt_height, want_depth_buffer)
	{
		// Setup render target object
		var rt_object =
		{
			name         : rt_name,
			size         : [rt_width, rt_height]
		};

		// Create main buffer
		rt_object.buffer = Engine.GL.createFramebuffer();
		Engine.GL.bindFramebuffer(Engine.GL.FRAMEBUFFER, rt_object.buffer);

		// Create main texture
		rt_object.texture = this.CreateTexture(rt_width, rt_height);

		// Bind main buffer and texture
		Engine.GL.framebufferTexture2D(Engine.GL.FRAMEBUFFER, Engine.GL.COLOR_ATTACHMENT0, Engine.GL.TEXTURE_2D, rt_object.texture, 0);

		// Need a depth buffer?
		var rt_depth_buffer = null;
		if(want_depth_buffer)
		{
			// Try and use depth texture (facilitates binding to shader input via sampler2D), or fallback to regular depth buffer
			if(Engine.Gfx.Extension_Depth_Textures != null)
			{
				// Create and attach depth texture
				rt_object.depth_texture = Engine.Gfx.CreateDepthTexture(rt_width, rt_height);
				Engine.GL.framebufferTexture2D(Engine.GL.FRAMEBUFFER, Engine.GL.DEPTH_ATTACHMENT, Engine.GL.TEXTURE_2D, rt_object.depth_texture, 0);
			}
			else
			{
				// Create and attach depth buffer
				rt_object.depth_buffer = Engine.GL.createRenderbuffer();
				Engine.GL.bindRenderbuffer(Engine.GL.RENDERBUFFER, rt_depth_buffer);
				Engine.GL.renderbufferStorage(Engine.GL.RENDERBUFFER, Engine.GL.DEPTH_COMPONENT16, rt_width, rt_height);
				Engine.GL.framebufferRenderbuffer(Engine.GL.FRAMEBUFFER, Engine.GL.DEPTH_ATTACHMENT, Engine.GL.RENDERBUFFER, rt_depth_buffer);
				Engine.GL.bindRenderbuffer(Engine.GL.RENDERBUFFER, null);
			}
		}

		// Done (unbind for now)
		Engine.GL.bindFramebuffer(Engine.GL.FRAMEBUFFER, null);

		// Register and return render target object
		this.render_targets[rt_name] = rt_object;
		return rt_object;
	},

	CreateTexture : function(width, height)
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
	},

	CreateDepthTexture : function(width, height)
	{
		// Create
		var depth_texture = Engine.GL.createTexture();

		// Create and attach depth texture
		Engine.GL.bindTexture(Engine.GL.TEXTURE_2D, depth_texture);
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MAG_FILTER, Engine.GL.NEAREST);
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_MIN_FILTER, Engine.GL.NEAREST);
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_WRAP_S, Engine.GL.CLAMP_TO_EDGE);
		Engine.GL.texParameteri(Engine.GL.TEXTURE_2D, Engine.GL.TEXTURE_WRAP_T, Engine.GL.CLAMP_TO_EDGE);
		Engine.GL.texImage2D(Engine.GL.TEXTURE_2D, 0, Engine.GL.DEPTH_COMPONENT, width, height, 0, Engine.GL.DEPTH_COMPONENT, Engine.GL.UNSIGNED_SHORT, null);
		return depth_texture;
	},

	BindRenderTarget : function(render_target)
	{
		// Bind render target
		this.active_render_target = render_target;
		Engine.GL.bindFramebuffer(Engine.GL.FRAMEBUFFER, render_target.buffer);

		// Bind depth buffer?
		// Note: If depth textures are enabled, the depth texture associated with the render target will have been
		//       automatically bound above when the render target is bound. Otherwise we bind the separate depth "buffer" below...
		if(!render_target.depth_buffer == null)
		{
			Engine.GL.bindRenderbuffer(Engine.GL.RENDERBUFFER, render_target.depth_buffer);
		}
	},

	UnBindRenderTarget : function(render_target)
	{
		this.active_render_target = null;
		Engine.GL.bindFramebuffer(Engine.GL.FRAMEBUFFER, null);
	},

	// **********************************************
	// Model functionality
	// **********************************************
	DrawModel : function(model, world_mtx, bind_materials, bind_shadow_map, submit_geometry)
	{
		// Possible use cases:
		// 		DrawModel(my_model)                              // kinda lazy, no matrix specified, default to identity
		// 		DrawModel(my_model, my_mtx)                      // "normal" usage
		// 		DrawModel(my_model, my_mtx, false)               // I bound my shader + uniforms + matrices + textures manually upfront, don't try and do this for me! (my_mtx will be ignored)
		// 		DrawModel(my_model, null, false)                 // I bound my shader + uniforms + matrices + textures manually upfront, don't try and do this for me!
		// 		DrawModel(my_model, my_mtx, false, false, false) // I bound my shader + uniforms + matrices + textures manually upfront, and plan to submit the geometry myself next! (perhaps mutliple times with slightly different uniforms?)
		// 		DrawModel(my_model, my_mtx, true, true, false)   // Bit odd, maybe I want to manually submit the geometry several times with the same materials bound?

		// Setup defaults
		world_mtx = Engine.Util.IsDefined(world_mtx)? world_mtx : Engine.Math.IdentityMatrix;
		bind_materials = Engine.Util.IsDefined(bind_materials)? bind_materials : true;
		bind_shadow_map = Engine.Util.IsDefined(bind_shadow_map)? bind_shadow_map : true;
		submit_geometry = Engine.Util.IsDefined(submit_geometry)? submit_geometry : true;

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

			// Bind material?
			if(bind_materials)
			{
				var material = Engine.Util.IsDefined(prims[i].material)? prims[i].material : Engine.Resources["mat_standard_missing"];
				Engine.Gfx.BindMaterial(material, bind_shadow_map);
			}

			// Set world matrix?
			if(world_mtx != null)
			{
				Engine.Gfx.SetShaderProperty("u_trans_world", world_mtx, Engine.Gfx.SP_MATRIX4);
			}

			// Bind shadow map?
			if(bind_shadow_map && Engine.Gfx.shadow_map_rt != null)
			{
				// Bind shadow map texture (depth only)
				Engine.Gfx.BindTexture(Engine.Gfx.shadow_map_rt.depth_texture, 3, "u_shadow_map");

				// Bind shadow map uniforms
				Engine.Gfx.SetShaderProperty("u_shadow_type", Engine.Gfx.shadow_map_type, Engine.Gfx.SP_INT)
				Engine.Gfx.SetShaderProperty("u_trans_shadow", Engine.Gfx.shadow_map_mtx, Engine.Gfx.SP_MATRIX4);
			}

			// Submit geometry for drawing?
			if(submit_geometry)
			{
				this.DrawArray();
			}
		}

		return true;
	},

	// **********************************************
	// Draw functionality
	// **********************************************
	Clear : function(colour)
	{
		Engine.GL.clearColor(colour[0], colour[1], colour[2], colour[3]);
		Engine.GL.clear(Engine.GL.COLOR_BUFFER_BIT | Engine.GL.DEPTH_BUFFER_BIT);
	},

	DrawArray : function(optional_offset, optional_count, override_drawmode)
	{
		var wireframe = (this.wireframe_mode || this.force_wireframe_mode);
		var draw_mode = wireframe? Engine.GL.LINE_LOOP : this.current_vertex_buffer_object.draw_mode;
		var is_index_buffer = (this.current_vertex_buffer_object.buffer_type  == Engine.GL.ELEMENT_ARRAY_BUFFER);

		// Override draw mode?
		if(!wireframe && override_drawmode)
		{
			draw_mode = Engine.Gfx.DrawModeFromString[override_drawmode];
		}

		// Calculate offset / count (by default draw the whole buffer)
		var offset = optional_offset || 0;
		var count  = optional_count  || this.current_vertex_buffer_object.item_count;

		// Set face culling
		var enable_backface_culling = (draw_mode == Engine.GL.TRIANGLES);
		Engine.GL.cullFace(Engine.GL.BACK);
		if(enable_backface_culling)
		{
			Engine.GL.enable(Engine.GL.CULL_FACE);
		}
		else
		{
			Engine.GL.disable(Engine.GL.CULL_FACE);
		}

		if(is_index_buffer)
		{
			// Draw indexed
			Engine.GL.drawElements(draw_mode, count, Engine.GL.UNSIGNED_SHORT, offset);
		}
		else
		{
			// Draw non-indexed
			Engine.GL.drawArrays(draw_mode, offset, count);
		}
	},

	DrawQuad : function(bind_only)
	{
		this.DrawModel(Engine.Resources["mdl_quad"], null, false, false, !bind_only);
	},

	// **********************************************
	// State tracking
	// **********************************************
	StateTracking : { },
	SetStateBool : function(state, new_value)
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
	},

	// **********************************************
	// State management
	// **********************************************
	EnableBlend : function(new_value)
	{
		this.SetStateBool(Engine.GL.BLEND, new_value);
	},

	SetBlendMode : function(a, b, also_enable)
	{
		Engine.GL.blendFunc(a, b);
		if(also_enable) { this.EnableBlend(true); }
	},

	EnableDepthTest : function(new_value)
	{
		this.SetStateBool(Engine.GL.DEPTH_TEST, new_value);
	},

	SetDepthTestMode : function(mode, also_enable)
	{
		Engine.GL.depthFunc(mode);
		if(also_enable) { this.EnableDepthTest(true); }
	},

	// **********************************************
	// Misc
	// **********************************************
	Update : function()
	{
		// Toggle wireframe mode?
		if(Engine.Keyboard.IsPressed("f9", true))
		{
			this.force_wireframe_mode = !this.force_wireframe_mode;
		}
	},

	BindCamera : function(cam)
	{
		this.active_camera = cam;

		// Bind viewport for subsequent draw calls
		var render_target_size = (this.active_render_target == null)? Engine.Canvas.GetSize() : this.active_render_target.size;
		cam.BindViewport(render_target_size);
	},

	GetActiveCamera : function()
	{
		return this.active_camera;
	},

	EnableWireframeMode : function(do_enable)
	{
		this.wireframe_mode = do_enable;
	},

	ResizeViewport : function()
	{
		// Update gl viewport to match canvas if no camera is in use
		if(!this.active_camera)
		{
			Engine.GL.viewport(0, 0, Engine.Canvas.GetWidth(), Engine.Canvas.GetHeight());
		}
	},

	// **********************************************
	// Properties
	// **********************************************
	active_camera        : null,  // Used to bind with shader uniforms
	wireframe_mode       : false, // Per draw-call
	force_wireframe_mode : false, // Override all draw calls
	directional_light    :        // Used by material system / shaders
	{
		direction  : [ 0, -1, 0 ],
		colour     : [ 0.7, 0.7, 0.7 ],
	},

	// **********************************************
	// Shadow stuff (WIP)
	// **********************************************
	shadow_map_rt       : null,
	shadow_map_type     : 0,
	shadow_map_mtx      : null,

	// **********************************************
	// Look up tables
	// **********************************************
	DrawModeFromString :
	{
		"triangle"        : Engine.GL.TRIANGLES,
		"triangles"       : Engine.GL.TRIANGLES,
		"triangle_strip"  : Engine.GL.TRIANGLE_STRIP,
		"triangle_strips" : Engine.GL.TRIANGLE_STRIP,
		"triangle_fan"    : Engine.GL.TRIANGLE_FAN,
		"triangle_fans"   : Engine.GL.TRIANGLE_FAN,
		"lines"           : Engine.GL.LINES
	},

	ShaderPropertySetterFuncFromString : { },

	// *************************************
	// Uniform setter functions (passed to SetShaderProperty)
	SP_FLOAT         : function(gl, uniform_location, new_value) { gl.uniform1f(uniform_location,        new_value); },
	SP_FLOAT_ARRAY   : function(gl, uniform_location, new_value) { gl.uniform1fv(uniform_location,       new_value); },
	SP_INT           : function(gl, uniform_location, new_value) { gl.uniform1i(uniform_location,        new_value); },
	SP_INT_ARRAY     : function(gl, uniform_location, new_value) { gl.uniform1iv(uniform_location,       new_value); },
	SP_SAMPLER       : function(gl, uniform_location, new_value) { gl.uniform1i(uniform_location,        new_value); },
	SP_SAMPLER_ARRAY : function(gl, uniform_location, new_value) { gl.uniform1iv(uniform_location,       new_value); },
	SP_SAMPLER_CUBE  : function(gl, uniform_location, new_value) { gl.uniform1i(uniform_location,        new_value); },
	SP_VEC2          : function(gl, uniform_location, new_value) { gl.uniform2fv(uniform_location,       new_value); },
	SP_VEC2_ARRAY    : function(gl, uniform_location, new_value) { gl.uniform2fv(uniform_location,       new_value); },
	SP_VEC3          : function(gl, uniform_location, new_value) { gl.uniform3fv(uniform_location,       new_value); },
	SP_VEC3_ARRAY    : function(gl, uniform_location, new_value) { gl.uniform3fv(uniform_location,       new_value); },
	SP_VEC4          : function(gl, uniform_location, new_value) { gl.uniform4fv(uniform_location,       new_value); },
	SP_VEC4_ARRAY    : function(gl, uniform_location, new_value) { gl.uniform4fv(uniform_location,       new_value); },
	SP_COLOUR        : function(gl, uniform_location, new_value) { gl.uniform4fv(uniform_location,       new_value); },
	SP_MATRIX3       : function(gl, uniform_location, new_value) { gl.uniformMatrix3fv(uniform_location, false, new_value); },
	SP_MATRIX4       : function(gl, uniform_location, new_value) { gl.uniformMatrix4fv(uniform_location, false, new_value); },

	// **********************************************
	// Cache
	// **********************************************
	ShaderProgramCache : { },

	// **********************************************
	// Render targets
	active_render_target : null,
	render_targets       : [],

	// **********************************************
	// Scratch pad
	// **********************************************
	mtx4_scratch : mat4.create(),
};

// **********************************************
// Init
// **********************************************
Engine.Gfx.StateTracking[Engine.GL.BLEND]      = 0;
Engine.Gfx.StateTracking[Engine.GL.DEPTH_TEST] = 0;
Engine.Gfx.ResizeViewport();

Engine.Gfx.ShaderPropertySetterFuncFromString =
{
	"float"     : Engine.Gfx.SP_FLOAT,
	"int"       : Engine.Gfx.SP_INT,
	"sampler2D" : Engine.Gfx.SP_SAMPLER,
	"vec2"      : Engine.Gfx.SP_VEC2,
	"vec3"      : Engine.Gfx.SP_VEC3,
	"vec4"      : Engine.Gfx.SP_VEC4,
	"mat3"      : Engine.Gfx.SP_MATRIX3,
	"mat4"      : Engine.Gfx.SP_MATRIX4
};

// Texture resource loading
Engine.Resource.RegisterLoadFunction("png", Engine.Gfx.LoadTexture);
Engine.Resource.RegisterLoadFunction("jpg", Engine.Gfx.LoadTexture);
Engine.Resource.RegisterLoadFunction("bmp", Engine.Gfx.LoadTexture);
Engine.Resource.RegisterLoadFunction("tga", Engine.Gfx.LoadTexture);

// Cube / reflection map loading
Engine.Resource.RegisterLoadFunction("cubemap", Engine.Gfx.LoadCubeMap);

// Vertex / fragment shader resource loading
Engine.Resource.RegisterLoadFunction("vs",  Engine.Gfx.LoadShader);
Engine.Resource.RegisterLoadFunction("fs",  Engine.Gfx.LoadShader);