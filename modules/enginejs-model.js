// *******************************************
//# sourceURL=modules/enginejs-model.js
// *******************************************

Engine.Model =
{
	Load : function(descriptor, callback)
	{
		Engine.Net.FetchResource(descriptor.file, function(model_json, file_size)
		{
			// Store file size
			descriptor.file_size = file_size;

			// Parse model json
			var model_file = Engine.Util.ParseJSON(model_json, true);

			// 2. Prepare / finalise model
			var prepare_model = function()
			{
				var model_object = Engine.Model.PrepareModel(model_file, descriptor);
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

	PrepareModel : function(model_file, descriptor)
	{
		var has_materials = Engine.Util.IsDefined(model_file.materials);
		var primitives = model_file.model_data.primitives;

		// Set import format
		var has_descriptor = Engine.Util.IsDefined(descriptor);
		var model_extension = has_descriptor? Engine.Util.GetExtension(descriptor.file) : "";
		model_file.import_format = (model_extension == "obj")? "Wavefront OBJ" : (has_descriptor? "EngineJS JSON" : "None (Procedural)");

		// Were centre / scaling request on import?
		var scale_on_import = descriptor && Engine.Util.IsDefined(descriptor.scale);
		var import_scale_factor = scale_on_import? descriptor.scale : 1.0;

		// Apply rotation matrix on import?
		var import_rotation_mtx = null;
		if(descriptor && Engine.Util.IsDefined(descriptor.rotate) && descriptor.rotate.length == 3)
		{
			import_rotation_mtx = mat4.create();
			mat4.rotate(import_rotation_mtx, Engine.Math.IdentityMatrix, Engine.Math.DegToRad(descriptor.rotate[0]), [1, 0, 0]);
			mat4.rotate(import_rotation_mtx, import_rotation_mtx, Engine.Math.DegToRad(descriptor.rotate[1]), [0, 1, 0]);
			mat4.rotate(import_rotation_mtx, import_rotation_mtx, Engine.Math.DegToRad(descriptor.rotate[2]), [0, 0, 1]);
		}

		// First pass to calculate bounds
		model_file.min_vert = [ 10000000, 10000000, 10000000 ];
		model_file.max_vert = [ -10000000, -10000000, -10000000 ];
		for(var i = 0; i < primitives.length; ++i)
		{
			var buffers = primitives[i].buffers;
			for(var j = 0; j < buffers.length; ++j)
			{
				var buffer = buffers[j];
				if(buffer.attribute_name == "a_pos")
				{
					for(var j = 0; j < buffer.stream.length; j += 3)
					{
						// Apply import rotation?
						if(import_rotation_mtx != null)
						{
							var vec = vec3.fromValues(buffer.stream[j + 0], buffer.stream[j + 1], buffer.stream[j + 2]);
							vec3.transformMat4(vec, vec, import_rotation_mtx);
							buffer.stream[j + 0] = vec[0];
							buffer.stream[j + 1] = vec[1];
							buffer.stream[j + 2] = vec[2];
						}

						// Apply import scale?
						if(scale_on_import)
						{
							buffer.stream[j + 0] *= import_scale_factor;
							buffer.stream[j + 1] *= import_scale_factor;
							buffer.stream[j + 2] *= import_scale_factor;
						}

						// Enlarge model bounds?
						var pos = [ buffer.stream[j + 0], buffer.stream[j + 1], buffer.stream[j + 2]]
						model_file.min_vert[0] = Math.min(model_file.min_vert[0], pos[0]); model_file.max_vert[0] = Math.max(model_file.max_vert[0], pos[0]);
						model_file.min_vert[1] = Math.min(model_file.min_vert[1], pos[1]); model_file.max_vert[1] = Math.max(model_file.max_vert[1], pos[1]);
						model_file.min_vert[2] = Math.min(model_file.min_vert[2], pos[2]); model_file.max_vert[2] = Math.max(model_file.max_vert[2], pos[2]);
					}
				}
			}
		}

		// Calculate model size and centroid
		var size =
		[
			model_file.max_vert[0] - model_file.min_vert[0],
			model_file.max_vert[1] - model_file.min_vert[1],
			model_file.max_vert[2] - model_file.min_vert[2]
		];
		var centroid =
		[
			model_file.min_vert[0] + (size[0] * 0.5),
			model_file.min_vert[1] + (size[1] * 0.5),
			model_file.min_vert[2] + (size[2] * 0.5)
		];

		// Centre bounds?
		var centre_on_import = descriptor && Engine.Util.IsDefined(descriptor.centre) && descriptor.centre;
		if(centre_on_import)
		{
			model_file.min_vert[0] -= centroid[0]; model_file.max_vert[0] -= centroid[0];
			model_file.min_vert[1] -= centroid[1]; model_file.max_vert[1] -= centroid[1];
			model_file.min_vert[2] -= centroid[2]; model_file.max_vert[2] -= centroid[2];
		}

		// Second pass to prepare the model
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
					Engine.LogWarning("Model primitive '" + primitive.name + "' will use 'missing' material instead");
					primitive.material = Engine.Resources["mat_standard_missing"];
				}
			}
			else
			{
				// No material specified for this prim, use the 'missing' material instead
				primitive.material = Engine.Resources["mat_standard_missing"];
			}

			// Find and grab pointers to various buffers (position/uv/normal/tangent etc)
			for(var j = 0; j < primitive.buffers.length; ++j)
			{
				var buffer = primitive.buffers[j];
				if(buffer.attribute_name == "a_pos")     { primitive.positions = buffer; }
				if(buffer.attribute_name == "a_normal")  { primitive.normals = buffer;   }
				if(buffer.attribute_name == "a_uv")      { primitive.uvs = buffer;       }
				if(buffer.attribute_name == "a_tangent") { primitive.tangents = buffer;  }
				if(buffer.name == "indices")             { primitive.indices = buffer;   }
			}

			// Ensure we have vertices!
			if(!Engine.Util.IsDefined(primitive.positions) || primitive.positions == null)
			{
				Engine.LogError("Model " + model_file + " '" + primitive.name + "' primitive has no vertex buffer!");
				return;
			}

			// We only carry out further preparations using triangle topology
			// TODO: Add support to prep functions for triangle strip / fan etc
			if(primitive.positions.draw_mode == "triangles")
			{
				// Centre / scale model?
				if(centre_on_import)
				{
					for(var j = 0; j < primitive.positions.stream.length; j += 3)
					{
						primitive.positions.stream[j + 0] -= centroid[0];
						primitive.positions.stream[j + 1] -= centroid[1];
						primitive.positions.stream[j + 2] -= centroid[2];
					}
				}

				// Prepare indices?
				// Note: For now, if we don't have an index buffer that's fine, but for the sake of simplicity / consistency,
				//       let's build one now for further processing below...
				if(!Engine.Util.IsDefined(primitive.indices) || primitive.indices == null || primitive.indices.stream.length == 0)
				{
					primitive.indices = { stream : [] };
					for(var vertex = 0; vertex < primitive.positions.stream.length / 3; ++vertex)
					{
						primitive.indices.stream.push(vertex);
					}
				}

				// Prepare UVs?
				if(!Engine.Util.IsDefined(primitive.uvs) || primitive.uvs == null || primitive.uvs.stream.length == 0)
				{
					primitive.uvs = Engine.Model.PrepareUVs(primitive, primitive.uvs, primitive.positions);
				}

				// Prepare normals?
				if(!Engine.Util.IsDefined(primitive.normals) || primitive.normals == null || primitive.normals.stream.length == 0)
				{
					primitive.normals = Engine.Model.PrepareNormals(primitive, primitive.normals, primitive.positions, primitive.indices);
				}

				// Prepare tangents?
				if(!Engine.Util.IsDefined(primitive.tangents) || primitive.tangents == null || primitive.tangents.stream.length == 0)
				{
					primitive.tangents = Engine.Model.PrepareTangents(primitive, primitive.tangents, primitive.positions, primitive.uvs, primitive.indices);
				}
			}

			// Generate vertex buffer objects
			for(var j = 0; j < primitive.buffers.length; ++j)
			{
				// Place vertex buffer object immediately inside buffer object
				var buffer = primitive.buffers[j];
				buffer.vbo = Engine.Gfx.CreateVertexBuffer(buffer);
			}
		}

		// Add some debug / helper functions
		model_file.DebugDrawNormals = Engine.Model.DebugDrawNormals;

		// Finalise loaded model
		model_file.is_loaded = true;
		return model_file;
	},

	PrepareUVs : function(primitive, uv_buffer, position_buffer)
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
			primitive.buffers.push(uv_buffer);
		}

		// For now, overlay uv's onto local x-z plane
		for(var i = 0; i < position_buffer.stream.length; i += 3)
		{
			var vx = position_buffer.stream[i];
			var vz = position_buffer.stream[i + 2];
			uv_buffer.stream.push(vx / 2.0, vz / 2.0);
		}

		return uv_buffer;
	},

	PrepareNormals : function(primitive, normal_buffer, position_buffer, index_buffer)
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
			primitive.buffers.push(normal_buffer);
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
			v0 = vec3.fromValues(position_buffer.stream[(idx0 * 3)], position_buffer.stream[(idx0 * 3) + 1], position_buffer.stream[(idx0 * 3) + 2]);
			v1 = vec3.fromValues(position_buffer.stream[(idx1 * 3)], position_buffer.stream[(idx1 * 3) + 1], position_buffer.stream[(idx1 * 3) + 2]);
			v2 = vec3.fromValues(position_buffer.stream[(idx2 * 3)], position_buffer.stream[(idx2 * 3) + 1], position_buffer.stream[(idx2 * 3) + 2]);

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

	PrepareTangents : function(primitive, tangent_buffer, position_buffer, uv_buffer, index_buffer)
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
			primitive.buffers.push(tangent_buffer);
		}

		// Zero initialise tangent stream
		for(var j = 0; j < position_buffer.stream.length; ++j)
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
			var v0 = [ position_buffer.stream[i0 * 3], position_buffer.stream[(i0 * 3) + 1], position_buffer.stream[(i0 * 3) + 2 ] ];
			var v1 = [ position_buffer.stream[i1 * 3], position_buffer.stream[(i1 * 3) + 1], position_buffer.stream[(i1 * 3) + 2 ] ];
			var v2 = [ position_buffer.stream[i2 * 3], position_buffer.stream[(i2 * 3) + 1], position_buffer.stream[(i2 * 3) + 2 ] ];

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

	DebugDrawNormals : function()
	{
		// var model = this;

		// for(var i = 0; i < model.model_data.primitives.length; ++i)
		// {
		// 	var prim = model.model_data.primitives[i];
		// 	var verts = prim.buffers[0].stream;
		// 	var indices = prim.buffers[1].stream;
		// 	var normals = prim.buffers[3].stream;

		// 	for(var i = 0; i < indices.length; i +=3)
		// 	{
		// 		var vert_offset = indices[i] * 3;
		// 		var vx = verts[vert_offset + 0];
		// 		var vy = verts[vert_offset + 1];
		// 		var vz = verts[vert_offset + 2];
		// 		var vert = [ vx, vy, vz ];
		// 		var normal = [ normals[vert_offset], normals[vert_offset + 1], normals[vert_offset + 2] ];
		// 		var end = [ vert[0] + normal[0], vert[1] + normal[1], vert[2] + normal[2] ];
		// 		Engine.Debug.DrawLine3D(cam, vert, end, Engine.Colour.Orange, 1);
		// 	}
		// }
	},

	// Custom importers hook in here
	Importers : { }
};

// Resource loading
Engine.Resource.RegisterLoadFunction("model", Engine.Model.Load);