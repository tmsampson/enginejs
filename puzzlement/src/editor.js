Editor =
{
	SelectedTileText 		: null,
	SelectedTileMaterial	: null,
	CursorMaterial			: null,
	SelectedTile			: null,
	SelectedTileHitPos		: null,

	GetDebugFloorTileMat : function()
	{
		return Core.Resources["mat_stone_debug"];
	},

	Init : function()
	{
		// Setup materials
		Editor.SelectedTileMaterial = new Engine.Gfx.Material();
		Editor.CursorMaterial = new Engine.Gfx.Material();

		// Setup player tile debug text
		Editor.SelectedTileText = new Engine.Text2D.TextBox("0",
		{
			colour     : "red",
			background : "black",
			prefix     : "Selected Tile: ",
			dock       : ["top", "left"]
		});
	},

	Update : function()
	{
		// Update player tile debug text
		Editor.SelectedTileText.Set(Editor.SelectedTile);

		// Update selected tile raycast
		Editor.SelectedTile = null; // Reset
		Editor.SelectedTileHitPos = Engine.Intersect.RayPlane(Editor.SelectedTileHitPos, Core.Camera.position, Core.Camera.forward, [0, 1, 0], 0);
		if(Editor.SelectedTileHitPos != null)
		{
			Editor.SelectedTile = Core.WorldToCell(Editor.SelectedTileHitPos);
		}

		// Room dimensions
		if(Engine.Keyboard.IsPressed("r"))
		{
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
		}

		// Tile dimensions
		if(Engine.Keyboard.IsPressed("t"))
		{
			if(Engine.Keyboard.WasJustPressed("right") && Core.Map.FloorTileSize < Constants.MaxTileSize)
			{
				Core.Map.FloorTileSize += 0.2;
			}
			else if(Engine.Keyboard.WasJustPressed("left") && Core.Map.FloorTileSize > Constants.MinTileSize)
			{
				Core.Map.FloorTileSize -= 0.2;
			}
			if(Engine.Keyboard.WasJustPressed("up") && Core.Map.FloorTileSize < Constants.MaxTileSize)
			{
				Core.Map.FloorTileSize += 0.2;
			}
			else if(Engine.Keyboard.WasJustPressed("down") && Core.Map.FloorTileSize > Constants.MinTileSize)
			{
				Core.Map.FloorTileSize -= 0.2;
			}
		}

		// Handle save
		if(Engine.Keyboard.WasJustPressed("m"))
		{
			var map_json_string = JSON.stringify(Core.Map, null, 4);
			Engine.Util.DownloadText("foo.map", map_json_string);
		}

		// Handle tile toggling
		var gamepad = Engine.Gamepad.Pads[0];
		var gamepad_next = gamepad && gamepad.IsPressed("rb", true);
		var gamepad_previous = gamepad && gamepad.IsPressed("lb", true);
		if(Engine.Mouse.GetWheelDelta() > 0 || gamepad_next)
		{
			Editor.ToggleSelectedTile(1);
		}
		else if(Engine.Mouse.GetWheelDelta() < 0 || gamepad_previous)
		{
			Editor.ToggleSelectedTile(-1);
		}
	},

	ToggleSelectedTile : function(direction)
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
			var current_material_index = Core.GetMapMaterialIndexFromName(current_material_name);
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
	},

	Render : function()
	{
		// Only draw selected tile text when raycast succeeds
		var tile_selected = Editor.SelectedTile != null;
		Editor.SelectedTileText.SetVisible(tile_selected);

		if(tile_selected)
		{
			// Calculate selected tile
			var render_pos = Engine.Vec3.MultiplyScalar(Editor.SelectedTile, Core.Map.FloorTileSize);
			render_pos[1] += Constants.ZFightOffset; // Prevent z-fighting with ground

			// Colour selected tile
			var selected_tile_colour = Core.IsValidTile(Editor.SelectedTile)? Engine.Colour.Green : Engine.Colour.Red;
			var pulse_speed = 10;
			selected_tile_colour[3]= (Math.sin(Engine.Time.elapsed_s * pulse_speed) + 1) * 0.5;
			Editor.SelectedTileMaterial.SetColour("albedo_colour", selected_tile_colour);

			// Render selected tile
			Engine.Gfx.BindMaterial(Editor.SelectedTileMaterial);
			mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, render_pos);
			mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, 0, Core.Map.FloorTileSize]);
			Engine.Gfx.EnableBlend(true);
			Engine.Gfx.SetBlendMode(Engine.GL.SRC_ALPHA, Engine.GL.ONE_MINUS_SRC_ALPHA);
			Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, false);
			Engine.Gfx.EnableBlend(false);

			// Render cursor
			var cursor_size = 0.03;
			Editor.SelectedTileHitPos[0] += cursor_size * 0.5; Editor.SelectedTileHitPos[2] += cursor_size * 0.5; // Centre cursor
			Editor.SelectedTileHitPos[1] += (Constants.ZFightOffset * 2.0); // Prevent z-fighting with selected tile
			Engine.Gfx.BindMaterial(Editor.CursorMaterial);
			mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, Editor.SelectedTileHitPos);
			mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [0.1, 0, 0.1]);
			Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, false);
		}
	},
};