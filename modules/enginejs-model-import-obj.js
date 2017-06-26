// *******************************************
//# sourceURL=modules/enginejs-model-import-obj.js
// *******************************************

Engine.Model.Importers.OBJ =
{
	Load : function(descriptor, callback)
	{
		// Grab scale factor  from descriptor (optional)
		var scale = Engine.Util.IsDefined(descriptor.scale)? descriptor.scale : 1.0;

		// Go grab the obj file
		Engine.Net.FetchResource(descriptor.file, function(obj_data)
		{
			// Trim excess whitespace
			obj_data = obj_data.replace(/ +(?= )/g, '');

			// Setup parse
			var obj_prims = [];
			var obj_current_prim = null;
			var is_parsing_faces = true;

			// Parse
			var lines = obj_data.split("\n");
			for(var i = 0; i < lines.length; ++i)
			{
				var line = lines[i];

				// Next prim?
				if(is_parsing_faces && line[0] != "f")
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
				is_parsing_faces = false;

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
					is_parsing_faces = true;
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
				// Grab the obj prim
				var obj_prim = obj_prims[i];

				// Setup equivalent model prim
				var model_prim_vertex_buffers = [];
				model_prims.push(
				{
					name           : "obj prim " + i,
					vertex_buffers : model_prim_vertex_buffers
				});

				// Setup streams for model buffers
				// Note: The faces specified in the obj file are not directly compatible with webgl index buffers as they reference mixed length
				//       streams. For example the obj might have 10 vertices, 4 uvs, 4 normals and 20 faces. For this reason we
				//       fully expand all streams and don't use an index buffer. Maybe this could be smarter and figure out whether or not
				//       it's worth trying to assemble an index buffer for the expanded data!
				var model_verices = [];
				var model_uvs = [];
				var model_normals = [];

				// For each obj file face...
				for(var face_index = 0; face_index < obj_prim.faces.length; face_index +=3)
				{
					// For each of the 3 vertices on this this face...
					var face_vertices = [ obj_prim.faces[face_index + 0], obj_prim.faces[face_index + 1], obj_prim.faces[face_index + 2] ];
					for(var j = 0; j < face_vertices.length; ++j)
					{
						var face_vertex = face_vertices[j].split("/");

						// Extract vertex attributes
						var pos_index    = (face_vertex.length >= 1 && face_vertex[0] != "")? (face_vertex[0] -1) * 3 : null;
						var uv_index     = (face_vertex.length >= 2 && face_vertex[1] != "")? (face_vertex[1] -1) * 2 : null;
						var normal_index = (face_vertex.length >= 3 && face_vertex[2] != "")? (face_vertex[2] -1) * 3 : null;

						// Add vertex position to enginejs model stream?
						if(pos_index != null)
						{
							model_verices.push(obj_prim.vertices[pos_index + 0], obj_prim.vertices[pos_index + 1], obj_prim.vertices[pos_index + 2]);
						}

						// Add texture co-ordinate to enginejs model stream?
						if(uv_index != null)
						{
							model_uvs.push(obj_prim.uvs[uv_index + 0], 1.0 - obj_prim.uvs[uv_index + 1]);
						}

						// Add normal to enginejs model stream?
						if(normal_index != null)
						{
							model_normals.push(obj_prim.normals[normal_index + 0], obj_prim.normals[normal_index + 1], obj_prim.normals[normal_index + 2]);
						}
					}
				}

				// Generate enginejs vertex buffers from our expanded streams
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