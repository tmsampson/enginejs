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
		this.mtx_view = mat4.create();
		this.mtx_proj = mat4.create();

		this.AttachHelper = function(helper_class)
		{
			this.helpers.push(helper_class);
		};

		this.Update = function(info)
		{
			// Run any helpers
			for(var i = 0; i < this.helpers.length; ++i)
			{
				this.helpers[i].Update(this, info);
			}

			// Update matrices
			this.UpdateMatrices();
		};
	},

	// *************************************
	// Orthographic camera
	Orthographic : function(user_config)
	{
		// Inherit base
		$.extend(this, new Engine.Camera.Base());

		// Set defaults
		this.position = [0, 0];
		this.size     = [512, 512];
		$.extend(this, user_config); // Override defaults

		this.UpdateMatrices = function()
		{
			mat4.identity(this.mtx_view);

			// Camera x/y represents bottom left of view region
			mat4.ortho(this.mtx_proj,
			           this.position[0], this.position[0] + this.size[0],
			           this.position[1], this.position[1] + this.size[1],
			           -1000.0, 1000.0);
		};

		this.ResizeViewport = function(new_size)
		{
			this.size = new_size;
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
		this.far      = 100;
		$.extend(this, user_config); // Override defaults

		this.UpdateMatrices = function()
		{
			mat4.lookAt(this.mtx_view, this.position, this.look_at, this.up);
			mat4.perspective(this.mtx_proj, this.fov, this.aspect, this.near, this.far);
		};

		this.ResizeViewport = function(new_size)
		{
			this.aspect = new_size[0] / new_size[1];
		};
	},
};

Engine.Camera.Helper =
{
	// *************************************
	// 3D Orbit
	Orbit : function(user_config)
	{
		this.process_input = true;      // Update based on user input
		this.look_at       = [0.0, 0.0, 0.0]; // Look at origin
		this.up            = [0.0, 1.0, 0.0]; // Default up
		this.angles        = [0, 0];
		this.radius        = 5;
		this.min_y         = -(Math.PI / 2) + 0.1; // prevent alignment with -ve y-axis
		this.max_y         =  (Math.PI / 2) - 0.1; // prevent alignment with +ve y-axis

		// Override defaults
		$.extend(this, user_config);

		this.Update = function(camera, info)
		{
			// Zoom
			var wheel_delta = Engine.Mouse.GetWheelDelta();
			if(wheel_delta != 0) { this.radius -= wheel_delta * info.delta_s / 3; }

			// Pan
			if(Engine.Mouse.IsPressed())
			{
				var mouse_delta = Engine.Mouse.GetDelta();
				this.angles[0] += mouse_delta[0] * info.delta_s / 3;
				this.angles[1] = Engine.Math.Clamp(this.angles[1] - mouse_delta[1] * info.delta_s / 3, this.min_y, this.max_y);
			}

			// Update
			camera.look_at  = this.look_at;
			camera.up       = this.up;
			camera.position = [this.look_at[0] + this.radius * Math.cos(this.angles[0]) * Math.cos(this.angles[1]),
			                   this.look_at[1] + this.radius * Math.sin(this.angles[1]),
			                   this.look_at[2] + this.radius * Math.sin(this.angles[0]) * Math.cos(this.angles[1])];
		};
	},
};