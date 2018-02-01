Editor.Mode_Lighting = function()
{
	this.Name 					= "LIGHTING";
	this.EnableCursor 			= false;

	this.Init = function()
	{
	};

	this.Update = function()
	{
		// Update directional light angle
		Core.Map.Sun.angle -= Engine.Mouse.GetWheelDelta() / 50;
		Core.Map.Sun.angle = Engine.Math.Clamp(Core.Map.Sun.angle, -90, 90);

		// Update directional light position
		Core.Map.Sun.position[0] = Math.sin(Engine.Math.DegToRad(Core.Map.Sun.angle)) * Core.Map.Sun.arc_radius[0];
		Core.Map.Sun.position[1] = Core.Map.Sun.arc_lift + Math.cos(Engine.Math.DegToRad(Core.Map.Sun.angle)) * Core.Map.Sun.arc_radius[1];
		Core.Map.Sun.position[2] = 8;

		// Update directional light direction
		var len = Math.sqrt((Core.Map.Sun.position[0] * Core.Map.Sun.position[0]) + (Core.Map.Sun.position[1]  * Core.Map.Sun.position[1]));
		Core.Map.Sun.direction = [ -Core.Map.Sun.position[0] / len, -Core.Map.Sun.position[1] / len, 0 ];
		Engine.Gfx.SetDirectionalLight(Core.Map.Sun);
	};

	this.Render = function()
	{
	};
};