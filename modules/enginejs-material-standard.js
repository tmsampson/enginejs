// **************************************************
//# sourceURL=modules/enginejs-material-standard.js
// **************************************************

Engine.Gfx.Material = function(prevent_default)
{
	this.version        = 1.0;
	this.name           = "Unknown";
	this.type           = "standard";
	this.shader         = null; // fragment shader
	this.shader_program = null; // compiled shader program
	this.shader_defines = [ ];
	this.config         = { };
	this.properties     = { };

	// Unless otherwise specified, new materials should be constructed by copying the default material
	if(!prevent_default)
	{
		$.extend(true, this, Engine.Resources["mat_standard_default"]);
	}

	this.InitStandardShader = function()
	{
		// Select shader permutation
		var shader_name = "fs_mat_standard_amb";
		if(this.config.lighting_enabled)
		{
			// Diffuse
			shader_name += "_lit";

			// Specular
			if(Engine.Util.IsDefined(this.config.specular_enabled) && this.config.specular_enabled)
			{
				shader_name += "_spec";
				this.config.uses_specular_map = Engine.Util.IsDefined(this.properties.sampler2D) && this.properties.sampler2D.specular_map != null;
				shader_name += this.config.uses_specular_map? "_specmap" : "";
			}

			// Normals
			this.config.uses_normal_map = Engine.Util.IsDefined(this.properties.sampler2D) && this.properties.sampler2D.normal_map != null;
			shader_name += this.config.uses_normal_map? "_normalmap" : "";
		}

		// Fresnel
		shader_name += Engine.Util.IsDefined(this.config.fresnel_enabled) && this.config.fresnel_enabled? "_fresnel" : ""

		// Catch bad shader permutations
		if(!Engine.Util.IsDefined(Engine.Resources[shader_name]))
		{
			Engine.LogError("Could not find shader permutation '" + shader_name + "'");
			return;
		}

		// Apply shader
		this.shader_perumation = shader_name;
		this.shader = Engine.Resources[shader_name]; 					  // Select pre-compiled permutation
		this.shader_shadowed = Engine.Resources[shader_name + "_shadow"]; // Select pre-compiled permutation with shadows enabled
		this.shader_program = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_general_transformed_uv_normals_tangents"],
		                                                     this.shader);
		this.shader_program_shadowed = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_general_transformed_uv_normals_tangents_shadow"],
		                                                     this.shader_shadowed);
	};

	this.Bind = function(sun, enable_shadows)
	{
		// 1. Bind shader
		if(enable_shadows && this.shader_program_shadowed != null)
		{
			// Shadows
			Engine.Gfx.BindShaderProgram(this.shader_program_shadowed);
			Engine.Gfx.SetShaderProperty("u_shadow_map_size", [1024, 1024], Engine.Gfx.SP_VEC2, true);
		}
		else
		{
			// No shadows
			Engine.Gfx.BindShaderProgram(this.shader_program);
		}

		// 2. Bind sun params
		Engine.Gfx.SetShaderProperty("u_sun_colour", sun.colour, Engine.Gfx.SP_VEC3, true);
		Engine.Gfx.SetShaderProperty("u_sun_dir", sun.direction, Engine.Gfx.SP_VEC3, true);

		// 3. Bind material properties
		if(this.type == "standard")
		{
			this.BindStandardProperties();
		}
		else
		{
			this.BindProperties();
		}
	};

	this.BindStandardProperties = function()
	{
		// 1. Bind albedo
		Engine.Gfx.SetShaderProperty("albedo_colour", this.properties.vec4.albedo_colour, Engine.Gfx.SP_VEC4);
		Engine.Gfx.BindTexture(this.properties.sampler2D.albedo_map, 0, "albedo_map");
		Engine.Gfx.SetShaderProperty("albedo_map_repeat", this.properties.vec2.albedo_map_repeat, Engine.Gfx.SP_VEC2);

		// 2. Bind specular params / map?
		Engine.Gfx.SetShaderProperty("specular_colour", this.properties.vec4.specular_colour, Engine.Gfx.SP_VEC4);
		Engine.Gfx.SetShaderProperty("specular_shininess",  this.properties.float.specular_shininess, Engine.Gfx.SP_FLOAT);
		if(this.config.uses_specular_map)
		{
			Engine.Gfx.BindTexture(this.properties.sampler2D.specular_map, 1, "specular_map");
			Engine.Gfx.SetShaderProperty("specular_map_repeat", this.properties.vec2.specular_map_repeat, Engine.Gfx.SP_VEC2);
		}

		// 3. Bind normal params / map?
		if(this.config.uses_normal_map)
		{
			Engine.Gfx.BindTexture(this.properties.sampler2D.normal_map, 2, "normal_map");
			Engine.Gfx.SetShaderProperty("normal_map_repeat", this.properties.vec2.normal_map_repeat, Engine.Gfx.SP_VEC2);
			Engine.Gfx.SetShaderProperty("normal_strength", this.properties.float.normal_strength, Engine.Gfx.SP_FLOAT);
		}

		// 4. Bind fresnel params?
		if(this.config.fresnel_enabled)
		{
			Engine.Gfx.SetShaderProperty("fresnel_colour", this.properties.vec4.fresnel_colour, Engine.Gfx.SP_VEC4);
			Engine.Gfx.SetShaderProperty("fresnel_scale", this.properties.float.fresnel_scale, Engine.Gfx.SP_FLOAT);
			Engine.Gfx.SetShaderProperty("fresnel_bias", this.properties.float.fresnel_bias, Engine.Gfx.SP_FLOAT);
			Engine.Gfx.SetShaderProperty("fresnel_power", this.properties.float.fresnel_power, Engine.Gfx.SP_FLOAT);
		}
	}

	this.BindProperties = function()
	{
		// Bind textures
		var texture_slot = 0;
		for (var property_name in this.properties.sampler2D)
		{
			Engine.Gfx.BindTexture(this.properties.sampler2D[property_name], texture_slot++, property_name);
		}

		// Bind integer properties
		for (var property_name in this.properties.int)
		{
			Engine.Gfx.SetShaderProperty(property_name, this.properties.int[property_name], Engine.Gfx.SP_INT);
		}

		// Bind float properties
		for (var property_name in this.properties.float)
		{
			Engine.Gfx.SetShaderProperty(property_name, this.properties.float[property_name], Engine.Gfx.SP_FLOAT);
		}

		// Bind vec2 properties
		for (var property_name in this.properties.vec2)
		{
			Engine.Gfx.SetShaderProperty(property_name, this.properties.vec2[property_name], Engine.Gfx.SP_VEC2);
		}

		// Bind vec3 properties
		for (var property_name in this.properties.vec3)
		{
			Engine.Gfx.SetShaderProperty(property_name, this.properties.vec3[property_name], Engine.Gfx.SP_VEC3);
		}

		// Bind vec4 properties
		for (var property_name in this.properties.vec4)
		{
			Engine.Gfx.SetShaderProperty(property_name, this.properties.vec4[property_name], Engine.Gfx.SP_VEC4);
		}
	}

	// Config Getters
	this.GetConfig = function(config_param_name) { return this.config[config_param_name]; }

	// Config Setters
	this.SetConfig = function(config_param_name, new_value)
	{
		this.config[config_param_name] = new_value;

		// Important: Modifying config parameters for standard shaders means we potentially need to select a new shader permutation
		if(this.type == "standard")
		{
			this.InitStandardShader();
		}
	}

	// Property Getters
	this.GetTexture   = function(sampler_name)  { return Engine.Util.IsDefined(this.properties.sampler2D)? this.properties.sampler2D[sampler_name] : null  };
	this.GetSampler2D = function(sampler_name)  { return Engine.Util.IsDefined(this.properties.sampler2D)? this.properties.sampler2D[sampler_name] : null  };
	this.GetInteger   = function(property_name) { return Engine.Util.IsDefined(this.properties.int)? this.properties.int[property_name] : null             };
	this.GetInt       = function(property_name) { return Engine.Util.IsDefined(this.properties.int)? this.properties.int[property_name] : null             };
	this.GetFloat     = function(property_name) { return Engine.Util.IsDefined(this.properties.float)? this.properties.float[property_name] : null         };
	this.GetVector2   = function(property_name) { return Engine.Util.IsDefined(this.properties.vec2)? this.properties.vec2[property_name] : null           };
	this.GetVec2      = function(property_name) { return Engine.Util.IsDefined(this.properties.vec2)? this.properties.vec2[property_name] : null           };
	this.GetVector3   = function(property_name) { return Engine.Util.IsDefined(this.properties.vec3)? this.properties.vec3[property_name] : null           };
	this.GetVec3      = function(property_name) { return Engine.Util.IsDefined(this.properties.vec3)? this.properties.vec3[property_name] : null           };
	this.GetVector4   = function(property_name) { return Engine.Util.IsDefined(this.properties.vec4)? this.properties.vec4[property_name] : null           };
	this.GetVec4      = function(property_name) { return Engine.Util.IsDefined(this.properties.vec4)? this.properties.vec4[property_name] : null           };
	this.GetColour    = function(property_name) { return Engine.Util.IsDefined(this.properties.vec4)? this.properties.vec4[property_name] : null           };
	this.GetColor     = function(property_name) { return Engine.Util.IsDefined(this.properties.vec4)? this.properties.vec4[property_name] : null           };

	// Property Setters
	this.SetTexture   = function(sampler_name, new_value)  { if(!Engine.Util.IsDefined(this.properties.sampler2D)) { this.properties.sampler2D = { sampler_name : new_value }} else { this.properties.sampler2D[sampler_name] = new_value; } };
	this.SetSampler2D = function(sampler_name, new_value)  { if(!Engine.Util.IsDefined(this.properties.sampler2D)) { this.properties.sampler2D = { sampler_name : new_value }} else { this.properties.sampler2D[sampler_name] = new_value; } };
	this.SetInteger   = function(property_name, new_value) { if(!Engine.Util.IsDefined(this.properties.int)) { this.properties.int = { property_name : new_value }} else { this.properties.int[property_name] = new_value; }                 };
	this.SetInt       = function(property_name, new_value) { if(!Engine.Util.IsDefined(this.properties.int)) { this.properties.int = { property_name : new_value }} else { this.properties.int[property_name] = new_value; }                 };
	this.SetFloat     = function(property_name, new_value) { if(!Engine.Util.IsDefined(this.properties.float)) { this.properties.float = { property_name : new_value }} else { this.properties.float[property_name] = new_value; }           };
	this.SetVector2   = function(property_name, new_value) { if(!Engine.Util.IsDefined(this.properties.vec2)) { this.properties.vec2 = { property_name : new_value }} else { this.properties.vec2[property_name] = new_value; }              };
	this.SetVec2      = function(property_name, new_value) { if(!Engine.Util.IsDefined(this.properties.vec2)) { this.properties.vec2 = { property_name : new_value }} else { this.properties.vec2[property_name] = new_value; }              };
	this.SetVector3   = function(property_name, new_value) { if(!Engine.Util.IsDefined(this.properties.vec3)) { this.properties.vec3 = { property_name : new_value }} else { this.properties.vec3[property_name] = new_value; }              };
	this.SetVec3      = function(property_name, new_value) { if(!Engine.Util.IsDefined(this.properties.vec3)) { this.properties.vec3 = { property_name : new_value }} else { this.properties.vec3[property_name] = new_value; }              };
	this.SetVector4   = function(property_name, new_value) { if(!Engine.Util.IsDefined(this.properties.vec4)) { this.properties.vec4 = { property_name : new_value }} else { this.properties.vec4[property_name] = new_value; }              };
	this.SetVec4      = function(property_name, new_value) { if(!Engine.Util.IsDefined(this.properties.vec4)) { this.properties.vec4 = { property_name : new_value }} else { this.properties.vec4[property_name] = new_value; }              };
	this.SetColour    = function(property_name, new_value) { if(!Engine.Util.IsDefined(this.properties.vec4)) { this.properties.vec4 = { property_name : new_value }} else { this.properties.vec4[property_name] = new_value; }              };
	this.SetColor     = function(property_name, new_value) { if(!Engine.Util.IsDefined(this.properties.vec4)) { this.properties.vec4 = { property_name : new_value }} else { this.properties.vec4[property_name] = new_value; }              };
};

