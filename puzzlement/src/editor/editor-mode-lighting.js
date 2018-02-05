Editor.Mode_Lighting = function()
{
	this.Name 					= "LIGHTING";
	this.EnableCursor 			= false;
	this.MoveSpeed				= 0.1;

	this.Init = function()
	{
		this.UpdateLight();
	};

	this.Update = function()
	{
		this.UpdateLight();
	};

	this.UpdateLight = function()
	{
		// Move light around
		if(Engine.Keyboard.WasJustPressed("left"))
		{
			Core.Map.Sun.position[0] -= this.MoveSpeed;
		}
		if(Engine.Keyboard.WasJustPressed("right"))
		{
			Core.Map.Sun.position[0] += this.MoveSpeed;
		}
		if(Engine.Keyboard.WasJustPressed("up"))
		{
			Core.Map.Sun.position[2] += this.MoveSpeed;
		}
		if(Engine.Keyboard.WasJustPressed("down"))
		{
			Core.Map.Sun.position[2] -= this.MoveSpeed;
		}
		if(Engine.Keyboard.WasJustPressed("u"))
		{
			Core.Map.Sun.position[1] += this.MoveSpeed;
		}
		if(Engine.Keyboard.WasJustPressed("j"))
		{
			Core.Map.Sun.position[1] -= this.MoveSpeed;
		}

		// Update directional light direction
		Core.Map.Sun.direction = Engine.Vec3.Normalise(Engine.Vec3.MultiplyScalar(Core.Map.Sun.position, -1.0));
		Engine.Gfx.SetDirectionalLight(Core.Map.Sun);
	};

	this.Render = function()
	{
	};
};