// *******************************************
//# sourceURL=modules/enginejs-camera.js
// *******************************************

Engine.Camera =
{
	// *************************************
	// Camera base class
	Base : function()
	{
		this.helpers  = [];
		this.viewport = { size : [1, 1], position: [0, 0] };
		this.mtx_view = mat4.create();
		this.mtx_view_inverse = mat4.create();
		this.mtx_view_without_translation = mat4.create();
		this.mtx_proj = mat4.create();
		this.mtx_view_proj = mat4.create();
		this.viewport_pos  = [ 0, 0 ];
		this.viewport_size = [ 0, 0 ];

		this.AttachHelper = function(helper_class)
		{
			this.helpers.push(helper_class);
		};

		this.BindViewport = function(render_target_size)
		{
			// Setup viewport
			this.viewport_pos =
			[
				this.viewport.position[0] * render_target_size[0],
				this.viewport.position[1] * render_target_size[1]
			];

			this.viewport_size =
			[
				this.viewport.size[0] * render_target_size[0],
				this.viewport.size[1] * render_target_size[1]
			];

			// Bind with webgl
			Engine.GL.viewport(this.viewport_pos[0],  this.viewport_pos[1],
			                   this.viewport_size[0], this.viewport_size[1]);
		};

		this.Update = function()
		{
			// Run any helpers
			for(var i = 0; i < this.helpers.length; ++i)
			{
				this.helpers[i].Update(this);
			}

			// Update matrices
			this.UpdateMatrices();

			// Maintain view * proj
			mat4.multiply(this.mtx_view_proj, this.mtx_proj, this.mtx_view);

			// Maintain inverse view matrix
			mat4.invert(this.mtx_view_inverse, this.mtx_view);

			// Maintain view matrix with zero translation (used for things like skybox rendering)
			mat4.copy(this.mtx_view_without_translation, this.mtx_view);
			this.mtx_view_without_translation[12] = 0;
			this.mtx_view_without_translation[13] = 0;
			this.mtx_view_without_translation[14] = 0;
			this.mtx_view_without_translation[15] = 1;
		};
	},

	// *************************************
	// Orthographic camera
	Orthographic : function(user_config)
	{
		// Inherit base
		$.extend(this, new Engine.Camera.Base());

		// Set defaults
		this.position        = [0, 0, 0];
		this.size            = Engine.Canvas.GetSize();
		this.use_canvas_size = !(user_config && user_config.size),
		this.follow          = null;
		$.extend(this, user_config); // Override defaults

		this.UpdateMatrices = function()
		{
			// Maintain "default" behaviour by keeping camera size in-sync
			// with canvas size unless user-defined size has been provided
			// via SetSize(), which clears the use_canvas_size flag.
			// Note: the "default" behavior can be restored using ResetSize()
			if(this.use_canvas_size)
			{
				this.size = Engine.Canvas.GetSize();
			}

			// Follow point?
			if(this.follow && this.follow.GetPosition)
			{
				this.position = Engine.Array.Copy(this.follow.GetPosition());
				this.position[0] -= this.size[0] / 2;
				this.position[1] -= this.size[1] / 2;
			}

			mat4.identity(this.mtx_view);

			// Camera x/y represents bottom left of view region
			mat4.ortho(this.mtx_proj,
			           this.position[0], this.position[0] + this.size[0],
			           this.position[1], this.position[1] + this.size[1],
			           -1000.0, 1000.0);
		};

		this.SetSize = function(size)
		{
			this.size = Engine.Array.Copy(size);
			this.use_canvas_size = false;
		};

		this.ResetSize = function()
		{
			this.use_canvas_size = true;
		};

		this.Follow = function(some_object)
		{
			this.follow = some_object;
		};

		this.WorldToCanvas = function(world_pos)
		{
			var world_pos = vec3.fromValues(world_pos[0], world_pos[1], 0);
			var screen_point = vec3.create();
			vec3.transformMat4(screen_point, world_pos, this.mtx_proj);
			return [ this.viewport_pos[0] + (screen_point[0] * this.viewport_size[0]),
					 this.viewport_pos[1] + (screen_point[1] * this.viewport_size[1]) ];
		};
	},

	// *************************************
	// Perspective camera
	Perspective : function(user_config)
	{
		// Inherit base
		$.extend(this, new Engine.Camera.Base());

		// Set defaults
		this.position = [0.0, 0.0, 0.0]; // Start at origin
		this.look_at  = [0.0, 0.0, 1.0]; // Looking down z-axis
		this.up       = [0.0, 1.0, 0.0]; // Default up
		this.fov      = 45.0;
		this.aspect   = Engine.Canvas.GetAspectRatio();
		this.near     = 0.1;
		this.far      = 1000;
		$.extend(this, user_config); // Override defaults

		this.UpdateMatrices = function()
		{
			this.aspect = Engine.Canvas.GetAspectRatio();
			mat4.lookAt(this.mtx_view, this.position, this.look_at, this.up);
			mat4.perspective(this.mtx_proj, this.fov, this.aspect, this.near, this.far);
		};

		this.WorldToCanvas = function(world_pos)
		{
			var pos = vec4.fromValues(world_pos[0],
			                          world_pos[1],
			                          world_pos[2],
			                          world_pos.length <= 3? 1.0 : world_pos[3]);
			var device_pos = vec4.create();
			vec4.transformMat4(device_pos, pos, this.mtx_view_proj);

			// Convert from device (-1 <= x <= 1) to viewport position (0 <= x <= width/height in pixels)
			return [ this.viewport_pos[0] + ((((device_pos[0] / device_pos[3]) + 1) / 2) * this.viewport_size[0]),
			         this.viewport_pos[1] + ((((device_pos[1] / device_pos[3]) + 1) / 2) * this.viewport_size[1]) ];
		}
	},
};

