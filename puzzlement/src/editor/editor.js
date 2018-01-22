Editor =
{
	CurrentMode				: 0,
	Modes					: [],
	MainText				: null,
	SubText					: null,
	CursorMaterial			: null,
	SelectedTile			: null,
	SelectedTileHitPos		: null,
	CursorSize				: 0.03,

	GetDebugFloorTileMat : function()
	{
		return Core.Resources["mat_stone_debug"];
	},

	Init : function()
	{
		// Setup modes
		Editor.Modes.push(new Editor.Mode_Scene());
		Editor.Modes.push(new Editor.Mode_Floor());
		Editor.Modes.push(new Editor.Mode_Walls());

		// Init modes
		for(var i = 0; i < Editor.Modes.length; ++i)
		{
			Editor.Modes[i].Init();
		}

		// Setup materials
		Editor.CursorMaterial = new Engine.Gfx.Material();

		// Setup debug text
		Editor.MainText = new Engine.Text2D.TextBox("0",
		{
			colour     : "red",
			background : "black",
			prefix     : "Mode: ",
			position   : [50, 50]
		});
		Editor.SubText = new Engine.Text2D.TextBox("0",
		{
			colour     : "yellow",
			background : "black",
			size       : 15,
			position   : [50, 30]
		});
	},

	Update : function()
	{
		// Update mode text
		Editor.MainText.Set(Editor.Modes[Editor.CurrentMode].Name);

		// Update selected tile raycast
		Editor.SelectedTile = null; // Reset
		Editor.SelectedTileHitPos = Engine.Intersect.RayPlane(Editor.SelectedTileHitPos, Core.Camera.position, Core.Camera.forward, [0, 1, 0], 0);
		if(Editor.SelectedTileHitPos != null)
		{
			Editor.SelectedTile = Core.WorldToCell(Editor.SelectedTileHitPos);
		}

		// Switch modes?
		if(Engine.Keyboard.WasJustPressed("1"))
		{
			Editor.CurrentMode = 0;
		}
		else if(Engine.Keyboard.WasJustPressed("2"))
		{
			Editor.CurrentMode = 1;
		}
		else if(Engine.Keyboard.WasJustPressed("3"))
		{
			Editor.CurrentMode = 2;
		}

		// Update current mode
		Editor.Modes[Editor.CurrentMode].Update();

		// Process command?
		if(Engine.Keyboard.WasJustPressed("c"))
		{
			var command = prompt("Enter editor command:", "");
			Editor.ExecuteCommand(command);
		}

		// Handle map save
		if(Engine.Keyboard.WasJustPressed("m"))
		{
			Editor.SaveMap(Core.Map.Name);
		}

		// Handle map load?
		if(Engine.Keyboard.WasJustPressed("l"))
		{
			var map_name = prompt("Enter a map to load:", "");
			if(map_name.length > 0)
			{
				Core.LoadMap(map_name);
			}
		}
	},

	SaveMap : function(map_name)
	{
		// Prompt for name?
		if(Core.Map.Name == "" && map_name == "")
		{
			map_name = prompt("Please enter a map name:", "");
		}

		Core.Map.Name = map_name;
		var map_json_string = JSON.stringify(Core.Map, null, 4);
		Engine.Util.DownloadText(map_name + Constants.MapFileExtension, map_json_string);
	},

	ExecuteCommand : function(command_string)
	{
		// Ensure command is valid
		if(command_string == null || command_string.length == 0)
		{
			return;
		}

		var command_parts = command_string.toLowerCase().split(" ");
		var command = command_parts[0];
		var command_args = command_parts.slice(1, command_parts.length);
		switch(command)
		{
			case "save":
			{
				var save_name = command_args.length > 0? command_args[0] : Core.Map.Name;
				Editor.SaveMap(save_name);
				break;
			}
			case "load":
			{
				if(command_args.length == 0)
				{
					alert("Must enter a valid map name to load");
				}
				else
				{
					Core.LoadMap(command_args[0]);
				}
				break;
			}
			default:
			{
				alert("Unrecognised command '" + command + "'");
				break;
			}
		}
	},

	Render : function()
	{
		// Render current mode
		var current_mode = Editor.Modes[Editor.CurrentMode];
		current_mode.Render();

		// Render cursor?
		if(current_mode.EnableCursor && Editor.SelectedTile != null)
		{
			Engine.Gfx.EnableDepthTest(false);
			Editor.SelectedTileHitPos[0] += Editor.CursorSize * 0.5; Editor.SelectedTileHitPos[2] += Editor.CursorSize * 0.5; // Centre cursor
			Editor.SelectedTileHitPos[1] += (Constants.ZFightOffset * 2.0); // Prevent z-fighting with selected tile
			Engine.Gfx.BindMaterial(Editor.CursorMaterial);
			mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, Editor.SelectedTileHitPos);
			mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [0.1, 0, 0.1]);
			Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, false);
			Engine.Gfx.EnableDepthTest(true);
		}
	},
};