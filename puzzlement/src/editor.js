Editor =
{
	GetDebugFloorTileMat : function()
	{
		return Core.Resources["mat_floor_debug"];
	},

	Init : function()
	{
	},

	Update : function()
	{
		// Room dimensions
		if(Engine.Keyboard.IsPressed("r", false))
		{
			if(Engine.Keyboard.WasJustPressed("right", true) && Core.Map.RoomSizeX < Constants.MaxRoomSize)
			{
				++Core.Map.RoomSizeX;
			}
			else if(Engine.Keyboard.WasJustPressed("left", true) && Core.Map.RoomSizeX > Constants.MinRoomSize)
			{
				--Core.Map.RoomSizeX;
			}
			else if(Engine.Keyboard.WasJustPressed("up", true) && Core.Map.RoomSizeZ < Constants.MaxRoomSize)
			{
				++Core.Map.RoomSizeZ;
			}
			else if(Engine.Keyboard.WasJustPressed("down", true) && Core.Map.RoomSizeZ > Constants.MinRoomSize)
			{
				--Core.Map.RoomSizeZ;
			}
		}
	},

	Render : function()
	{
	},
};