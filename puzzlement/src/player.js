Core.Player = function()
{
	this.Camera = null;
	this.Position = [0, 0, 0];

	this.Init = function()
	{
		this.Camera = new Engine.Camera.Perspective({ position : [0, 1, 0], look_at : [0, 1, -1] });
	};

	this.Update = function()
	{
		this.Camera.Update();
	};
}