Editor.Mode_Walls = function()
{
	this.Name			= "WALLS";
	this.EnableCursor	= true;

	this.Init = function()
	{

	};

	this.Update = function()
	{
		if(Editor.SelectedTile != null)
		{
			// Update debug text
			Editor.SubText.Set(Editor.SelectedTile);

			// Calculate cell pos (0..1 in each axis)
			var cell_pos = Core.WorldToCellPos(Editor.SelectedTileHitPos);
			Engine.Log(cell_pos);
		}

		// Edit wall height?
		if(Engine.Keyboard.WasJustPressed("up") && Core.Map.RoomSizeZ < Constants.MaxRoomSize - 2)
		{
			Core.Map.WallHeight +=0.5;
		}
		else if(Engine.Keyboard.WasJustPressed("down") && Core.Map.RoomSizeZ > Constants.MinRoomSize + 2)
		{
			Core.Map.WallHeight -=0.5;
		}
	};

	this.Render = function()
	{
	};
};