Editor =
{
	PlayerTileText 			: null,
	SelectedTileMaterial	: null,
	CursorMaterial			: null,
	SelectedTile			: null,

	GetDebugFloorTileMat : function()
	{
		return Core.Resources["mat_floor_debug"];
	},

	Init : function()
	{
		// Setup materials
		Editor.SelectedTileMaterial = Engine.Gfx.Material.Clone(Editor.GetDebugFloorTileMat());
		Editor.CursorMaterial = new Engine.Gfx.Material();

		// Setup player tile debug text
		Editor.PlayerTileText = new Engine.Text2D.TextBox("0",
		{
			colour     : "red",
			background : "black",
			prefix : "Selected Tile: ",
			dock   : ["top", "left"]
		});
	},

	Update : function()
	{
		// Update player tile debug text
		Editor.PlayerTileText.Set(Editor.SelectedTile);

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
	},

	Render : function()
	{
		var hit_pos = Engine.Intersect.RayPlane(hit_pos, Core.Camera.position, Core.Camera.forward, [0, 1, 0], 0);
		if(hit_pos != null)
		{
			// Calculate selected tile
			Editor.SelectedTile = Core.WorldToCell(hit_pos);
			var render_pos = Engine.Vec3.MultiplyScalar(Editor.SelectedTile, Core.Map.FloorTileSize);
			render_pos[1] += Constants.ZFightOffset; // Prevent z-fighting with ground

			// Colour selected tile
			var tint = Core.IsValidTile(Editor.SelectedTile)? Engine.Colour.Green : Engine.Colour.Red;
			var pulse_speed = 10;
			var pulse_colour = Engine.Colour.Lerp([1, 1, 1, 1], tint, (Math.sin(Engine.Time.elapsed_s * pulse_speed) + 1) * 0.5);
			Editor.SelectedTileMaterial.SetColour("albedo_colour", pulse_colour);

			// Render selected tile
			Engine.Gfx.BindMaterial(Editor.SelectedTileMaterial);
			mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, render_pos);
			mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, 0, Core.Map.FloorTileSize]);
			Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, false);

			// Render cursor
			var cursor_size = 0.03;
			hit_pos[0] += cursor_size * 0.5; hit_pos[2] += cursor_size * 0.5; // Centre cursor
			hit_pos[1] += (Constants.ZFightOffset * 2.0); // Prevent z-fighting with selected tile
			Engine.Gfx.BindMaterial(Editor.CursorMaterial);
			mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, hit_pos);
			mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [0.1, 0, 0.1]);
			Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, false);
		}
	},
};