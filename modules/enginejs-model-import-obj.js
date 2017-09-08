// *******************************************
//# sourceURL=modules/enginejs-model-import-obj.js
// *******************************************

Engine.Model.Importers.OBJ =
{
	LoadMaterialsFile : function(materials_file, model_dir, callback)
	{
		var obj_textures = [];
		var obj_materials = [];

		// Go grab the .obj file
		Engine.Net.FetchResource(materials_file, function(materials_file_data)
		{
			// Trim excess whitespace and split into lines
			materials_file_data = materials_file_data.replace(/ +(?= )/g, '');
			var lines = materials_file_data.split("\n");

			var get_texture_from_line = function(line)
			{
				var values = line.split(" ");

				// Ignore entries which specify only the type of texture (e.g. "map_Ka") without
				// providing an actual texture filename!
				if(values.length <= 1)
				{
					return null;
				}

				// Look for filename on this row 
				// Note: spec says the filename should always be last after any options,
				//       however I've found files where this isn't the case!
				for(var j = 0; j < values.length; ++j)
				{
					var texture_filename_full = values[j];
					var parts = texture_filename_full.split('.');
					if(parts.length > 1)
					{
						// Valid extension?
						var extension = parts.pop().toLowerCase();
						if((extension == "png") || (extension == "tif") ||
						   (extension == "bmp")  || (extension == "jpg") ||
						   (extension == "jpeg") || (extension == "tga"))
						{
							// If texture name is a path, assume texture is in same folder local to materials file
							// and strip out the path completely
							var texture_filename = texture_filename_full.replace(/^.*[\\\/]/, '');

							// Break out of loop, we found our texture filename!
							return { key : texture_filename_full, filename : texture_filename };
						}
					}
				}

				// No texture found
				return null;
			}

			// Gather any textures we need to load
			for(var i = 0; i < lines.length; ++i)
			{
				var line = lines[i].trim();

				// Gather 
				if(line.substr(0, 6) == "map_Ka" || line.substr(0, 6) == "map_Kd" ||
				   line.substr(0, 6) == "map_Ks" || line.substr(0, 8) == "map_bump" ||
				   line.substr(0, 4) == "bump")
				{
					var result = get_texture_from_line(line);

					// Register texture for loading?
					if(result != null && !obj_textures[result.key])
					{
						obj_textures[result.key] = { "file" : model_dir + result.filename };
					}
				}
			}

			var parse_material = function(lines)
			{
				// Setup parse
				var current_material = null;
				var current_albedo_colour = [];

				// Parse
				for(var i = 0; i < lines.length; ++i)
				{
					var line = lines[i].trim();

					// new material found?
					if(line.substr(0, 6) == "newmtl")
					{
						var values = line.split(" ");
						var material_name = values[1];

						// Finalise previous material?
						// Note: This makes sure the material selects the
						//       correct shader permutation
						if(current_material != null)
						{
							current_material.InitStandardShader();
						}

						// Apply to this prim *and* all subsequent prims
						current_material = new Engine.Gfx.Material();
						current_material.name = material_name;

						// Store new material in bank
						obj_materials[material_name] = current_material;
					}

					// Parse albedo colour
					if(line.substr(0, 2) == "Kd")
					{
						var values = line.split(" ");
						current_material.SetColour("albedo_colour", [ values[1], values[2], values[3], 1 ]);
					}

					// Parse specular colour
					if(line.substr(0, 2) == "Ks")
					{
						var values = line.split(" ");
						current_material.SetConfig("specular_enabled", true);
						current_material.SetColour("specular_colour", [ values[1], values[2], values[3], 1 ]);
					}

					// Parse specular power
					if(line.substr(0, 2) == "Ns")
					{
						var values = line.split(" ");
						current_material.SetFloat("specular_shininess", values[1]);
					}

					// Parse albedo map
					if(line.substr(0, 6) == "map_Ka" || line.substr(0, 6) == "map_Kd")
					{
						var result = get_texture_from_line(line);
						if(result != null && Engine.Util.IsDefined(obj_textures[result.key]))
						{
							current_material.SetSampler2D("albedo_map", obj_textures[result.key]);
						}
					}

					// Parse specular map
					if(line.substr(0, 6) == "map_Ks")
					{
						var result = get_texture_from_line(line);
						if(result != null && Engine.Util.IsDefined(obj_textures[result.key]))
						{
							current_material.SetSampler2D("specular_map", obj_textures[result.key]);
						}
					}

					// Parse "bump" map (converted to normal map in standard material shader)
					if(line.substr(0, 8) == "map_bump" || line.substr(0, 4) == "bump")
					{
						var result = get_texture_from_line(line);
						if(result != null && Engine.Util.IsDefined(obj_textures[result.key]))
						{
							current_material.SetSampler2D("normal_map", obj_textures[result.key]);
						}
					}
				}

				// Finalise final material?
				// Note: This makes sure the material selects the
				//       correct shader permutation!
				if(current_material != null)
				{
					current_material.InitStandardShader();
				}
			}

			var texture_count = Object.keys(obj_textures).length;

			if(texture_count > 0)
			{
				Engine.Resource.LoadBatch(obj_textures, function()
				{
					parse_material(lines);
					callback(obj_materials);
				});
			}
			else
			{
				parse_material(lines);
				callback(obj_materials);
			}
		});
	},

	LoadModelFile : function(descriptor, lines, loaded_obj_materials)
	{
		// Setup parse
		var obj_prims = [];
		var material_file = "";
		var obj_current_prim = null;
		var obj_current_material = "";
		var is_parsing_faces = true;

		// Global pos / uv / normal banks
		var obj_file_vertices = [];
		var obj_file_uvs = [];
		var obj_file_normals = [];

		// Parse
		for(var i = 0; i < lines.length; ++i)
		{
			var line = lines[i].trim();

			// Next prim?
			if(is_parsing_faces && line[0] != "f")
			{
				obj_current_prim =
				{
					name     : "none",
					faces    : [],
				};

				if(obj_current_material != "")
				{
					obj_current_prim.material = obj_current_material;
				}

				obj_prims.push(obj_current_prim);
			}
			is_parsing_faces = false;

			// Grab material for this prim?
			if(line.substr(0, 6) == "usemtl")
			{
				var values = line.split(" ");

				// Apply to this prim *and* all subsequent prims
				obj_current_material = values[1];
				obj_current_prim.material = obj_current_material;
			}

			// Skip comments
			if(line[0] == "#") { continue; }

			// Process vertex
			if(line[0] == "v" && line[1] == " ")
			{
				var values = line.split(" ");
				var p0 = parseFloat(values[1]);
				var p1 = parseFloat(values[2]);
				var p2 = parseFloat(values[3]);
				obj_file_vertices.push(p0, p1, p2);
			}

			// Process parameter space vertices
			if(line[0] == "v" && line[1] == "p")
			{
				// Not currently supported
			}

			// Process texture co-ordinates
			if(line[0] == "v" && line[1] == "t")
			{
				var values = line.split(" ");
				var u = parseFloat(values[1]);
				var v = parseFloat(values[2]);
				obj_file_uvs.push(u, v);
			}

			// Process normals
			if(line[0] == "v" && line[1] == "n")
			{
				var values = line.split(" ");
				var nx = parseFloat(values[1]);
				var ny = parseFloat(values[2]);
				var nz = parseFloat(values[3]);
				obj_file_normals.push(nx, ny, nz);
			}

			// Process object / group name
			if(line[0] == "o" || (line[0] == "g" && obj_current_prim.name == "none"))
			{
				obj_current_prim.name = line.substring(2).trim();
			}

			// Process face
			if(line[0] == "f")
			{
				is_parsing_faces = true;
				var values = line.split(" ");

				if(values.length == 4)
				{
					// Triangle
					obj_current_prim.faces.push(values[1], values[2], values[3]);
				}
				else if(values.length > 4)
				{
					// Quad
					obj_current_prim.faces.push(values[1], values[2], values[3]);
					obj_current_prim.faces.push(values[1], values[3], values[4]);
				}
			}
		}

		// Trim last prim if empty
		if(obj_current_prim.faces.length == 0)
		{
			obj_prims.pop();
		}

		// ******************************************************************************************
		// ******************************************************************************************
		// ******************************************************************************************
		// ******************************************************************************************
		// ******************************************************************************************
		// ******************************************************************************************
		// ******************************************************************************************

		// Build enginejs model
		var model_prims = []
		var model_file =
		{
			name: Engine.Util.GetFilename(descriptor.file),
			materials : loaded_obj_materials,
			model_data:
			{
				primitives : model_prims
			},
		};

		// Expand / assemble obj primitive streams
		for(var i = 0; i < obj_prims.length; ++i)
		{
			// Grab the obj prim
			var obj_prim = obj_prims[i];

			// Setup equivalent model prim
			var model_prim_buffers = [];
			var model_prim = 
			{
				name           : obj_prim.name,
				buffers        : model_prim_buffers
			};

			if(Engine.Util.IsDefined(obj_prim.material))
			{
				model_prim.material = obj_prim.material;
			}
			model_prims.push(model_prim);

			// Setup streams for model buffers
			// Note: The faces specified in the obj file are not directly compatible with webgl index buffers as they reference mixed length
			//       streams. For example the obj might have 10 vertices, 4 uvs, 4 normals and 20 faces. For this reason we
			//       fully expand all streams and don't use an index buffer. Maybe this could be smarter and figure out whether or not
			//       it's worth trying to assemble an index buffer for the expanded data!
			var prim_vertices = [];
			var prim_uvs = [];
			var prim_normals = [];

			// For each obj file face...
			for(var face_index = 0; face_index < obj_prim.faces.length; face_index +=3)
			{
				// For each of the 3 vertices on this this face...
				var face_vertices = [ obj_prim.faces[face_index + 0], obj_prim.faces[face_index + 1], obj_prim.faces[face_index + 2] ];
				for(var j = 0; j < face_vertices.length; ++j)
				{
					var face_vertex = face_vertices[j].split("/");

					// Extract vertex attributes
					var pos_index    = (face_vertex.length >= 1 && face_vertex[0] != "")? ((face_vertex[0] - 1) * 3) : null;
					var uv_index     = (face_vertex.length >= 2 && face_vertex[1] != "")? ((face_vertex[1] - 1) * 2) : null;
					var normal_index = (face_vertex.length >= 3 && face_vertex[2] != "")? ((face_vertex[2] - 1) * 3) : null;

					// Add vertex position to enginejs model stream?
					if(pos_index != null)
					{
						prim_vertices.push(obj_file_vertices[pos_index + 0], obj_file_vertices[pos_index + 1], obj_file_vertices[pos_index + 2]);
					}

					// Add texture co-ordinate to enginejs model stream?
					if(uv_index != null)
					{
						prim_uvs.push(obj_file_uvs[uv_index + 0], 1.0 - obj_file_uvs[uv_index + 1]);
					}

					// Add normal to enginejs model stream?
					if(normal_index != null)
					{
						prim_normals.push(obj_file_normals[normal_index + 0], obj_file_normals[normal_index + 1], obj_file_normals[normal_index + 2]);
					}
				}
			}

			// Generate enginejs vertex buffers from our expanded streams
			if(prim_vertices.length > 0)
			{
				model_prim_buffers.push(
				{
					name           : "vertices",
					attribute_name : "a_pos",
					item_size      : 3,
					draw_mode      : "triangles",
					stream         : prim_vertices
				});
			}

			if(prim_uvs.length > 0)
			{
				model_prim_buffers.push(
				{
					name           : "texture-coordinates",
					attribute_name : "a_uv",
					item_size      : 2,
					draw_mode      : "triangles",
					stream         : prim_uvs
				});
			}

			if(prim_normals.length > 0)
			{
				model_prim_buffers.push(
				{
					name           : "normals",
					attribute_name : "a_normal",
					item_size      : 3,
					draw_mode      : "triangles",
					stream         : prim_normals
				});
			}
		}

		// Prepare and finalise model
		return Engine.Model.PrepareModel(model_file, descriptor);
	},

	Load : function(descriptor, callback)
	{
		var model_dir = descriptor.file.substring(0, descriptor.file.lastIndexOf("/") + 1);

		// Go grab the .obj file
		Engine.Net.FetchResource(descriptor.file, function(obj_file_data, file_size)
		{
			// Store file size
			descriptor.file_size = file_size;

			// Trim excess whitespace and split into lines
			obj_file_data = obj_file_data.replace(/ +(?= )/g, '');
			var lines = obj_file_data.split("\n");

			// Does this .obj model reference an external materials file?
			var materials_file = "";
			for(var i = 0; i < lines.length; ++i)
			{
				var line = lines[i];
				if(line.substr(0, 6) == "mtllib")
				{
					materials_file = model_dir + line.split(" ")[1];
					break;
				}
			}

			// Load the model (called below)
			var load_model = function(loaded_obj_materials)
			{
				// Load the model, passing the loaded materials
				var model_object = Engine.Model.Importers.OBJ.LoadModelFile(descriptor, lines, loaded_obj_materials);
				callback(model_object);
			};

			if(materials_file == "")
			{
				// 1. Load the model immediately (with no materials)
				load_model([]);
			}
			else
			{
				// 1. Load the materials file first
				Engine.Model.Importers.OBJ.LoadMaterialsFile(materials_file, model_dir, function(obj_materials)
				{
					// 2. Then load the model, (passing the loaded materials)
					load_model(obj_materials);
				});
			}
		});
	},
};

// Resource loading
Engine.Resource.RegisterLoadFunction("obj", Engine.Model.Importers.OBJ.Load);