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
			var model_object = Engine.Model.Generate(model_file);
			callback(model_object);
		});
	},

	Generate : function(model_file)
	{
		// Generate tangent / bi-tangent streams?
		var prims = model_file.model_data.primitives;
		for(var i = 0; i < prims.length; ++i)
		{
			var vertex_buffer = null, normal_buffer = null, uv_buffer = null, index_buffer = null;
			var buffers = prims[i].vertex_buffers;
			for(var j = 0; j < buffers.length; ++j)
			{
				var buffer = buffers[j];
				if(buffer.attribute_name == "a_pos")    { vertex_buffer = buffer; }
				if(buffer.attribute_name == "a_normal") { normal_buffer = buffer; }
				if(buffer.attribute_name == "a_uv")     { uv_buffer = buffer; }
				if(buffer.name == "indices")            { index_buffer = buffer; }
			}

			if(index_buffer != null && index_buffer.draw_mode == "triangles")
			{
				// Setup tangent stream
				var tangent_stream = [];
				var tangent_buffer = { name : "tangents", attribute_name : "a_tangent", item_size : 3, draw_mode : "triangles", stream : tangent_stream };
				for(var j = 0; j < vertex_buffer.stream.length; ++j)
				{
					tangent_stream[j] = 0;
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
					tangent_stream[i0 * 3] = tangent[0]; tangent_stream[(i0 * 3) + 1] = tangent[1]; tangent_stream[(i0 * 3) + 2] = tangent[2];
					tangent_stream[i1 * 3] = tangent[0]; tangent_stream[(i1 * 3) + 1] = tangent[1]; tangent_stream[(i1 * 3) + 2] = tangent[2];
					tangent_stream[i2 * 3] = tangent[0]; tangent_stream[(i2 * 3) + 1] = tangent[1]; tangent_stream[(i2 * 3) + 2] = tangent[2];
				}

				// Add buffer
				prims[i].vertex_buffers.push(tangent_buffer);
			}
		}

		// Generate vertex buffers
		for(var i = 0; i < prims.length; ++i)
		{
			// Build vertex buffers
			var vertex_buffers = prims[i].vertex_buffers;
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
};

// Resource loading
Engine.Resource.RegisterLoadFunction("model", Engine.Model.Load);
