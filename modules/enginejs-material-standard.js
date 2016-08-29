// **************************************************
//# sourceURL=modules/enginejs-material-standard.js
// **************************************************

Engine.Material =
{
	// Standard (default) material
	standard :
	{
		// Type (for extensibility)
		type                   : "standard",				// standard | pbr | custom

		name                   : "default",

		// Shader
		shader			       : null,					// Resource descriptor / object

		// Properties
		properties             :
		{
			// Albedo
			albedo_map         : { type : "texture2d", value : null },
			albedo_colour      : { type : "colour", value : Engine.Colour.White },

			// Lighting (opaque albedo if disabled)?
			lighting_enabled   :  { type : "bool", value : true },

			// Normal map
			normal_map         : { type : "texture2d", value : null },
			normal_strength    : { type : "float", value : 1.0, min : 0.0, max : 1.0 },
			
			// Specular
			specular_enabled   : { type : "bool", value : false },
			specular_colour    : { type : "colour", value : Engine.Colour.White },
			specular_shininess : { type : "float", value : 0.078125, min : 0.03, max : 1 },
			specular_map       : { type : "texture2d", value : null },

			// Fresnel
			fresnel_enabled    : { type : "bool", value : false },
			fresnel_colour     : { type : "colour", value : Engine.Colour.White },
			fresnel_scale      : { type : "float", value : 0.5, min : 0.0, max : 1.0 },
			fresnel_bias       : { type : "float", value : 0.0, min : -1.0, max : 1.0 },
			fresnel_power      : { type : "float", value : 1.4, min : 1.0, max : 8.0 },
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

		SetProperty : function(property_name, new_value)
		{
			// Check the property exists
			if(!Engine.Util.IsDefined(this.properties[property_name]))
			{
				Engine.LogError("Could not set property '" + property_name +"' on material '" + this.name + "'");
				return;
			}

			this.properties[property_name] = new_value;
			this.InitShader(true); // Force select appropriate shader permutation
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
		}
	},

	Create : function(material_config)
	{
		var material = $.extend(Engine.Material.standard, material_config);
		material.InitShader();
		return material;
	},

	Bind : function(material, sun)
	{
		// 1. Bind shader
		Engine.Gfx.BindShaderProgram(material.shader);

		// 2. Bind sun ambient
		Engine.Gfx.SetShaderConstant("u_sun_ambient", sun.ambient, Engine.Gfx.SC_VEC3);

		// 3. Bind sun params?
		if(material.GetProperty("lighting_enabled"))
		{
			Engine.Gfx.SetShaderConstant("u_sun_diffuse", sun.diffuse, Engine.Gfx.SC_VEC3);
			Engine.Gfx.SetShaderConstant("u_sun_dir", sun.direction, Engine.Gfx.SC_VEC3);
		}

		// 3. Bind material albedo
		Engine.Gfx.SetShaderConstant("u_material_albedo_colour", material.GetProperty("albedo_colour"), Engine.Gfx.SC_VEC4);
		var material_albedo_map = material.GetProperty("albedo_map");
		if(material_albedo_map != null)
		{
			Engine.Gfx.BindTexture(material.GetProperty("albedo_map"), 0, "u_material_tx_albedo");
		}
		else
		{
			// If no albedo texture is set in the material, bind single white pixel
			Engine.Gfx.BindTexture(Engine.Resources["tx_white"], 0, "u_material_tx_albedo");
		}

		// 4. Bind material specular params / map?
		if(material.GetProperty("specular_enabled"))
		{
			Engine.Gfx.SetShaderConstant("u_sun_specular", sun.specular, Engine.Gfx.SC_VEC3);
			Engine.Gfx.SetShaderConstant("u_material_specular", material.GetProperty("specular_colour"), Engine.Gfx.SC_VEC4);
			Engine.Gfx.SetShaderConstant("u_material_shininess", material.GetProperty("specular_shininess"), Engine.Gfx.SC_FLOAT);

			var material_specular_map = material.GetProperty("specular_map");
			if(material_specular_map != null)
			{
				Engine.Gfx.BindTexture(material_specular_map, 1, "u_material_tx_specular");
			}
		}

		// 5. Bind material normal map?
		var material_normal_map = material.GetProperty("normal_map");
		if(material_normal_map != null)
		{
			Engine.Gfx.BindTexture(material_normal_map, 2, "u_material_tx_normal");
			Engine.Gfx.SetShaderConstant("u_material_normal_strength", material.GetProperty("normal_strength"), Engine.Gfx.SC_FLOAT);
		}

		// 6. Bind material fresnel params?
		if(material.GetProperty("fresnel_enabled"))
		{
			Engine.Gfx.SetShaderConstant("u_material_fresnel_colour", material.GetProperty("fresnel_colour"), Engine.Gfx.SC_VEC4);
			Engine.Gfx.SetShaderConstant("u_material_fresnel_bias", material.GetProperty("fresnel_bias"), Engine.Gfx.SC_FLOAT);
			Engine.Gfx.SetShaderConstant("u_material_fresnel_scale", material.GetProperty("fresnel_scale"), Engine.Gfx.SC_FLOAT);
			Engine.Gfx.SetShaderConstant("u_material_fresnel_power", material.GetProperty("fresnel_power"), Engine.Gfx.SC_FLOAT);
		}
	}
};