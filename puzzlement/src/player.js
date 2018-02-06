Core.Player = function()
{
	// Config
	this.WalkSpeed = 0.06;
	this.RunSpeed = 0.12;
	this.HeadHeight = 1;
	this.HeadBobHeight = 0.01;
	this.HeadBobSpeed = 12;
	this.HeadBobHeightRunning = 0.015;
	this.HeadBobSpeedRunning = 16;
	this.LookSpeed = 1.5;
	this.LookInvertY = true;

	// Transform
	this.Position = [0, this.HeadHeight, 0];
	this.Up = [0, 1, 0];
	this.Forward = [0, 0, -1];
	this.Right = [1, 0, 0];

	// Misc
	this.TimeSpentMoving = 0;
	this.Camera = null;
	this.ScratchMatrix = null;
	this.CollisionRadius = 0.2;

	this.Init = function()
	{
		this.Camera = new Engine.Camera.Perspective();
		this.ScratchMatrix = mat4.create();
		Engine.Canvas.EnableContextMenu(false);
	};

	this.ProcessInput = function()
	{
		var move_attempted = false;
		var is_running = Engine.Keyboard.IsPressed("shift");
		var move_speed = is_running? this.RunSpeed : this.WalkSpeed;
		var movement_delta = [0, 0, 0];

		// Strafe forwards
		if(Engine.Keyboard.IsPressed("w"))
		{
			movement_delta = Engine.Vec3.MultiplyScalar(this.Forward, move_speed);
			move_attempted = true;
		}

		// Strafe backwards
		if(Engine.Keyboard.IsPressed("s"))
		{
			movement_delta = Engine.Vec3.MultiplyScalar(this.Forward, -move_speed);
			move_attempted = true;
		}

		// Strafe left
		if(Engine.Keyboard.IsPressed("a"))
		{
			movement_delta = Engine.Vec3.MultiplyScalar(this.Right, -move_speed);
			move_attempted = true;
		}

		// Strafe right
		if(Engine.Keyboard.IsPressed("d"))
		{
			movement_delta = Engine.Vec3.MultiplyScalar(this.Right, move_speed);
			move_attempted = true;
		}

		// Apply movement?
		var has_moved = false;
		if(move_attempted)
		{
			var destination = Engine.Vec3.Add(this.Position, movement_delta);
			if(Collision.PositionIsValid(destination, this.CollisionRadius))
			{
				this.Position = destination;
				has_moved = true;
			}
		}

		// Look?
		if(Engine.Mouse.IsPressed("right"))
		{
			var delta = Engine.Mouse.GetDelta();
			var rot_y = Engine.Math.DegToRad(-delta[0] * this.LookSpeed * Engine.Time.delta_s);
			mat4.rotate(this.ScratchMatrix, Engine.Math.IdentityMatrix, rot_y, [0, 1, 0]);
			mat4.rotate(this.ScratchMatrix, this.ScratchMatrix, Engine.Math.DegToRad(delta[1] * this.LookSpeed * Engine.Time.delta_s), this.Right);
			vec3.transformMat4(this.Forward, this.Forward, this.ScratchMatrix);
		}

		// Update basis
		this.Right = Engine.Vec3.CrossProduct(this.Forward, this.Up);

		// Apply head bob
		var head_bob_speed = is_running? this.HeadBobSpeedRunning : this.HeadBobSpeed;
		var head_bob_height = is_running? this.HeadBobHeightRunning : this.HeadBobHeight;
		this.TimeSpentMoving = has_moved? this.TimeSpentMoving + Engine.Time.delta_s : 0;
		this.Position[1] = this.HeadHeight + (Math.sin(this.TimeSpentMoving * head_bob_speed) * head_bob_height);
	};

	this.Update = function()
	{
		this.ProcessInput();
		this.Camera.position = this.Position;
		this.Camera.look_at = Engine.Vec3.Add(this.Camera.position, this.Forward);
		this.Camera.Update();
	};
}