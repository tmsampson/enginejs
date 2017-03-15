// *******************************************
//# sourceURL=modules/enginejs-model-import-obj.js
// *******************************************

Engine.Model.Importers.OBJ =
{
	Load : function(descriptor, callback)
	{
		var scale = Engine.Util.IsDefined(descriptor.scale)? descriptor.scale : 1.0;
		Engine.Net.FetchResource(descriptor.file, function(obj_data)
		{
			var obj_prims = [];
			var obj_current_prim = null;

			// Trim whitespace
			obj_data = obj_data.replace(/ +(?= )/g,'');

			// Parse
			var parsing_faces = true;
			var lines = obj_data.split("\n");
			for(var i = 0; i < lines.length; ++i)
			{
				var line = lines[i];

				// Next prim?
				if(parsing_faces && line[0] != "f")
				{
					obj_current_prim =
					{
						vertices : [],
						uvs      : [],
						normals  : [],
						faces    : [],
					};
					obj_prims.push(obj_current_prim);
				}
				parsing_faces = false;

				// Skip comments
				if(line[0] == "#") { continue; }

				// Process vertex
				if(line[0] == "v" && line[1] == " ")
				{
					var values = line.split(" ");
					var p0 = parseFloat(values[1]) * scale;
					var p1 = parseFloat(values[2]) * scale;
					var p2 = parseFloat(values[3]) * scale;
					obj_current_prim.vertices.push(p0, p1, p2);
				}

				// Process Parameter Space Vertices
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
					obj_current_prim.uvs.push(u, v);
				}

				// Process normals
				if(line[0] == "v" && line[1] == "n")
				{
					var values = line.split(" ");
					var nx = parseFloat(values[1]);
					var ny = parseFloat(values[2]);
					var nz = parseFloat(values[3]);
					obj_current_prim.normals.push(nx, ny, nz);
				}

				// Process face
				if(line[0] == "f")
				{
					parsing_faces = true;
					var values = line.split(" ");
					var e0 = values[1];
					var e1 = values[2];
					var e2 = values[3];
					obj_current_prim.faces.push(e0, e1, e2);
				}
			}

			// Trim last prim if empty
			if(obj_current_prim.faces.length == 0)
			{
				obj_prims.pop();
			}

			// Expand / assemble obj primitive streams
			var model_prims = []
			for(var i = 0; i < obj_prims.length; ++i)
			{
				// Setup model prim
				var obj_prim = obj_prims[i];
				var model_prim_vertex_buffers = [];
				var model_prim =
				{
					name           : "obj prim " + i,
					vertex_buffers : model_prim_vertex_buffers
				};
				model_prims.push(model_prim);

				var model_verices = [];
				var model_uvs = [];
				var model_normals = [];

				for(var face_index = 0; face_index < obj_prim.faces.length; face_index +=3)
				{
					var face_components = [ obj_prim.faces[face_index + 0], obj_prim.faces[face_index + 1], obj_prim.faces[face_index + 2] ];
					for(var j = 0; j < face_components.length; ++j)
					{
						var face_elements = face_components[j].split("/");

						// Expand vertices
						if(face_elements.length >= 1)
						{
							var vertex_offset = (face_elements[0] -1) * 3;
							model_verices.push(obj_prim.vertices[vertex_offset + 0], obj_prim.vertices[vertex_offset + 1], obj_prim.vertices[vertex_offset + 2]);
						}
						// Expand uvs
						if(face_elements.length >= 2 && face_elements[1] != "")
						{
							var uv_offset = (face_elements[1] -1) * 2;
							model_uvs.push(obj_prim.uvs[uv_offset + 0], 1.0 - obj_prim.uvs[uv_offset + 1]);
						}
						// Expand normals
						if(face_elements.length >= 3 && face_elements[2] != "")
						{
							var normal_offset = (face_elements[2] -1) * 3;
							model_normals.push(obj_prim.normals[normal_offset + 0], obj_prim.normals[normal_offset + 1], obj_prim.normals[normal_offset + 2]);
						}
					}
				}

				// Build vertex buffers
				if(model_verices.length > 0)
				{
					model_prim_vertex_buffers.push(
					{
						name           : "vertices",
						attribute_name : "a_pos",
						item_size      : 3,
						draw_mode      : "triangles",
						stream         : model_verices
					});
				}

				if(model_uvs.length > 0)
				{
					model_prim_vertex_buffers.push(
					{
						name           : "texture-coordinates",
						attribute_name : "a_uv",
						item_size      : 2,
						draw_mode      : "triangles",
						stream         : model_uvs
					});
				}

				if(model_normals.length > 0)
				{
					model_prim_vertex_buffers.push(
					{
						name           : "normals",
						attribute_name : "a_normal",
						item_size      : 3,
						draw_mode      : "triangles",
						stream         : model_normals
					});
				}
			}

			// Build enginejs model
			var model_file =
			{
				name: descriptor.file,
				model_data:
				{
					primitives : model_prims
				},
			};

			// Prepare and finalise model
			var model_object = Engine.Model.PrepareModel(model_file);
			callback(model_object);
		});
	},
};

// Resource loading
Engine.Resource.RegisterLoadFunction("obj", Engine.Model.Importers.OBJ.Load);