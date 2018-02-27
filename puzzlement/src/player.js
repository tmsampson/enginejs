Core.Player = function()
{
	// Player config
	this.WalkSpeed = 2.0;
	this.CrouchSpeed = 1.0;
	this.RunSpeed = 3;
	this.HeadHeightStanding = 1.5;
	this.HeadHeightCrouched = 1.0;
	this.HeadBobHeight = 0.01;
	this.HeadBobSpeed = 12;
	this.HeadBobHeightRunning = 0.015;
	this.HeadBobSpeedRunning = 16;
	this.CrouchBlendSpeed = 2.9;

	// Input config
	this.MouseLookSensitivity = [ 2.5, 2.5 ];
	this.MouseInvertY = false;
	this.GamepadLookSensitivity = [ 120, 120 ];
	this.GamepadInvertY = true;

	// Transform
	this.Position = [0, this.HeadHeightStanding, 0];
	this.Up = [0, 1, 0];
	this.Forward = [0, 0, -1];
	this.Right = [1, 0, 0];

	// Misc
	this.TimeSpentMoving = 0;
	this.Camera = null;
	this.ScratchMatrix = null;
	this.CollisionRadius = 0.25;
	this.CurrentHeadHeight = this.HeadHeightStanding;
	this.IsCrouching = false;

	this.Init = function()
	{
		this.Camera = new Engine.Camera.Perspective();
		this.ScratchMatrix = mat4.create();
		Engine.Canvas.EnableContextMenu(false);
	};

	this.ProcessInput = function()
	{
		var gamepad = Engine.Gamepad.Pads[0];
		var is_running = this.CanRun() && (Engine.Keyboard.IsPressed("shift") || (gamepad && gamepad.IsPressed("lt")));
		var move_speed = (is_running? this.RunSpeed : (this.IsCrouching? this.CrouchSpeed : this.WalkSpeed)) * Engine.Time.delta_s;
		var movement_delta = [0, 0, 0];

		// Calculate surface forwards
		var surface_forward = Engine.Vec3.Copy(this.Forward); surface_forward[1] = 0.0;
		surface_forward = Engine.Vec3.Normalise(surface_forward);

		// Strafe forwards
		if(Engine.Keyboard.IsPressed("w"))
		{
			movement_delta = Engine.Vec3.MultiplyScalar(surface_forward, move_speed);
		}

		// Strafe backwards
		if(Engine.Keyboard.IsPressed("s"))
		{
			movement_delta = Engine.Vec3.MultiplyScalar(surface_forward, -move_speed);
		}

		// Strafe left
		if(Engine.Keyboard.IsPressed("a"))
		{
			movement_delta = Engine.Vec3.MultiplyScalar(this.Right, -move_speed);
		}

		// Strafe right
		if(Engine.Keyboard.IsPressed("d"))
		{
			movement_delta = Engine.Vec3.MultiplyScalar(this.Right, move_speed);
		}

		// Touch strafe
		if(Engine.Touch.IsSwipedUp())
		{
			movement_delta = Engine.Vec3.MultiplyScalar(surface_forward, move_speed * 20);
		}
		if(Engine.Touch.IsSwipedDown())
		{
			movement_delta = Engine.Vec3.MultiplyScalar(surface_forward, -move_speed * 20);
		}

		// Gamepad strafe
		if(gamepad)
		{
			var left_stick = gamepad.GetLeftStick();
			var right = Engine.Vec3.MultiplyScalar(this.Right, move_speed * left_stick[0]);
			var forward = Engine.Vec3.MultiplyScalar(surface_forward, move_speed * left_stick[1]);
			var strafe = Engine.Vec3.Add(right, forward);
			movement_delta = Engine.Vec3.Add(movement_delta, strafe);
		}

		// Apply movement?
		var has_moved = false;
		if(Engine.Vec3.Length(movement_delta) > 0.0)
		{
			var destination = Engine.Vec3.Add(this.Position, movement_delta);
			if(Collision.PositionIsValid(destination, this.CollisionRadius))
			{
				this.Position = destination;
				has_moved = true;
			}
		}

		// Query look
		var look_delta = [0, 0];
		if(Engine.Mouse.IsPressed("right"))
		{
			look_delta = Engine.Vec2.Multiply(Engine.Mouse.GetDelta(), this.MouseLookSensitivity);
			if(this.MouseInvertY)
			{
				look_delta[1] *= -1;
			}
		}
		else if(gamepad)
		{
			look_delta = Engine.Vec2.Multiply(gamepad.GetRightStick(), this.GamepadLookSensitivity);
			if(this.GamepadInvertY)
			{
				look_delta[1] *= -1;
			}
		}
		else if(Engine.Touch.IsSwipedLeft())
		{
			look_delta[0] =-1500;
		}
		else if(Engine.Touch.IsSwipedRight())
		{
			look_delta[0] = 1500;
		}

		// Apply look?
		if(Engine.Vec2.Length(look_delta) > 0.0)
		{
			var rot_up = Engine.Math.DegToRad(-look_delta[0]) * Engine.Time.delta_s;
			var rot_right = Engine.Math.DegToRad(look_delta[1]) * Engine.Time.delta_s;
			mat4.rotate(this.ScratchMatrix, Engine.Math.IdentityMatrix, rot_up, this.Up);
			mat4.rotate(this.ScratchMatrix, this.ScratchMatrix, rot_right, this.Right);
			vec3.transformMat4(this.Forward, this.Forward, this.ScratchMatrix);
		}

		// Update basis
		this.Right = Engine.Vec3.CrossProduct(this.Forward, this.Up);

		// Toggle crouch?
		if(Engine.Keyboard.WasJustPressed("shift") ||(gamepad && gamepad.WasJustPressed("b")))
		{
			this.IsCrouching = !this.IsCrouching;
		}

		// Calculate target head height
		var target_head_height = this.IsCrouching? this.HeadHeightCrouched : this.HeadHeightStanding
		var head_bob_offset = 0;

		// Interpolate towards target?
		var interpolate_head_height = (Engine.Math.Abs(this.CurrentHeadHeight - target_head_height) > 0.01);
		if(interpolate_head_height)
		{
			// Blend towards target head height
			var is_moving_down = target_head_height < this.CurrentHeadHeight;
			var interpolation_speed = this.CrouchBlendSpeed * Engine.Time.delta_s;
			this.CurrentHeadHeight = is_moving_down? Engine.Math.Max(this.CurrentHeadHeight - interpolation_speed, target_head_height) :
													 Engine.Math.Min(this.CurrentHeadHeight + interpolation_speed, target_head_height)
		}
		else
		{
			// Snap to target head height
			this.CurrentHeadHeight = target_head_height;

			// Apply head bob?
			if(!this.IsCrouching)
			{
				var head_bob_speed = is_running? this.HeadBobSpeedRunning : this.HeadBobSpeed;
				var head_bob_height = is_running? this.HeadBobHeightRunning : this.HeadBobHeight;
				this.TimeSpentMoving = has_moved? this.TimeSpentMoving + Engine.Time.delta_s : 0;
				head_bob_offset = (Math.sin(this.TimeSpentMoving * head_bob_speed) * head_bob_height);
			}

		}

		// Apply final head height
		this.Position[1] = this.CurrentHeadHeight + head_bob_offset;
	};

	this.Update = function()
	{
		this.ProcessInput();
		this.Camera.position = this.Position;
		this.Camera.look_at = Engine.Vec3.Add(this.Camera.position, this.Forward);
		this.Camera.Update();
	};

	this.CanRun = function()
	{
		return !this.IsCrouching;
	};
}