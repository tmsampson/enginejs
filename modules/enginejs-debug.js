// *******************************************
//# sourceURL=modules/enginejs-debug.js
// *******************************************

Engine.Debug =
{
	draw_commands : [],

	// Resources
	debug_draw_program_basic : null,
	debug_draw_circle_model  : null,

	// Vertex buffer objects
	line_verts : { attribute_name : "a_pos", item_size : 3, draw_mode : "lines", stream : new Float32Array(30000), stream_index : 0 },
	poly_verts : { attribute_name : "a_pos", item_size : 3, draw_mode : "triangle_fan", stream : new Float32Array(30000), stream_index : 0 },

	PreGameLoopInit : function()
	{
		Engine.Debug.debug_draw_program_basic = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_basic_transformed_nouv"],
		                                        Engine.Resources["fs_basic_colour"]);

		Engine.Debug.debug_draw_circle_model = Engine.Geometry.MakeCircle({ segment_count : 50 });

		// Setup vertex streams
		Engine.Debug.line_verts.vbo = Engine.Gfx.CreateVertexBuffer(Engine.Debug.line_verts);
		Engine.Debug.poly_verts.vbo = Engine.Gfx.CreateVertexBuffer(Engine.Debug.poly_verts);
	},

	RegisterDrawCommand : function(buffer, vertices, colour)
	{
		// Register command
		Engine.Debug.draw_commands.push(
		{
			buffer : buffer,
			offset : buffer.stream_index / buffer.item_size,
			count  : vertices.length,
			colour : colour
		});

		// Add verts to buffer
		for(var i = 0; i < vertices.length; ++i)
		{
			buffer.stream[buffer.stream_index++] = vertices[i][0];
			buffer.stream[buffer.stream_index++] = vertices[i][1];
			buffer.stream[buffer.stream_index++] = 0;
		}
	},

	DrawLine : function(start, end, colour, thickness, camera)
	{
		// Draw main line
		Engine.Debug.RegisterDrawCommand(Engine.Debug.line_verts, [start, end], colour);

		// Thicken line?
		if(thickness > 1)
		{
			// Add extra lines to perform thickening
			var normal = Engine.Vec2.Normal(Engine.Vec2.Subtract(end, start));
			var lines_per_side = Math.ceil((thickness - 1) / 2);
			var lines_total = 1 + (lines_per_side * 2);
			for(var i = 0; i < lines_per_side; ++i)
			{
				var shift = (thickness / lines_total) * (i + 1);
				var extra_lines = [ Engine.Vec2.Add(start, [ normal[0]  * shift, normal[1] * shift]),   // Line A (start)
				                    Engine.Vec2.Add(end,   [ normal[0]  * shift, normal[1] * shift]),   // Line A (end)
				                    Engine.Vec2.Add(start, [-normal[0] * shift, -normal[1] * shift]),   // Line B (start)
				                    Engine.Vec2.Add(end,   [-normal[0] * shift, -normal[1] * shift]) ]; // Line B (end)
				Engine.Debug.RegisterDrawCommand(Engine.Debug.line_verts, extra_lines, colour);
			}
		}
	},

	// DrawRect : function(position, width, height, colour, camera)
	// {
	// 	draw_commands.push(
	// 	{
	// 		func   : Engine.Debug.debug_draw_func_rect,
	// 		config :
	// 		{
	// 			position : position,
	// 			width    : width,
	// 			height   : height,
	// 			colour   : colour || Engine.Colour.Red,
	// 			camera   : camera
	// 		}
	// 	});
	// },

	// DrawPolygon : function(vertices, colour, camera)
	// {
	// 	draw_commands.push(
	// 	{
	// 		func   : Engine.Debug.debug_draw_func_poly,
	// 		config :
	// 		{
	// 			vertices : vertices,
	// 			colour   : colour || Engine.Colour.Red,
	// 			camera   : camera
	// 		}
	// 	});
	// },

	// DrawCircle : function(position, radius, colour, camera)
	// {
	// 	draw_commands.push(
	// 	{
	// 		func   : Engine.Debug.debug_draw_func_circle,
	// 		config :
	// 		{
	// 			position : position,
	// 			radius   : radius,
	// 			colour   : colour || Engine.Colour.Red,
	// 			camera   : camera
	// 		}
	// 	});
	// },

	Update : function()
	{
		// Note: This is called prior to any user rendering, so can be
		//       used to clear out draw commands from previous frame
		Engine.Debug.draw_commands = [];
		Engine.Debug.line_verts.stream_index = 0;
		Engine.Debug.poly_verts.stream_index = 0;
	},

	Render : function()
	{
		if(Engine.Debug.draw_commands.length == 0)
			return;

		// Note: This is called post user-rendering so we can disable
		//       z-test and render draw commands in the order they were issued
		Engine.Gfx.EnableDepthTest(false);
		Engine.Gfx.EnableBlend(true);

		// Update vertex streams
		Engine.Gfx.UpdateDynamicVertexBuffer(Engine.Debug.line_verts.vbo, Engine.Debug.line_verts);
		Engine.Gfx.UpdateDynamicVertexBuffer(Engine.Debug.poly_verts.vbo, Engine.Debug.poly_verts);

		// Bind shader
		Engine.Gfx.BindShaderProgram(Engine.Debug.debug_draw_program_basic);

		// Setup transform (canvas space)
		var mtx_proj = mat4.create(); mat4.identity(mtx_proj);
		var canvas_size = Engine.Canvas.GetSize();
		mat4.ortho(mtx_proj, 0, canvas_size[0], 0, canvas_size[1], -1, 1);
		Engine.Gfx.SetShaderConstant("u_trans_model", Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_view",  Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_proj",  mtx_proj, Engine.Gfx.SC_MATRIX4);

		// Draw commands (using offsets into main vertex stream)
		for(var i = 0; i < Engine.Debug.draw_commands.length; ++i)
		{
			var command = Engine.Debug.draw_commands[i];
			Engine.Gfx.SetShaderConstant("u_colour", command.colour, Engine.Gfx.SC_COLOUR);
			Engine.Gfx.BindVertexBuffer(command.buffer.vbo);
			Engine.Gfx.DrawArray(command.offset, command.count);
		}
	},

	// ****************************************
	// Draw functions
	// ****************************************
	// debug_draw_func_circle : function(config)
	// {
	// 	// Bind shader
	// 	Engine.Gfx.BindShaderProgram(Engine.Debug.debug_draw_program_basic);

	// 	// Setup transform (canvas space)
	// 	var mtx_trans = mat4.create();
	// 	mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, [config.position[0], config.position[1], 0]);
	// 	mat4.scale(mtx_trans, mtx_trans, [config.radius, config.radius, 0.0]);
	// 	var mtx_proj = mat4.create(); mat4.identity(mtx_proj);
	// 	var canvas_size = Engine.Canvas.GetSize();
	// 	mat4.ortho(mtx_proj, 0, canvas_size[0], 0, canvas_size[1], -1, 1);
	// 	Engine.Gfx.SetShaderConstant("u_trans_model", mtx_trans, Engine.Gfx.SC_MATRIX4);
	// 	Engine.Gfx.SetShaderConstant("u_trans_view",  Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
	// 	Engine.Gfx.SetShaderConstant("u_trans_proj",  mtx_proj, Engine.Gfx.SC_MATRIX4);

	// 	// Set colour
	// 	Engine.Gfx.SetShaderConstant("u_colour", config.colour, Engine.Gfx.SC_COLOUR);

	// 	// Draw circle
	// 	Engine.Gfx.DrawModel(Engine.Debug.debug_draw_circle_model);
	// },

	// debug_draw_func_rect : function(config)
	// {
		

	// 	// Setup transform (canvas space)
	// 	var mtx_trans = mat4.create();
	// 	var x = config.position[0] + (config.width / 2);  // DrawRect is centered by default
	// 	var y = config.position[1] + (config.height / 2); // DrawRect is centered by default
	// 	mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, [x, y, 0]);
	// 	mat4.scale(mtx_trans, mtx_trans, [config.width / 2, config.height / 2, 0.0]);
	// 	var mtx_proj = mat4.create(); mat4.identity(mtx_proj);
	// 	var canvas_size = Engine.Canvas.GetSize();
	// 	mat4.ortho(mtx_proj, 0, canvas_size[0], 0, canvas_size[1], -1, 1);
	// 	Engine.Gfx.SetShaderConstant("u_trans_model", mtx_trans, Engine.Gfx.SC_MATRIX4);
	// 	Engine.Gfx.SetShaderConstant("u_trans_view",  Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
	// 	Engine.Gfx.SetShaderConstant("u_trans_proj",  mtx_proj, Engine.Gfx.SC_MATRIX4);

	// 	// Set colour
	// 	Engine.Gfx.SetShaderConstant("u_colour", config.colour, Engine.Gfx.SC_COLOUR);

	// 	// Draw rectangle
	// 	Engine.Gfx.DrawQuad();
	// },

	// debug_draw_func_poly : function(config)
	// {
	// 	var poly_verts =
	// 	{
	// 		attribute_name : "a_pos",
	// 		item_size      : 3,
	// 		draw_mode      : "triangle_fan",
	// 		stream         : [],
	// 	};

	// 	// Setup vertex stream
	// 	for(var i = 0; i < config.vertices.length; ++i)
	// 	{
	// 		var vert = config.vertices[i];
	// 		poly_verts.stream.push(vert[0]);
	// 		poly_verts.stream.push(vert[1]);
	// 		poly_verts.stream.push(0.0);
	// 	}

	// 	// Bind shader
	// 	Engine.Gfx.BindShaderProgram(Engine.Debug.debug_draw_program_basic);

	// 	// Create & bind poly vertex stream
	// 	var poly_vbo = Engine.Gfx.CreateVertexBuffer(poly_verts);
	// 	Engine.Gfx.BindVertexBuffer(poly_vbo);

	// 	// Setup transform (canvas space)
	// 	var mtx_proj = mat4.create(); mat4.identity(mtx_proj);
	// 	var canvas_size = Engine.Canvas.GetSize();
	// 	mat4.ortho(mtx_proj, 0, canvas_size[0], 0, canvas_size[1], -1, 1);
	// 	Engine.Gfx.SetShaderConstant("u_trans_model", Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
	// 	Engine.Gfx.SetShaderConstant("u_trans_view",  Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
	// 	Engine.Gfx.SetShaderConstant("u_trans_proj",  mtx_proj, Engine.Gfx.SC_MATRIX4);

	// 	// Set colour
	// 	Engine.Gfx.SetShaderConstant("u_colour", config.colour, Engine.Gfx.SC_COLOUR);

	// 	// Draw line
	// 	Engine.Gfx.DrawArray();
	// },

	Break : function()
	{
		debugger;
	}
}