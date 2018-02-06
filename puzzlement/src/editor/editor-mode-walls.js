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
		if(Editor.SelectedCell != null)
		{
			// Update debug text
			Editor.SubText.Set(Editor.SelectedCell);

			// Calculate cell pos (0..1 in each axis)
			var cell_pos = Core.WorldToCellPos(Editor.SelectedCellHitPos);
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

		// Handle tile toggling (keyboard)
		if(Engine.Keyboard.WasJustPressed("right"))
		{
			this.ToggleSelectedWall(1);
		}
		else if(Engine.Keyboard.WasJustPressed("left"))
		{
			this.ToggleSelectedWall(-1);
		}
		else if(Engine.Keyboard.WasJustPressed("delete"))
		{
			this.DeleteSelectedWall();
		}

		// Handle tile toggling (mouse & gamepad)
		var gamepad = Engine.Gamepad.Pads[0];
		var gamepad_next = gamepad && gamepad.IsPressed("rb", true);
		var gamepad_previous = gamepad && gamepad.IsPressed("lb", true);
		if(Engine.Mouse.GetWheelDelta() > 0 || gamepad_next)
		{
			this.ToggleSelectedWall(1);
		}
		else if(Engine.Mouse.GetWheelDelta() < 0 || gamepad_previous)
		{
			this.ToggleSelectedWall(-1);
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

	this.ToggleSelectedWall = function(direction)
	{
		// Must have a selected tile
		if(Editor.SelectedCell == null || this.SelectedWall < 0)
		{
			return;
		}

		// Toggle wall
		var cell_id = Core.GetCellId(Editor.SelectedCell);
		if(Core.Map.Walls[cell_id] == null && Core.Map.WallMaterials.length > 0)
		{
			// Create new entry for this cell
			var next_material_index = direction > 0? 0 : Core.Map.WallMaterials.length -1;
			Core.Map.Walls[cell_id] = { };
			Core.Map.Walls[cell_id][this.SelectedWall] = Core.Map.WallMaterials[next_material_index];
		}
		else
		{
			if(!Engine.Util.IsDefined(Core.Map.Walls[cell_id][this.SelectedWall]))
			{
				// Create new entry for this wall
				Core.Map.Walls[cell_id][this.SelectedWall] = Core.Map.WallMaterials[0];
			}
			else
			{
				// Update entry for this wall
				var current_material_name = Core.Map.Walls[cell_id][this.SelectedWall];
				var current_material_index = Core.GetWallMaterialIndexFromName(current_material_name);
				if(current_material_index != -1)
				{
					var next_material_index = (Core.Map.WallMaterials.length + current_material_index + direction) % Core.Map.WallMaterials.length;
					Core.Map.Walls[cell_id][this.SelectedWall] = Core.Map.WallMaterials[next_material_index];
				}
			}
		}
	};

	this.DeleteSelectedWall = function()
	{
		// Does an entry for this cell exist?
		var cell_id = Core.GetCellId(Editor.SelectedCell);
		if(!Engine.Util.IsDefined(Core.Map.Walls[cell_id]))
		{
			return;
		}

		// Does an entry for this wall exist?
		if(!Engine.Util.IsDefined(Core.Map.Walls[cell_id][this.SelectedWall]))
		{
			return;
		}

		// Delete wall
		delete Core.Map.Walls[cell_id][this.SelectedWall];
	};

	this.Render = function()
	{
		if(Editor.SelectedCell == null)
		{
			Editor.SubText.Set("");
			return;
		}

		// Cache state
		var depth_was_enabled = Engine.Gfx.IsDepthTestEnabled();

		// Calculate selected tile
		var render_pos = Engine.Vec3.MultiplyScalar(Editor.SelectedCell, Core.Map.FloorTileSize);
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