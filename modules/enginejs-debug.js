// *******************************************
//# sourceURL=modules/enginejs-debug.js
// *******************************************

Engine.Debug =
{
	draw_commands : [],

	// Resources
	debug_draw_program_basic : null,
	debug_draw_circle_model  : null,

	PreGameLoopInit : function()
	{
		Engine.Debug.debug_draw_program_basic = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_basic_transformed"],
		                                       Engine.Resources["fs_basic_colour"]);

		Engine.Debug.debug_draw_circle_model = Engine.Geometry.MakeCircle({ segment_count : 50 });
	},

	DrawLine : function(start, end, colour, thickness, camera)
	{
		draw_commands.push(
		{
			func   : Engine.Debug.debug_draw_func_line,
			config :
			{
				start     : start,
				end       : end,
				colour    : colour    || Engine.Colour.Red,
				thickness : thickness || 1,
				camera    : camera
			}
		});
	},

	DrawRect : function(position, width, height, colour, camera)
	{
		draw_commands.push(
		{
			func   : Engine.Debug.debug_draw_func_rect,
			config :
			{
				position : position,
				width    : width,
				height   : height,
				colour   : colour || Engine.Colour.Red,
				camera   : camera
			}
		});
	},

	DrawCircle : function(position, radius, colour, camera)
	{
		draw_commands.push(
		{
			func   : Engine.Debug.debug_draw_func_circle,
			config :
			{
				position : position,
				radius   : radius,
				colour   : colour || Engine.Colour.Red,
				camera   : camera
			}
		});
	},

	Update : function()
	{
		// Note: This is called prior to any user rendering, so can be
		//       used to clear out draw commands from previous frame
		draw_commands = [];
	},

	Render : function()
	{
		// Note: This is called post user-rendering so we can disable
		//       z-test and render draw commands in order they were issued
		Engine.Gfx.EnableDepthTest(false);
		Engine.Gfx.EnableBlend(false);

		for(var i = 0; i < draw_commands.length; ++i)
		{
			var command = draw_commands[i];
			command.func(command.config);
		}

		Engine.Gfx.EnableBlend(true);
	},

	// ****************************************
	// Draw functions
	// ****************************************
	debug_draw_func_line : function(config)
	{
		var line_verts =
		{
			attribute_name : "a_pos",
			item_size      : 3,
			draw_mode      : "lines",
			stream         : [config.start[0], config.start[1], 0,
			                  config.end[0],   config.end[1],   0]
		};

		// Calculate line normal
		var normal = Engine.Vec2.Normal(Engine.Vec2.Subtract(config.end, config.start));

		// Bind shader
		Engine.Gfx.BindShaderProgram(Engine.Debug.debug_draw_program_basic);

		// Create & bind line vertex stream
		var line_vbo = Engine.Gfx.CreateVertexBuffer(line_verts);
		Engine.Gfx.BindVertexBuffer(line_vbo);

		// Setup transform (canvas space)
		var mtx_proj = mat4.create(); mat4.identity(mtx_proj);
		var canvas_size = Engine.Canvas.GetSize();
		mat4.ortho(mtx_proj, 0, canvas_size[0], 0, canvas_size[1], -1, 1);
		Engine.Gfx.SetShaderConstant("u_trans_model", Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_view",  Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_proj",  mtx_proj, Engine.Gfx.SC_MATRIX4);

		// Set colour
		Engine.Gfx.SetShaderConstant("u_colour", config.colour, Engine.Gfx.SC_COLOUR);

		// Draw line
		Engine.Gfx.DrawArray();

		// Thicken line?
		if(config.thickness > 1)
		{
			var mtx_trans = mat4.create();
			var lines_per_side = Math.ceil((config.thickness - 1) / 2);
			var lines_total = 1 + (lines_per_side * 2);
			for(var i = 0; i < lines_per_side; ++i)
			{
				var shift = (config.thickness / lines_total) * (i + 1);
				mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, [normal[0] * shift, normal[1] * shift, 0]);
				Engine.Gfx.SetShaderConstant("u_trans_model", mtx_trans, Engine.Gfx.SC_MATRIX4);
				Engine.Gfx.DrawArray();
				mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, [-normal[0] * shift, -normal[1] * shift, 0]);
				Engine.Gfx.SetShaderConstant("u_trans_model", mtx_trans, Engine.Gfx.SC_MATRIX4);
				Engine.Gfx.DrawArray();
			}
		}
	},

	debug_draw_func_circle : function(config)
	{
		// Bind shader
		Engine.Gfx.BindShaderProgram(Engine.Debug.debug_draw_program_basic);

		// Setup transform (canvas space)
		var mtx_trans = mat4.create();
		mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, [config.position[0], config.position[1], 0]);
		mat4.scale(mtx_trans, mtx_trans, [config.radius, config.radius, 0.0]);
		var mtx_proj = mat4.create(); mat4.identity(mtx_proj);
		var canvas_size = Engine.Canvas.GetSize();
		mat4.ortho(mtx_proj, 0, canvas_size[0], 0, canvas_size[1], -1, 1);
		Engine.Gfx.SetShaderConstant("u_trans_model", mtx_trans, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_view",  Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_proj",  mtx_proj, Engine.Gfx.SC_MATRIX4);

		// Set colour
		Engine.Gfx.SetShaderConstant("u_colour", config.colour, Engine.Gfx.SC_COLOUR);

		// Draw circle
		Engine.Gfx.DrawModel(Engine.Debug.debug_draw_circle_model);
	},

	debug_draw_func_rect : function(config)
	{
		// Bind shader
		Engine.Gfx.BindShaderProgram(Engine.Debug.debug_draw_program_basic);

		// Setup transform (canvas space)
		var mtx_trans = mat4.create();
		var x = config.position[0] + (config.width / 2); // DrawRect is centered by default
		var y = config.position[1] + (config.height / 2); // DrawRect is centered by default
		mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, [x, y, 0]);
		mat4.scale(mtx_trans, mtx_trans, [config.width / 2, config.height / 2, 0.0]);
		var mtx_proj = mat4.create(); mat4.identity(mtx_proj);
		var canvas_size = Engine.Canvas.GetSize();
		mat4.ortho(mtx_proj, 0, canvas_size[0], 0, canvas_size[1], -1, 1);
		Engine.Gfx.SetShaderConstant("u_trans_model", mtx_trans, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_view",  Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_proj",  mtx_proj, Engine.Gfx.SC_MATRIX4);

		// Set colour
		Engine.Gfx.SetShaderConstant("u_colour", config.colour, Engine.Gfx.SC_COLOUR);

		// Draw rectangle
		Engine.Gfx.DrawQuad();
	},

	Break : function()
	{
		debugger;
	}
}