// *******************************************
//# sourceURL=modules/enginejs-debug.js
// *******************************************

Engine.Debug =
{
	draw_commands : [],

	// Shader programs
	debug_draw_program_line : null,

	PreGameLoopInit : function()
	{
		Engine.Debug.debug_draw_program_line = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_basic_transformed"],
		                                       Engine.Resources["fs_basic_colour"]);
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
		for(var i = 0; i < draw_commands.length; ++i)
		{
			var command = draw_commands[i];
			command.func(command.config);
		}
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

		// Bind shader
		Engine.Gfx.BindShaderProgram(Engine.Debug.debug_draw_program_line);

		// Create & bind line vertex stream
		var line_vbo = Engine.Gfx.CreateVertexBuffer(line_verts);
		Engine.Gfx.BindVertexBuffer(line_vbo);

		// Setup transform (canvas space)
		var mtx_identity = mat4.create(); mat4.identity(mtx_identity);
		var mtx_proj = mat4.create(); mat4.identity(mtx_proj);
		var canvas_size = Engine.Canvas.GetSize();
		mat4.ortho(mtx_proj, 0, canvas_size[0], 0, canvas_size[1], -1, 1);
		Engine.Gfx.SetShaderConstant("u_trans_model", mtx_identity, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_view",  mtx_identity, Engine.Gfx.SC_MATRIX4);
		Engine.Gfx.SetShaderConstant("u_trans_proj",  mtx_proj,     Engine.Gfx.SC_MATRIX4);

		// Set colour
		Engine.Gfx.SetShaderConstant("u_colour", config.colour, Engine.Gfx.SC_COLOUR);

		// Draw line
		Engine.Gfx.DrawArray();
	},

	Break : function()
	{
		debugger;
	}
}