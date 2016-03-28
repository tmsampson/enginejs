// *******************************************
//# sourceURL=modules/enginejs-geometry.js
// *******************************************

Engine.Geometry =
{
	MakeCircle : function(params)
	{
		// Setup empty model with 1 prim
		var prim = { name : "Circle faces", vertex_buffers : [] }
		var model = { name : "Circle", is_loaded : true, model_data : { primitives : [prim] } };

		// Generate verts
		if(!params.hasOwnProperty("segment_count"))
			return false;

		var vertex_buffer = { name : "vertices", attribute_name : "a_pos", item_size : 3, draw_mode : "triangle_fan", stream : [0.0, 0.0, 0.0] };
		var theta = (2 * Math.PI) / params.segment_count;
		for(var i = 0; i <= params.segment_count; ++i)
		{
			vertex_buffer.stream.push(Math.cos(theta * i), Math.sin(theta * i), 0.0);
		}

		// Create vertex buffer
		vertex_buffer.vbo = Engine.Gfx.CreateVertexBuffer(vertex_buffer);
		prim.vertex_buffers.push(vertex_buffer);

		// Generate UVs?
		if(params.hasOwnProperty("generate_uvs") && !params.generate_uvs)
			return model;

		var uv_buffer = { name : "texture-coordinates", attribute_name : "a_uv", item_size : 2, draw_mode : "triangle_fan", stream : [0.5, -0.5] };
		var normalise = function (x) { return ((x + 1) / 2); }
		for(var i = 0; i <= params.segment_count; ++i)
		{
			uv_buffer.stream.push(normalise(Math.cos(theta * i)), -normalise(Math.sin(theta * i)));
		}

		// Create uv buffer
		uv_buffer.vbo = Engine.Gfx.CreateVertexBuffer(uv_buffer);
		prim.vertex_buffers.push(uv_buffer);

		return model;
	},

	MakeSphere : function(params)
	{
		var radius = 1;
		var max_longditude = 24;
		var max_latitude = 16;
		var vertex_count = (max_longditude + 1) * max_latitude + 2;
		var pi = Math.PI;
		var tau = Math.PI * 2;

		// Setup empty model with 1 prim
		var prim = { name : "Sphere faces", vertex_buffers : [] }
		var model = { name : "Sphere", is_loaded : true, model_data : { primitives : [prim] } };

		// Generate verts
		var vertex_stream = [];
		var vertex_buffer = { name : "vertices", attribute_name : "a_pos", item_size : 3, draw_mode : "triangles", stream : vertex_stream }
		vertex_stream.push(0, radius, 0);
		for(var lat = 0; lat < max_latitude; lat++ )
		{
			var a1 = pi * (lat + 1) / (max_latitude + 1);
			var sin1 = Math.sin(a1);
			var cos1 = Math.cos(a1);

			for(var lon = 0; lon <= max_longditude; lon++)
			{
				var a2 = tau * (lon == max_longditude ? 0 : lon) / max_longditude;
				var sin2 = Math.sin(a2);
				var cos2 = Math.cos(a2);
				vertex_stream.push(sin1 * cos2 * radius, cos1 * radius, sin1 * sin2 * radius);
			}
		}
		vertex_stream.push(0, -radius, 0);
		vertex_buffer.vbo = Engine.Gfx.CreateVertexBuffer(vertex_buffer);
		prim.vertex_buffers.push(vertex_buffer);

		// Generate normals
		var normal_stream = [];
		var normal_buffer = { name : "normals", attribute_name : "a_normal", item_size : 3, draw_mode : "triangles", stream : normal_stream };
		for(var n = 0; n < vertex_count * 3; n+=3)
		{
			var vert = [vertex_stream[n], vertex_stream[n+1], vertex_stream[n+2]];
			var len = Math.sqrt((vert[0] * vert[0]) + (vert[1] * vert[1]) + (vert[2] * vert[2]));
			normal_stream.push(vert[0] / len, vert[1] / len, vert[2] / len);
		}
		normal_buffer.vbo = Engine.Gfx.CreateVertexBuffer(normal_buffer);
		prim.vertex_buffers.push(normal_buffer);

		// Generate uvs
		var uv_stream = [];
		var uv_buffer = { name : "texture-coordinates", attribute_name : "a_uv", item_size : 2, draw_mode : "triangles", stream : uv_stream };
		uv_stream.push(0, 1, 0);
		for(var lat = 0; lat < max_latitude; lat++)
		{
			for(var lon = 0; lon <= max_longditude; lon++)
			{
				uv_stream.push(lon / max_longditude, (lat + 1) / (max_latitude + 1));
			}
		}
		uv_stream.push(0, 0, 0);
		uv_buffer.vbo = Engine.Gfx.CreateVertexBuffer(uv_buffer);
		prim.vertex_buffers.push(uv_buffer);

		// Generate indices
		var index_stream = [];
		var index_buffer = { name : "indices", attribute_name : "", item_size : 1, draw_mode : "triangles", stream : index_stream };
		var nbFaces = vertex_count;
		var nbTriangles = nbFaces * 2;
		var nbIndexes = nbTriangles * 3;

		//Top Cap
		for(var lon = 0; lon < max_longditude; lon++)
		{
			index_stream.push(lon+2, lon+1, 0);
		}

		//Middle
		for(var lat = 0; lat < max_latitude - 1; lat++)
		{
			for(var lon = 0; lon < max_longditude; lon++)
			{
				var current = lon + lat * (max_longditude + 1) + 1;
				var next = current + max_longditude + 1;
				index_stream.push(current, current+1, next+1);
				index_stream.push(current, next+1, next);
			}
		}

		//Bottom Cap
		for(var lon = 0; lon < max_longditude; lon++)
		{
			index_stream.push(vertex_count -1, vertex_count - (lon+2) - 1, vertex_count - (lon+1) - 1);
		}
		index_buffer.vbo = Engine.Gfx.CreateVertexBuffer(index_buffer);
		prim.vertex_buffers.push(index_buffer);

		return model;
	},
};