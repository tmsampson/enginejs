// *******************************************
//# sourceURL=modules/enginejs-model.js
// *******************************************

Engine.Model =
{
	Load : function(descriptor, callback)
	{
		Engine.Net.FetchResource(descriptor.file, function(model_json)
		{
			// Parse model json
			var model_file = Engine.Util.ParseJSON(model_json, true);

			// 2. Prepare / finalise model
			var prepare_model = function()
			{
				var model_object = Engine.Model.PrepareModel(model_file);
				callback(model_object);
			};

			// 1. Load in any external materials?
			if(Engine.Util.IsDefined(model_file.materials) && !Engine.Util.IsEmptyObject(model_file.materials))
			{
				Engine.Resource.LoadBatch(model_file.materials, function()
				{
					prepare_model();
				});
			}
			else
			{
				prepare_model();
			}
		});
	},

	PrepareModel : function(model_file)
	{
		var has_materials = Engine.Util.IsDefined(model_file.materials);
		var primitives = model_file.model_data.primitives;
		for(var i = 0; i < primitives.length; ++i)
		{
			// Grab primitive
			var primitive = primitives[i];

			// Verify & hookup material reference
			if(Engine.Util.IsDefined(primitive.material))
			{
				var material_id = primitive.material;
				if(has_materials && Engine.Util.IsDefined(model_file.materials[material_id]))
				{
					primitive.material = model_file.materials[material_id];
				}
				else
				{
					Engine.LogError("Material '" + material_id + "' referenced by model primitive '" + primitive.name + "' was not found!");
					Engine.LogWarning("Model primitive '" + primitive.name + "' will use default material instead");
					primitive.material = Engine.Resources["mat_standard_default"];
				}
			}
			else
			{
				Engine.LogWarning("Model primitive '" + primitive.name + "' has no material specified, default material applied");
				primitive.material = Engine.Resources["mat_standard_default"];
			}

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

	// Custom importers hook in here
	Importers : { }
};

// Resource loading
Engine.Resource.RegisterLoadFunction("model", Engine.Model.Load);