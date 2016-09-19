// **************************************************
//# sourceURL=modules/enginejs-material-standard.js
// **************************************************

Engine.Material =
{
	// Standard (default) material
	standard :
	{
		// Type (for extensibility)
		type                    : "standard",	// standard | pbr | custom

		name                    : "default",

		// Shader
		shader			        : null,			// Resource descriptor / object

		// Properties
		properties              :
		{
			// Albedo
			albedo_colour       : { type : "colour", value : Engine.Colour.White },
			albedo_map          : { type : "texture2d", value : null },
			albedo_map_repeat   : { type : "vec2", value : [1, 1] },

			// Lighting (opaque albedo if disabled)?
			lighting_enabled    :  { type : "bool", value : true },

			// Normal map
			normal_map          : { type : "texture2d", value : null },
			normal_map_repeat   : { type : "vec2", value : [1, 1] },
			normal_strength     : { type : "float", value : 1.0, min : 0.0, max : 1.0 },
			
			// Specular
			specular_enabled    : { type : "bool", value : true },
			specular_colour     : { type : "colour", value : Engine.Colour.White },
			specular_shininess  : { type : "float", value : 0.078125, min : 0.03, max : 1 },
			specular_map        : { type : "texture2d", value : null },
			specular_map_repeat : { type : "vec2", value : [1, 1] },
			

			// Fresnel
			fresnel_enabled     : { type : "bool", value : false },
			fresnel_colour      : { type : "colour", value : Engine.Colour.White },
			fresnel_scale       : { type : "float", value : 0.5, min : 0.0, max : 1.0 },
			fresnel_bias        : { type : "float", value : 0.0, min : -1.0, max : 1.0 },
			fresnel_power       : { type : "float", value : 1.4, min : 1.0, max : 8.0 },
		},

		GetProperty : function(property_name)
		{
			// Check the property exists
			if(!Engine.Util.IsDefined(this.properties[property_name]))
			{
				Engine.LogError("Could not find property '" + property_name +"' on material '" + this.name + "'");
				return;
			}

			return this.properties[property_name].value;
		},

		SetProperty : function(property_name, new_value, prevent_shader_update)
		{
			// Check the property exists
			if(!Engine.Util.IsDefined(this.properties[property_name]))
			{
				Engine.LogError("Could not set property '" + property_name +"' on material '" + this.name + "'");
				return;
			}

			// Update property
			this.properties[property_name].value = new_value;

			// Update appropriate shader permutation
			if(!prevent_shader_update)
			{
				this.InitShader(true);
			}
		},

		InitShader : function(force)
		{
			// Skip?
			if(!force && this.shader != null)
				return;

			// Select shader permutation
			var shader_name = "fs_mat_standard_amb";
			if(this.GetProperty("lighting_enabled"))
			{
				// Diffuse
				shader_name += "_lit";

				// Specular
				var specular_enabled = this.GetProperty("specular_enabled");
				if(specular_enabled)
				{
					shader_name += "_spec";
					if(this.GetProperty("specular_map") != null)
					{
						shader_name += "_specmap";
					}
				}

				// Normals
				if(this.GetProperty("normal_map") != null)
				{
					shader_name += "_normalmap";
				}
			}

			// Fresnel
			if(this.GetProperty("fresnel_enabled"))
			{
				shader_name += "_fresnel";
			}

			// Catch bad shader permutations
			if(!Engine.Util.IsDefined(Engine.Resources[shader_name]))
			{
				Engine.LogError("Could not find shader permutation '" + shader_name + "'");
				return;
			}

			// Apply shader
			this.shader = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_general_transformed_uv_normals_tangents"],
			                                             Engine.Resources[shader_name]); // Select pre-compiled permutation
		},

		Serialise : function()
		{
			// Setup serialised material
			var serialised_material =
			{
				name       : this.name,
				type       : this.type,
				properties : { }
			};

			// Add properties
			for (var property_name in this.properties)
			{
				var property = this.properties[property_name];

				// Skip?
				if(property.value == null)
				{
					continue;
				}

				var is_texture = property.type == "texture2d";
				serialised_material.properties[property_name] = { value : is_texture? { file : property.value.descriptor.file } :
				                                                                        property.value };
			}

			return serialised_material;
		}
	},

	Create : function(material_config)
	{
		var material = $.extend(true, { }, Engine.Material.standard); // Copy the default material
		for (var property_name in material_config)
		{
			var property_value = material_config[property_name];
			material.SetProperty(property_name, property_value, true)
		}

		material.InitShader();
		return material;
	},

	Bind : function(material, sun)
	{
		// 1. Bind shader
		Engine.Gfx.BindShaderProgram(material.shader);

		// 2. Bind sun colour
		Engine.Gfx.SetShaderConstant("u_sun_colour", sun.colour, Engine.Gfx.SC_VEC3);

		// 3. Bind sun params?
		if(material.GetProperty("lighting_enabled"))
		{
			Engine.Gfx.SetShaderConstant("u_sun_dir", sun.direction, Engine.Gfx.SC_VEC3);
		}

		// 3. Bind material albedo
		Engine.Gfx.SetShaderConstant("albedo_colour", material.GetProperty("albedo_colour"), Engine.Gfx.SC_VEC4);
		var material_albedo_map = material.GetProperty("albedo_map");
		if(material_albedo_map != null)
		{
			Engine.Gfx.BindTexture(material.GetProperty("albedo_map"), 0, "albedo_map");
			Engine.Gfx.SetShaderConstant("albedo_map_repeat", material.GetProperty("albedo_map_repeat"), Engine.Gfx.SC_VEC2);
		}
		else
		{
			// If no albedo texture is set in the material, bind single white pixel
			Engine.Gfx.BindTexture(Engine.Resources["tx_white"], 0, "albedo_map");
			Engine.Gfx.SetShaderConstant("albedo_map_repeat", [1, 1], Engine.Gfx.SC_VEC2);
		}

		// 4. Bind material specular params / map?
		if(material.GetProperty("specular_colour"))
		{
			Engine.Gfx.SetShaderConstant("specular_colour", material.GetProperty("specular_colour"), Engine.Gfx.SC_VEC4);
			Engine.Gfx.SetShaderConstant("specular_shininess", material.GetProperty("specular_shininess"), Engine.Gfx.SC_FLOAT);

			var material_specular_map = material.GetProperty("specular_map");
			if(material_specular_map != null)
			{
				Engine.Gfx.BindTexture(material_specular_map, 1, "specular_map");
				Engine.Gfx.SetShaderConstant("specular_map_repeat", material.GetProperty("specular_map_repeat"), Engine.Gfx.SC_VEC2);
			}
		}

		// 5. Bind material normal map?
		var material_normal_map = material.GetProperty("normal_map");
		if(material_normal_map != null)
		{
			Engine.Gfx.BindTexture(material_normal_map, 2, "normal_map");
			Engine.Gfx.SetShaderConstant("normal_map_repeat", material.GetProperty("normal_map_repeat"), Engine.Gfx.SC_VEC2);
			Engine.Gfx.SetShaderConstant("normal_strength", material.GetProperty("normal_strength"), Engine.Gfx.SC_FLOAT);
		}

		// 6. Bind material fresnel params?
		if(material.GetProperty("fresnel_enabled"))
		{
			Engine.Gfx.SetShaderConstant("fresnel_colour", material.GetProperty("fresnel_colour"), Engine.Gfx.SC_VEC4);
			Engine.Gfx.SetShaderConstant("fresnel_scale", material.GetProperty("fresnel_scale"), Engine.Gfx.SC_FLOAT);
			Engine.Gfx.SetShaderConstant("fresnel_bias", material.GetProperty("fresnel_bias"), Engine.Gfx.SC_FLOAT);
			Engine.Gfx.SetShaderConstant("fresnel_power", material.GetProperty("fresnel_power"), Engine.Gfx.SC_FLOAT);
		}
	},

	Load : function(descriptor, callback)
	{
		// Load the material
		Engine.Net.FetchResource(descriptor.file, function(material_json)
		{
			var json = jQuery.parseJSON(material_json);

			// Gather textures for batch loading
			var textures =
			{
				"albedo_map" : Engine.Util.IsDefined(json.properties.albedo_map)? json.properties.albedo_map.value : null,
				"normal_map" : Engine.Util.IsDefined(json.properties.normal_map)? json.properties.normal_map.value : null,
				"specular_map" : Engine.Util.IsDefined(json.properties.specular_map)? json.properties.specular_map.value : null
			};

			Engine.Resource.LoadBatch(textures, function()
			{
				var material = Engine.Material.Create();
				material.name = json.name;
				material.type = json.type;

				// Add textures
				material.SetProperty("albedo_map", textures["albedo_map"], true);
				material.SetProperty("normal_map", textures["normal_map"], true);
				material.SetProperty("specular_map", textures["specular_map"], true);

				// Strip texture properties
				delete json.properties.albedo_map;
				delete json.properties.normal_map;
				delete json.properties.specular_map;

				// Add properties
				for (var property_name in json.properties)
				{
					var property = json.properties[property_name];
					material.SetProperty(property_name, property.value, true);
				}

				// Init shader
				material.InitShader(true);

				// Finalise
				callback(material);
			});
		});
	}
};

// Resource loading
Engine.Resource.RegisterLoadFunction("mat", Engine.Material.Load);