Engine.Camera.Helper =
{
	// *************************************
	// 3D Orbit
	Orbit : function(user_config)
	{
		this.process_input = true;                 // Update based on user input
		this.look_at       = [0.0, 0.0, 0.0];      // Look at origin
		this.up            = [0.0, 1.0, 0.0];      // Default up
		this.angles        = [0, 0];
		this.radius        = [5, 2, 10];           // Default, min, max
		this.min_y         = -(Math.PI / 2) + 0.1; // prevent alignment with -ve y-axis
		this.max_y         =  (Math.PI / 2) - 0.1; // prevent alignment with +ve y-axis

		// Override defaults
		$.extend(this, user_config);

		this.Update = function(camera)
		{
			// Only process input when mouse is over canvas
			if(Engine.Mouse.IsOverCanvas())
			{
				// Zoom
				var wheel_delta = Engine.Mouse.GetWheelDelta();
				if(wheel_delta != 0)
				{
					this.radius[0] -= wheel_delta * Engine.Time.delta_s / 3;
					this.radius[0] = Engine.Math.Clamp(this.radius[0], this.radius[1], this.radius[2]);
				}

				// Pan
				if(Engine.Mouse.IsPressed())
				{
					var mouse_delta = Engine.Mouse.GetDelta();
					this.angles[0] += mouse_delta[0] * Engine.Time.delta_s / 3;
					this.angles[1] = Engine.Math.Clamp(this.angles[1] - mouse_delta[1] * Engine.Time.delta_s / 3, this.min_y, this.max_y);
				}
			}

			// Update
			camera.look_at  = this.look_at;
			camera.up       = this.up;
			camera.position = [this.look_at[0] + this.radius[0] * Math.cos(this.angles[0]) * Math.cos(this.angles[1]),
			                   this.look_at[1] + this.radius[0] * Math.sin(this.angles[1]),
			                   this.look_at[2] + this.radius[0] * Math.sin(this.angles[0]) * Math.cos(this.angles[1])];
		};
	},

	// *************************************
	// 3D Roam
	Roam : function(user_config)
	{
		this.forward           = [0.0, 0.0, 1.0];
		this.right             = [0.0, 0.0, 0.0];
		this.strafe_speed      = 3;
		this.strafe_speed_fast = 10;
		this.look_speed        = [6, 6];
		this.gamepad_deadzone  = 0.1;
		this.mtx_look          = mat4.create();
		this.invert_y          = false;

		// Override defaults
		$.extend(this, user_config);

		// Disable canvas right-click menu as we handle right-click manually
		Engine.Canvas.EnableContextMenu(false);

		this.Update = function(camera)
		{
			var process_mouse = Engine.Mouse.IsOverCanvas(); // Only process when mouse is over canvas
			var gamepad = Engine.Gamepad.Pads[0];
			vec3.cross(this.right, this.forward, camera.up);

			// Apply mouse look?
			if(process_mouse && (Engine.Mouse.IsPressed() || Engine.Mouse.IsPressed("right")))
			{
				this.ApplyLook(Engine.Mouse.GetDelta(), false)
			}

			// Apply gamepad look
			if(gamepad)
			{
				var delta = gamepad.GetRightStick();
				delta[0] *= 20; delta[1] *= 20;
				this.ApplyLook(delta, true);
			}

			// Apply strafe?
			var strafe_speed = (Engine.Keyboard.IsPressed("shift") || (gamepad && gamepad.IsPressed("lt")))? this.strafe_speed_fast : this.strafe_speed;
			var strafe_delta = Engine.Time.delta_s * strafe_speed;
			if(gamepad)
			{
				var left_stick = gamepad.GetLeftStick();
				if(Engine.Math.Abs(gamepad.GetLeftStick()[0]) > this.gamepad_deadzone)
				{
					camera.position[0] += (this.right[0] * strafe_delta * left_stick[0]);
					camera.position[1] += (this.right[1] * strafe_delta * left_stick[0]);
					camera.position[2] += (this.right[2] * strafe_delta * left_stick[0]);
				}

				if(Engine.Math.Abs(gamepad.GetLeftStick()[1]) > this.gamepad_deadzone)
				{
					camera.position[0] += (this.forward[0] * strafe_delta * left_stick[1]);
					camera.position[1] += (this.forward[1] * strafe_delta * left_stick[1]);
					camera.position[2] += (this.forward[2] * strafe_delta * left_stick[1]);
				}
			}

			if(Engine.Keyboard.IsPressed("w"))
			{
				camera.position[0] += (this.forward[0] * strafe_delta);
				camera.position[1] += (this.forward[1] * strafe_delta);
				camera.position[2] += (this.forward[2] * strafe_delta);
			}

			if(Engine.Keyboard.IsPressed("s"))
			{
				camera.position[0] -= (this.forward[0] * strafe_delta);
				camera.position[1] -= (this.forward[1] * strafe_delta);
				camera.position[2] -= (this.forward[2] * strafe_delta);
			}

			if(Engine.Keyboard.IsPressed("a"))
			{
				camera.position[0] -= (this.right[0] * strafe_delta);
				camera.position[1] -= (this.right[1] * strafe_delta);
				camera.position[2] -= (this.right[2] * strafe_delta);
			}

			if(Engine.Keyboard.IsPressed("d"))
			{
				camera.position[0] += (this.right[0] * strafe_delta);
				camera.position[1] += (this.right[1] * strafe_delta);
				camera.position[2] += (this.right[2] * strafe_delta);
			}

			// Update lookat
			camera.forward = Engine.Vec3.Copy(this.forward);
			camera.look_at[0] = camera.position[0] + this.forward[0];
			camera.look_at[1] = camera.position[1] + this.forward[1];
			camera.look_at[2] = camera.position[2] + this.forward[2];
		};

		this.ApplyLook = function(delta, allow_invert)
		{
			mat4.rotate(this.mtx_look, Engine.Math.IdentityMatrix, Engine.Math.DegToRad(-delta[0] * this.look_speed[0] * Engine.Time.delta_s), [0, 1, 0]);
			mat4.rotate(this.mtx_look, this.mtx_look, Engine.Math.DegToRad(delta[1] * this.look_speed[1] * ((this.invert_y && allow_invert)? -1 : 1) * Engine.Time.delta_s), this.right);
			vec3.transformMat4(this.forward, this.forward, this.mtx_look);
		};
	},
};