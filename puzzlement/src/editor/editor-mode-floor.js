Editor.Mode_Scene = function()
{
	this.name = "SCENE";

	this.Init = function()
	{

	};

	this.Update = function()
	{
		// Edit room dimensions?
		if(Engine.Keyboard.WasJustPressed("right") && Core.Map.RoomSizeX < Constants.MaxRoomSize - 2)
		{
			Core.Map.RoomSizeX +=2;
		}
		else if(Engine.Keyboard.WasJustPressed("left") && Core.Map.RoomSizeX > Constants.MinRoomSize + 2)
		{
			Core.Map.RoomSizeX -=2;
		}
		else if(Engine.Keyboard.WasJustPressed("up") && Core.Map.RoomSizeZ < Constants.MaxRoomSize - 2)
		{
			Core.Map.RoomSizeZ +=2;
		}
		else if(Engine.Keyboard.WasJustPressed("down") && Core.Map.RoomSizeZ > Constants.MinRoomSize + 2)
		{
			Core.Map.RoomSizeZ -=2;
		}
	};

	this.Render = function()
	{
	};
};