Engine.Gfx.Material.Clone = function(original_material)
{
	var material = new Engine.Gfx.Material(true);
	$.extend(true, material, original_material);
	return material;
};

// Material loading
Engine.Resource.RegisterLoadFunction("mat", function(descriptor, callback)
{
	// Load the material JSON
	Engine.Net.FetchResource(descriptor.file, function(json)
	{
		var material_json = jQuery.parseJSON(json);

		// Setup new material and apply JSON
		var material = new Engine.Gfx.Material(true);
		$.extend(material, material_json);

		// 3. Cross reference material properties with shader properties
		var on_textures_loaded = function()
		{
			// For each property exposed in shader...
			for (var property_name in material.shader.property_info)
			{
				var shader_property_info = material.shader.property_info[property_name];

				// Setup property bank?
				if(material.properties[shader_property_info.type] == null)
				{
					material.properties[shader_property_info.type] = { };
				}

				// Does this material provide a value for the shader property?
				var material_property_bank = material.properties[shader_property_info.type];
				if(!material_property_bank.hasOwnProperty(property_name))
				{
					// Setup a material property with the default value provided in the shader
					// Note: If the missing property is a the albedo map sampler, we bind a 1x1 plain white texture
					if(shader_property_info.type == "sampler2D")
					{
						material_property_bank[property_name] = (property_name == "albedo_map")? Engine.Resources["tx_white"] : null;
					}
					else
					{
						material_property_bank[property_name] = shader_property_info.default;
					}
				}
			}

			// Finished
			callback(material);
		}

		// 2. Load textures
		var on_shader_loaded = function()
		{
			if(Engine.Util.IsDefined(material.properties.sampler2D))
			{
				Engine.Resource.LoadBatch(material.properties.sampler2D, function()
				{
					on_textures_loaded();
				});
			}
			else
			{
				on_textures_loaded();
			}
		};

		// 1. Load shader
		if(material.type == "standard")
		{
			// Init standard shader
			material.InitStandardShader();
			on_shader_loaded();
		}
		else
		{
			// Load custom shader
			Engine.Resource.Load({ file : material.shader }, function(shader_object)
			{
				material.shader = shader_object;

				// Compile custom shader
				material.shader_program = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_general_transformed_uv_normals_tangents"],
				                                                         material.shader);
				on_shader_loaded();
			})
		}
	});
});