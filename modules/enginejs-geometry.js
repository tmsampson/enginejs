// *******************************************
//# sourceURL=modules/enginejs-geometry.js
// *******************************************

Engine.Geometry =
{
	MakeCircle : function(params)
	{
		// Default params
		var segment_count = 50;

		// User overrides?
		var have_params = Engine.Util.IsDefined(params);
		if(have_params)
		{
			segment_count = Engine.Util.IsDefined(params.segment_count)? params.segment_count : segment_count;
		}

		// Setup empty model with 1 prim
		var prim = { name : "Circle faces", vertex_buffers : [] }
		var model = { name : "Circle", is_loaded : true, model_data : { primitives : [prim] } };

		// Generate verts
		var vertex_stream = [];
		var vertex_buffer = { name : "vertices", attribute_name : "a_pos", item_size : 3, draw_mode : "triangle_fan", stream : vertex_stream };
		vertex_stream.push(0.0, 0.0, 0.0);
		var theta = (2 * Math.PI) / segment_count;
		for(var i = 0; i <= segment_count; ++i)
		{
			vertex_buffer.stream.push(Math.cos(theta * i), Math.sin(theta * i), 0.0);
		}
		prim.vertex_buffers.push(vertex_buffer);

		// Generate UVs?
		if(!have_params || !Engine.Util.IsDefined(params.generate_uvs) || params.generate_uvs)
		{
			var uv_stream = [];
			var uv_buffer = { name : "texture-coordinates", attribute_name : "a_uv", item_size : 2, draw_mode : "triangle_fan", stream : uv_stream };
			var normalise = function (x) { return ((x + 1) / 2); }
			uv_stream.push(0.5, -0.5);
			for(var i = 0; i <= params.segment_count; ++i)
			{
				uv_buffer.stream.push(normalise(Math.cos(theta * i)), -normalise(Math.sin(theta * i)));
			}
			prim.vertex_buffers.push(uv_buffer);
		}

		// Generate and return model
		return Engine.Model.Generate(model);
	},

	MakeSphere : function(params)
	{
		// Default params
		var radius = 1;
		var longditude_count = 24;
		var latitude_count = 16;

		// User overrides?
		var have_params = Engine.Util.IsDefined(params);
		if(have_params)
		{
			radius = Engine.Util.IsDefined(params.radius)? params.radius : radius;
			longditude_count = Engine.Util.IsDefined(params.longditude_count)? params.longditude_count : longditude_count;
			latitude_count = Engine.Util.IsDefined(params.latitude_count)? params.latitude_count : latitude_count;
		}

		// Constants
		var vertex_count = (longditude_count + 1) * latitude_count + 2;
		var pi = Math.PI;

		// Setup empty model with 1 prim
		var prim = { name : "Sphere faces", vertex_buffers : [] }
		var model = { name : "Sphere", is_loaded : true, model_data : { primitives : [prim] } };

		// Generate verts
		var vertex_stream = [];
		var vertex_buffer = { name : "vertices", attribute_name : "a_pos", item_size : 3, draw_mode : "triangles", stream : vertex_stream }
		vertex_stream.push(0, radius, 0);
		for(var lat = 0; lat < latitude_count; lat++ )
		{
			var a1 = pi * (lat + 1) / (latitude_count + 1);
			var sin1 = Math.sin(a1);
			var cos1 = Math.cos(a1);

			for(var lon = 0; lon <= longditude_count; lon++)
			{
				var a2 = Engine.Math.Tau * (lon == longditude_count ? 0 : lon) / longditude_count;
				var sin2 = Math.sin(a2);
				var cos2 = Math.cos(a2);
				vertex_stream.push(sin1 * cos2 * radius, cos1 * radius, sin1 * sin2 * radius);
			}
		}
		vertex_stream.push(0, -radius, 0);
		prim.vertex_buffers.push(vertex_buffer);

		// Generate normals
		if(!have_params || !Engine.Util.IsDefined(params.generate_normals) || params.generate_normals)
		{
			var normal_stream = [];
			var normal_buffer = { name : "normals", attribute_name : "a_normal", item_size : 3, draw_mode : "triangles", stream : normal_stream };
			for(var n = 0; n < vertex_count * 3; n+=3)
			{
				var vert = [vertex_stream[n], vertex_stream[n+1], vertex_stream[n+2]];
				var len = Math.sqrt((vert[0] * vert[0]) + (vert[1] * vert[1]) + (vert[2] * vert[2]));
				normal_stream.push(vert[0] / len, vert[1] / len, vert[2] / len);
			}
			prim.vertex_buffers.push(normal_buffer);
		}

		// Generate uvs
		if(!have_params || !Engine.Util.IsDefined(params.generate_uvs) || params.generate_uvs)
		{
			var uv_stream = [];
			var uv_buffer = { name : "texture-coordinates", attribute_name : "a_uv", item_size : 2, draw_mode : "triangles", stream : uv_stream };
			uv_stream.push(0, 1, 0);
			for(var lat = 0; lat < latitude_count; lat++)
			{
				for(var lon = 0; lon <= longditude_count; lon++)
				{
					uv_stream.push(lon / longditude_count, (lat + 1) / (latitude_count + 1));
				}
			}
			uv_stream.push(0, 0, 0);
			prim.vertex_buffers.push(uv_buffer);
		}

		// Generate indices
		var index_stream = [];
		var index_buffer = { name : "indices", attribute_name : "", item_size : 1, draw_mode : "triangles", stream : index_stream };
		var face_count = vertex_count;
		var triangle_count = face_count * 2;
		var index_count = triangle_count * 3;

		// Top Cap
		for(var lon = 0; lon < longditude_count; lon++)
		{
			index_stream.push(lon+2, lon+1, 0);
		}

		// Middle
		for(var lat = 0; lat < latitude_count - 1; lat++)
		{
			for(var lon = 0; lon < longditude_count; lon++)
			{
				var current = lon + lat * (longditude_count + 1) + 1;
				var next = current + longditude_count + 1;
				index_stream.push(current, current + 1, next + 1);
				index_stream.push(current, next + 1, next);
			}
		}

		// Bottom Cap
		for(var lon = 0; lon < longditude_count; lon++)
		{
			index_stream.push(vertex_count - 1,
			                  vertex_count - (lon + 2) - 1,
			                  vertex_count - (lon + 1) - 1);
		}
		prim.vertex_buffers.push(index_buffer);

		// Generate and return model
		return Engine.Model.Generate(model);
	},
};