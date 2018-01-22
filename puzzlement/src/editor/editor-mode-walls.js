Editor.Mode_Walls = function()
{
	this.Name					= "WALLS";
	this.EnableCursor			= true;
	this.SelectedWall			= -1;
	this.SelectedWallMaterials	= { };

	this.Init = function()
	{
		this.SelectedWallMaterials[Core.WALL_FLAG_BACK]  = Core.Resources["mat_wall_select_back"];
		this.SelectedWallMaterials[Core.WALL_FLAG_RIGHT] = Core.Resources["mat_wall_select_right"];
		this.SelectedWallMaterials[Core.WALL_FLAG_FRONT] = Core.Resources["mat_wall_select_front"];
		this.SelectedWallMaterials[Core.WALL_FLAG_LEFT]  = Core.Resources["mat_wall_select_left"];
	};

	this.Update = function()
	{
		if(Editor.SelectedTile != null)
		{
			// Update debug text
			Editor.SubText.Set(Editor.SelectedTile);

			// Calculate cell pos (0..1 in each axis)
			var cell_pos = Core.WorldToCellPos(Editor.SelectedTileHitPos);
			if(cell_pos[0] < 0.3)
			{
				this.SelectedWall = Core.WALL_FLAG_LEFT;
			}
			else if(cell_pos[0] > 0.7)
			{
				this.SelectedWall = Core.WALL_FLAG_RIGHT;
			}
			else if(cell_pos[1] < 0.3)
			{
				this.SelectedWall = Core.WALL_FLAG_FRONT;
			}
			else if(cell_pos[1] > 0.7)
			{
				this.SelectedWall = Core.WALL_FLAG_BACK;
			}
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
		if(Editor.SelectedTile == null)
		{
			Editor.SubText.Set("");
			return;
		}

		// Cache state
		var depth_was_enabled = Engine.Gfx.IsDepthTestEnabled();

		// Calculate selected tile
		var render_pos = Engine.Vec3.MultiplyScalar(Editor.SelectedTile, Core.Map.FloorTileSize);
		render_pos[1] += Constants.ZFightOffset; // Prevent z-fighting with ground

		// Render selected tile
		Engine.Gfx.BindMaterial(this.SelectedWallMaterials[this.SelectedWall]);
		mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, render_pos);
		mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, 0, Core.Map.FloorTileSize]);
		Engine.Gfx.EnableBlend(true);
		Engine.Gfx.SetBlendMode(Engine.GL.SRC_ALPHA, Engine.GL.ONE_MINUS_SRC_ALPHA);
		Engine.Gfx.EnableDepthTest(false);
		Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, false);
		Engine.Gfx.EnableBlend(false);

		// Restore state
		Engine.Gfx.EnableDepthTest(depth_was_enabled);
	};
};