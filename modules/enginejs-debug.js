// *******************************************
//# sourceURL=modules/enginejs-debug.js
// *******************************************

Engine.Debug =
{
	// Draw command queues
	draw_commands_2d           : [],
	draw_commands_3d_z_test    : [],
	draw_commands_3d_no_z_test : [],

	// Resources
	shader_program             : null,
	circle_model               : null,

	// Dynamic polygon soup for debug geometry (arbitrary lines & polygons)
	soup_vbo                   : null,
	soup_idx                   : 0, // Current write offset into soup
	soup_max_verts             : 10000,
	soup_descriptor            :
	{
		attribute_name         : "a_pos",
		item_size              : 3,
		draw_mode              : "lines",
		stream_index           : 0
	},

	// Deferred queues for rect/cirlces
	prim_queue                 : [],

	PreGameLoopInit : function()
	{
		// Setup shader / prim models
		Engine.Debug.shader_program = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_general_transformed"],
		                                                             Engine.Resources["fs_unlit_colour"]);
		Engine.Debug.circle_model = Engine.Geometry.MakeCircle({ segment_count : 50 });

		// Allocate soup
		Engine.Debug.soup_descriptor.stream = new Float32Array(Engine.Debug.soup_max_verts);

		// Setup vertex buffer object
		Engine.Debug.soup_vbo = Engine.Gfx.CreateVertexBuffer(Engine.Debug.soup_descriptor);
	},

	InitDrawCommand : function(command)
	{
		// Validate
		command.offset = Engine.Debug.soup_idx / Engine.Debug.soup_descriptor.item_size;
		var new_length = command.offset + command.vertices.length;
		if(new_length > Engine.Debug.soup_max_verts)
		{
			Engine.LogError("Debug draw buffer overflow, required = " + new_length + ", max = " + Engine.Debug.soup_max_verts);
		}
	},

	AddDrawCommand2D : function(command)
	{
		// Init / validate command
		Engine.Debug.InitDrawCommand(command);

		// Copy command verts into soup
		for(var i = 0; i < command.vertices.length; ++i)
		{
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = command.vertices[i][0];
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = command.vertices[i][1];
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = 0;
		}

		// Clear command verts
		command.length = command.vertices.length;
		command.vertices = [];

		// Register
		Engine.Debug.draw_commands_2d.push(command);
	},

	AddDrawCommand3D : function(command)
	{
		// Init / validate command
		Engine.Debug.InitDrawCommand(command);

		// Copy command verts into soup
		for(var i = 0; i < command.vertices.length; ++i)
		{
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = command.vertices[i][0];
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = command.vertices[i][1];
			Engine.Debug.soup_descriptor.stream[Engine.Debug.soup_idx++] = command.vertices[i][2];
		}

		// Clear command verts
		command.length = command.vertices.length;
		command.vertices = [];

		// Register
		if(command.z_test)
		{
			Engine.Debug.draw_commands_3d_z_test.push(command);
		}
		else
		{
			Engine.Debug.draw_commands_3d_no_z_test.push(command);
		}
	},

	DrawLine : function(start, end, colour, thickness)
	{
		// Default params
		colour = Engine.Util.IsDefined(colour)? colour : Engine.Colour.Red;
		thickness = Engine.Util.IsDefined(thickness)? thickness : 1.0;

		// Draw main line
		Engine.Debug.AddDrawCommand2D({ vertices : [start, end], colour : colour, draw_mode : "lines" });

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
				var extra_lines = [ Engine.Vec2.Add(start, [ normal[0] * shift,  normal[1] * shift]),   // Line A (start)
				                    Engine.Vec2.Add(end,   [ normal[0] * shift,  normal[1] * shift]),   // Line A (end)
				                    Engine.Vec2.Add(start, [-normal[0] * shift, -normal[1] * shift]),   // Line B (start)
				                    Engine.Vec2.Add(end,   [-normal[0] * shift, -normal[1] * shift]) ]; // Line B (end)
				Engine.Debug.AddDrawCommand2D({ vertices : extra_lines, colour : colour, draw_mode : "lines" });
			}
		}
	},

	DrawLine3D : function(camera, start, end, colour, thickness, depth_test)
	{
		// Default params
		colour = Engine.Util.IsDefined(colour)? colour : Engine.Colour.Red;
		thickness = Engine.Util.IsDefined(thickness)? thickness : 1.0;
		depth_test = Engine.Util.IsDefined(depth_test)? depth_test : true;

		// Draw line in 3D
		Engine.Debug.AddDrawCommand3D({ camera : camera, vertices : [start, end], colour : colour, draw_mode : "lines", z_test : depth_test });
	},

	DrawArrow : function(start, end, colour, thickness, head_angle, head_length)
	{
		// Default params
		colour = Engine.Util.IsDefined(colour)? colour : Engine.Colour.Red;
		thickness = Engine.Util.IsDefined(colour)? thickness : 1.0;
		head_angle = Engine.Util.IsDefined(head_angle)? head_angle : 30.0 * (Math.PI / 180);
		head_length = Engine.Util.IsDefined(head_length)? head_length : 10.0;

		// Draw main line
		Engine.Debug.DrawLine(start, end, colour, thickness);

		// Calculat arrow head
		var reverse = vec2.fromValues(start[0] - end[0], start[1] - end[1]);
		vec2.normalize(reverse, reverse);
		vec2.scale(reverse, reverse, head_length);

		// Draw arrow head 1
		var s = Math.sin(head_angle);
		var c = Math.cos(head_angle);
		var tip = [ end[0] + (reverse[0] * c - reverse[1] * s), end[1] + (reverse[0] * s + reverse[1] * c)];
		Engine.Debug.DrawLine(end, tip, colour);

		// Draw arrow head 2
		s = Math.sin(-head_angle);
		c = Math.cos(-head_angle);
		tip = [ end[0] + (reverse[0] * c - reverse[1] * s), end[1] + (reverse[0] * s + reverse[1] * c)];
		Engine.Debug.DrawLine(end, tip, colour);
	},

	DrawArrow3D : function(camera, start, end, colour, thickness, depth_test, head_angle, head_length)
	{
		// Not yet supported, just draw a normal line for now...
		Engine.Debug.DrawLine3D(camera, start, end, colour, thickness, depth_test);
	},

	DrawPolygon : function(vertices, colour)
	{
		Engine.Debug.AddDrawCommand2D({ vertices : vertices, colour : colour, draw_mode : "triangle_fan" });
	},

	DrawRect : function(position, width, height, colour)
	{
		// Setup transform (canvas space)
		var mtx_trans = mat4.create();
		var x = position[0] + (width  / 2); // DrawRect is centered by default
		var y = position[1] + (height / 2); // DrawRect is centered by default
		mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, [x, y, 0]);
		mat4.scale(mtx_trans, mtx_trans, [width / 2, height / 2, 0.0]);

		// Deferred draw
		Engine.Debug.prim_queue.push({ type : "rect", mtx : mtx_trans, colour : colour});
	},

	DrawCircle : function(position, radius, colour)
	{
		// Setup transform (canvas space)
		var mtx_trans = mat4.create();
		mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, [position[0], position[1], 0]);
		mat4.scale(mtx_trans, mtx_trans, [radius, radius, 0.0]);

		// Deferred draw
		Engine.Debug.prim_queue.push({ type : "circle", mtx : mtx_trans, colour : colour});
	},

	Update : function()
	{
		// Note: This is called prior to any user rendering, so can be
		//       used to clear out draw commands from previous frame
		Engine.Debug.draw_commands_2d = [];
		Engine.Debug.draw_commands_3d_z_test = [];
		Engine.Debug.draw_commands_3d_no_z_test = [];
		Engine.Debug.prim_queue = [];
		Engine.Debug.soup_idx = 0;
	},

	Render : function()
	{
		var bind_soup = Engine.Debug.draw_commands_2d.length > 0 ||
		                Engine.Debug.draw_commands_3d_z_test.length > 0 ||
		                Engine.Debug.draw_commands_3d_no_z_test.length > 0;
		if(bind_soup)
		{
			// Update dynamic soup
			Engine.Gfx.UpdateDynamicVertexBuffer(Engine.Debug.soup_vbo, Engine.Debug.soup_descriptor);

			// Bind soup
			Engine.Gfx.BindVertexBuffer(Engine.Debug.soup_vbo);
		}

		// Render 3D commands (z-test)?
		if(Engine.Debug.draw_commands_3d_z_test.length != 0)
		{
			// Setup
			Engine.Gfx.EnableDepthTest(true);

			// Bind shader
			Engine.Gfx.BindShaderProgram(Engine.Debug.shader_program);

			// Draw
			var mtx_identity = mat4.create(); mat4.identity(mtx_identity);
			for(var i = 0; i < Engine.Debug.draw_commands_3d_z_test.length; ++i)
			{
				var command = Engine.Debug.draw_commands_3d_z_test[i];
				Engine.Gfx.BindCamera(command.camera);
				Engine.Gfx.SetShaderConstant("u_colour", command.colour, Engine.Gfx.SC_COLOUR);
				Engine.Gfx.SetShaderConstant("u_trans_world", mtx_identity, Engine.Gfx.SC_MATRIX4);
				Engine.Gfx.DrawArray(command.offset, command.length, command.draw_mode);
			}
		}

		// Render 3D commands (no z-test)?
		if(Engine.Debug.draw_commands_3d_no_z_test.length != 0)
		{
			// Setup
			Engine.Gfx.EnableDepthTest(false);

			// Bind shader
			Engine.Gfx.BindShaderProgram(Engine.Debug.shader_program);

			// Draw
			var mtx_identity = mat4.create(); mat4.identity(mtx_identity);
			for(var i = 0; i < Engine.Debug.draw_commands_3d_no_z_test.length; ++i)
			{
				var command = Engine.Debug.draw_commands_3d_no_z_test[i];
				Engine.Gfx.BindCamera(command.camera);
				Engine.Gfx.SetShaderConstant("u_colour", command.colour, Engine.Gfx.SC_COLOUR);
				Engine.Gfx.SetShaderConstant("u_trans_world", mtx_identity, Engine.Gfx.SC_MATRIX4);
				Engine.Gfx.DrawArray(command.offset, command.length, command.draw_mode);
			}
		}

		// Render 2D commands?
		if(Engine.Debug.draw_commands_2d.length != 0 || Engine.Debug.prim_queue.length != 0)
		{
			// Note: This is called post user-rendering so we can disable
			//       z-test and render draw commands in the order they were issued
			Engine.Gfx.EnableDepthTest(false);
			Engine.Gfx.EnableBlend(true);

			// Bind shader
			Engine.Gfx.BindShaderProgram(Engine.Debug.shader_program);

			// Setup transform (canvas space)
			var mtx_proj = mat4.create(); mat4.identity(mtx_proj);
			var canvas_size = Engine.Canvas.GetSize();
			mat4.ortho(mtx_proj, 0, canvas_size[0], 0, canvas_size[1], -1, 1);
			Engine.Gfx.SetShaderConstant("u_trans_world", Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
			Engine.Gfx.SetShaderConstant("u_trans_view",  Engine.Math.IdentityMatrix, Engine.Gfx.SC_MATRIX4);
			Engine.Gfx.SetShaderConstant("u_trans_proj",  mtx_proj, Engine.Gfx.SC_MATRIX4);

			// Draw lines and polys (using offsets into vertex soup)
			if(Engine.Debug.draw_commands_2d.length > 0)
			{
				for(var i = 0; i < Engine.Debug.draw_commands_2d.length; ++i)
				{
					var command = Engine.Debug.draw_commands_2d[i];
					Engine.Gfx.SetShaderConstant("u_colour", command.colour, Engine.Gfx.SC_COLOUR);
					Engine.Gfx.DrawArray(command.offset, command.length, command.draw_mode);
				}
			}

			// Draw deferred prims (rect & circles)
			if(Engine.Debug.prim_queue.length > 0)
			{
				for(var i = 0; i < Engine.Debug.prim_queue.length; ++i)
				{
					var prim = Engine.Debug.prim_queue[i];
					Engine.Gfx.SetShaderConstant("u_colour", prim.colour, Engine.Gfx.SC_COLOUR);
					Engine.Gfx.SetShaderConstant("u_trans_world", prim.mtx, Engine.Gfx.SC_MATRIX4);
					switch(prim.type)
					{
						case "rect":
							Engine.Gfx.DrawQuad(); break;
						case "circle":
							Engine.Gfx.DrawModel(Engine.Debug.circle_model); break;
					}
				}
			}
		}
	},

	Break : function()
	{
		debugger;
	}
}