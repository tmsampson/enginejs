Editor.Mode_Floor = function()
{
	this.Name 					= "FLOOR";
	this.SelectedTileMaterial	= null,
	this.EnableCursor 			= true;

	this.Init = function()
	{
		this.SelectedTileMaterial = new Engine.Gfx.Material();
	};

	this.Update = function()
	{
		// Edit tile dimensions?
		if(Engine.Keyboard.WasJustPressed("up") && Core.Map.FloorTileSize < Constants.MaxTileSize)
		{
			Core.Map.FloorTileSize += 0.2;
		}
		else if(Engine.Keyboard.WasJustPressed("down") && Core.Map.FloorTileSize > Constants.MinTileSize)
		{
			Core.Map.FloorTileSize -= 0.2;
		}

		// Handle tile toggling (keyboard)
		if(Engine.Keyboard.WasJustPressed("right"))
		{
			this.ToggleSelectedTile(1);
		}
		else if(Engine.Keyboard.WasJustPressed("left"))
		{
			this.ToggleSelectedTile(-1);
		}

		// Handle tile toggling (mouse & gamepad)
		var gamepad = Engine.Gamepad.Pads[0];
		var gamepad_next = gamepad && gamepad.IsPressed("rb", true);
		var gamepad_previous = gamepad && gamepad.IsPressed("lb", true);
		if(Engine.Mouse.GetWheelDelta() > 0 || gamepad_next)
		{
			this.ToggleSelectedTile(1);
		}
		else if(Engine.Mouse.GetWheelDelta() < 0 || gamepad_previous)
		{
			this.ToggleSelectedTile(-1);
		}
	};

	this.Render = function()
	{
		if(Editor.SelectedTile == null)
		{
			Editor.SubText.Set("");
			return;
		}

		// Update debug text
		Editor.SubText.Set(Editor.SelectedTile);

		// Cache state
		var depth_was_enabled = Engine.Gfx.IsDepthTestEnabled();

		// Calculate selected tile
		var render_pos = Engine.Vec3.MultiplyScalar(Editor.SelectedTile, Core.Map.FloorTileSize);
		render_pos[1] += Constants.ZFightOffset; // Prevent z-fighting with ground

		// Colour selected tile
		var selected_tile_colour = Core.IsValidTile(Editor.SelectedTile)? Engine.Colour.Green : Engine.Colour.Red;
		var pulse_speed = 10;
		selected_tile_colour[3]= (Math.sin(Engine.Time.elapsed_s * pulse_speed) + 1) * 0.5;
		this.SelectedTileMaterial.SetColour("albedo_colour", selected_tile_colour);

		// Render selected tile
		Engine.Gfx.BindMaterial(this.SelectedTileMaterial);
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

	this.ToggleSelectedTile = function(direction)
	{
		// Must have a selected tile
		if(Editor.SelectedTile == null)
		{
			return;
		}

		// Toggle tile (first slot always reserved for default tile which is not stored)
		var cell_id = Core.GetCellId(Editor.SelectedTile);
		if(Core.Map.FloorTiles[cell_id] == null && Core.Map.FloorTileMaterials.length > 0)
		{
			// Use 1st or final slot (never 0, 0 = default)
			var next_material_index = direction > 0? 1 : Core.Map.FloorTileMaterials.length -1;
			Core.Map.FloorTiles[cell_id] = Core.Map.FloorTileMaterials[next_material_index];
		}
		else
		{
			// Find next tile material..
			var current_material_name = Core.Map.FloorTiles[cell_id];
			var current_material_index = Core.GetFloorTileMaterialIndexFromName(current_material_name);
			if(current_material_index != -1)
			{
				var next_material_index = (current_material_index + direction) % Core.Map.FloorTileMaterials.length;
				if(next_material_index == 0)
				{
					// Wrap around back to default tile (remove entry)
					delete Core.Map.FloorTiles[cell_id];
				}
				else
				{
					// Apply next tile
					Core.Map.FloorTiles[cell_id] = Core.Map.FloorTileMaterials[next_material_index];
				}
			}
		}
	};
};