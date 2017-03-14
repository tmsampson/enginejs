// *******************************************
//# sourceURL=modules/enginejs-model.js
// *******************************************

Engine.Model =
{
	Load : function(descriptor, callback)
	{
		Engine.Net.FetchResource(descriptor.file, function(model_json)
		{
			var model_file = jQuery.parseJSON(model_json);
			var model_object = Engine.Model.PrepareModel(model_file);
			callback(model_object);
		});
	},

	LoadOBJ : function(descriptor, callback)
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

	PrepareModel : function(model_file)
	{
		var primitives = model_file.model_data.primitives;
		for(var i = 0; i < primitives.length; ++i)
		{
			// Grab primitive
			var primitive = primitives[i];

			// Find and grab vertex buffers
			var vertex_buffer = null, uv_buffer = null, normal_buffer = null, tangent_buffer = null, index_buffer = null;
			var buffers = primitive.vertex_buffers;
			for(var j = 0; j < buffers.length; ++j)
			{
				var buffer = buffers[j];
				if(buffer.attribute_name == "a_pos")     { vertex_buffer = buffer;  }
				if(buffer.attribute_name == "a_normal")  { normal_buffer = buffer;  }
				if(buffer.attribute_name == "a_uv")      { uv_buffer = buffer;      }
				if(buffer.attribute_name == "a_tangent") { tangent_buffer = buffer; }
				if(buffer.name == "indices")             { index_buffer = buffer;   }
			}

			// Ensure we have vertices!
			if(vertex_buffer == null)
			{
				Engine.LogError("Model " + model_file + " '" + primitive.name + "' primitive has no vertex buffer!");
				return;
			}

			// We only carry out further preparations using triangle topology
			// TODO: Add support to prep functions for triangle strip / fan etc
			if(vertex_buffer.draw_mode == "triangles")
			{
				// Prepare indices?
				// Note: For now, if we don't have an index buffer that's fine, but for the sake of simplicity / consistency,
				//       let's build a temporary one now for further processing below...
				if(index_buffer == null || index_buffer.stream.length == 0)
				{
					index_buffer = { stream : [] };
					for(var vertex = 0; vertex < vertex_buffer.stream.length / 3; ++vertex)
					{
						index_buffer.stream.push(vertex);
					}
				}

				// Prepare UVs?
				if(uv_buffer == null || uv_buffer.stream.length == 0)
				{
					uv_buffer = Engine.Model.PrepareUVs(primitive, uv_buffer, vertex_buffer);
				}

				// Prepare normals?
				if(normal_buffer == null || normal_buffer.stream.length == 0)
				{
					normal_buffer = Engine.Model.PrepareNormals(primitive, normal_buffer, vertex_buffer, index_buffer);
				}

				// Prepare tangents?
				if(tangent_buffer == null || tangent_buffer.stream.length == 0)
				{
					tangent_buffer = Engine.Model.PrepareTangents(primitive, tangent_buffer, vertex_buffer, uv_buffer, index_buffer);
				}
			}

			// Generate vertex buffer objects
			var vertex_buffers = primitive.vertex_buffers;
			for(var j = 0; j < vertex_buffers.length; ++j)
			{
				// Place vertex buffer object immediately inside buffer object
				var buffer = vertex_buffers[j];
				buffer.vbo = Engine.Gfx.CreateVertexBuffer(buffer);
			}
		}

		// Finalise loaded model
		model_file.is_loaded = true;
		return model_file;
	},

	PrepareUVs : function(primitive, uv_buffer, vertex_buffer)
	{
		// Create uv buffer if necessary
		if(uv_buffer == null)
		{
			uv_buffer =
			{
				name           : "texture-coordinates",
				attribute_name : "a_uv",
				item_size      : 2,
				draw_mode      : "triangles",
				stream         : [],
			};
			primitive.vertex_buffers.push(uv_buffer);
		}

		// For now, overlay uv's onto local x-z plane
		for(var i = 0; i < vertex_buffer.stream.length; i += 3)
		{
			var vx = vertex_buffer.stream[i];
			var vz = vertex_buffer.stream[i + 2];
			uv_buffer.stream.push(vx / 2.0, vz / 2.0);
		}

		return uv_buffer;
	},

	PrepareNormals : function(primitive, normal_buffer, vertex_buffer, index_buffer)
	{
		// Create uv buffer if necessary
		if(normal_buffer == null)
		{
			normal_buffer =
			{
				name           : "normals",
				attribute_name : "a_normal",
				item_size      : 3,
				draw_mode      : "triangles",
				stream         : [],
			};
			primitive.vertex_buffers.push(normal_buffer);
		}

		// Here we store a lookup, allowing us to quickly check which face(s) each vertex belongs to
		var vertex_to_face_lookup = [];
		var add_lookup = function(vertex, face)
		{
			if(!Engine.Util.IsDefined(vertex_to_face_lookup[vertex]))
			{
				vertex_to_face_lookup[vertex] = [];
			}
			vertex_to_face_lookup[vertex].push(face);
		};

		// Calculate face normals
		var face_normals = [];
		var idx0, idx1, idx2; var v0, v1, v2;
		var edge_0 = vec3.create(); var edge_1 = vec3.create(); var normal = vec3.create();
		for(var face = 0; face < index_buffer.stream.length / 3; ++face)
		{
			// Extract face indices
			var idx0 = index_buffer.stream[(face * 3) + 0];
			var idx1 = index_buffer.stream[(face * 3) + 1];
			var idx2 = index_buffer.stream[(face * 3) + 2];

			// Update vertex --> face lookup
			add_lookup(idx0, face);
			add_lookup(idx1, face);
			add_lookup(idx2, face);

			// Extract face vertices
			v0 = vec3.fromValues(vertex_buffer.stream[(idx0 * 3)], vertex_buffer.stream[(idx0 * 3) + 1], vertex_buffer.stream[(idx0 * 3) + 2]);
			v1 = vec3.fromValues(vertex_buffer.stream[(idx1 * 3)], vertex_buffer.stream[(idx1 * 3) + 1], vertex_buffer.stream[(idx1 * 3) + 2]);
			v2 = vec3.fromValues(vertex_buffer.stream[(idx2 * 3)], vertex_buffer.stream[(idx2 * 3) + 1], vertex_buffer.stream[(idx2 * 3) + 2]);

			// Calculate edges
			vec3.subtract(edge_0, v1, v0);
			vec3.subtract(edge_1, v2, v0);

			// Calculate face normal
			vec3.cross(normal, edge_0, edge_1);
			vec3.normalize(normal, normal);
			face_normals.push(normal[0], normal[1], normal[2]);
		}

		// Calculate vertex normals
		for (var vertex_index in vertex_to_face_lookup)
		{
			// Average all faces
			var faces = vertex_to_face_lookup[vertex_index];
			var average_normal = vec3.create();
			for(var i = 0; i < faces.length; ++i)
			{
				var face_index = faces[i];
				var face_normal = vec3.fromValues(face_normals[(face_index * 3) + 0],
				                                  face_normals[(face_index * 3) + 1],
				                                  face_normals[(face_index * 3) + 2]);
				vec3.add(average_normal, average_normal, face_normal);
			}

			// Add averaged normal to buffer
			vec3.scale(average_normal, average_normal, 1.0 / faces.length);
			normal_buffer.stream.push(average_normal[0], average_normal[1], average_normal[2]);
		}

		normal_buffer.face_normals = face_normals;
		return normal_buffer;
	},

	PrepareTangents : function(primitive, tangent_buffer, vertex_buffer, uv_buffer, index_buffer)
	{
		// Create tangent buffer if necessary
		if(tangent_buffer == null)
		{
			tangent_buffer =
			{
				name           : "tangents",
				attribute_name : "a_tangent",
				item_size      : 3,
				draw_mode      : "triangles",
				stream         : []
			};
			primitive.vertex_buffers.push(tangent_buffer);
		}

		// Zero initialise tangent stream
		for(var j = 0; j < vertex_buffer.stream.length; ++j)
		{
			tangent_buffer.stream[j] = 0;
		}

		// For each indexed triangle
		for(var j = 0; j < index_buffer.stream.length; j+=3)
		{
			// Grab indices
			var i0 = index_buffer.stream[j + 0];
			var i1 = index_buffer.stream[j + 1];
			var i2 = index_buffer.stream[j + 2];

			// Grab triangle vertices
			var v0 = [ vertex_buffer.stream[i0 * 3], vertex_buffer.stream[(i0 * 3) + 1], vertex_buffer.stream[(i0 * 3) + 2 ] ];
			var v1 = [ vertex_buffer.stream[i1 * 3], vertex_buffer.stream[(i1 * 3) + 1], vertex_buffer.stream[(i1 * 3) + 2 ] ];
			var v2 = [ vertex_buffer.stream[i2 * 3], vertex_buffer.stream[(i2 * 3) + 1], vertex_buffer.stream[(i2 * 3) + 2 ] ];

			// Grab triangle uvs
			var uv0 = [ uv_buffer.stream[i0 * 2],  uv_buffer.stream[(i0 * 2) + 1] ];
			var uv1 = [ uv_buffer.stream[i1 * 2],  uv_buffer.stream[(i1 * 2) + 1] ];
			var uv2 = [ uv_buffer.stream[i2 * 2],  uv_buffer.stream[(i2 * 2) + 1] ];

			// Grab two edges
			var edge1_dir = [ v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2] ];
			var edge2_dir = [ v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2] ];

			// Grab uv deltas
			var edge1_uv_delta = [ uv1[0] - uv0[0], uv1[1] - uv0[1] ];
			var edge2_uv_delta = [ uv2[0] - uv0[0], uv2[1] - uv0[1] ];

			// Calculate tangent
			var r = 1.0 / ((edge1_uv_delta[0] * edge2_uv_delta[1]) - (edge1_uv_delta[1] * edge2_uv_delta[0]));
			var tangent = [ (edge1_dir[0] * edge2_uv_delta[1] - edge2_dir[0] * edge1_uv_delta[1]) * r,
							(edge1_dir[1] * edge2_uv_delta[1] - edge2_dir[1] * edge1_uv_delta[1]) * r,
							(edge1_dir[2] * edge2_uv_delta[1] - edge2_dir[2] * edge1_uv_delta[1]) * r ];
			var tangent_lengh = Math.sqrt((tangent[0] * tangent[0]) + (tangent[1] * tangent[1]) + (tangent[2] * tangent[2]));
			tangent[0] /= tangent_lengh;
			tangent[1] /= tangent_lengh;
			tangent[2] /= tangent_lengh;

			// Store tangent for each vertex
			tangent_buffer.stream [i0 * 3] = tangent[0]; tangent_buffer.stream [(i0 * 3) + 1] = tangent[1]; tangent_buffer.stream [(i0 * 3) + 2] = tangent[2];
			tangent_buffer.stream [i1 * 3] = tangent[0]; tangent_buffer.stream [(i1 * 3) + 1] = tangent[1]; tangent_buffer.stream [(i1 * 3) + 2] = tangent[2];
			tangent_buffer.stream [i2 * 3] = tangent[0]; tangent_buffer.stream [(i2 * 3) + 1] = tangent[1]; tangent_buffer.stream [(i2 * 3) + 2] = tangent[2];
		}

		return tangent_buffer;
	},
};

// Resource loading
Engine.Resource.RegisterLoadFunction("model", Engine.Model.Load);
Engine.Resource.RegisterLoadFunction("obj", Engine.Model.LoadOBJ);
