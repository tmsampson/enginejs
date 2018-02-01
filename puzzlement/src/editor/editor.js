Editor =
{
	Camera					: null,
	CurrentMode				: 0,
	Modes					: [],
	MainText				: null,
	SubText					: null,
	CursorMaterial			: null,
	SelectedCell			: null,
	SelectedCellHitPos		: null,
	CursorSize				: 0.03,

	GetDebugFloorTileMat : function()
	{
		return Core.Resources["mat_stone_debug"];
	},

	Init : function()
	{
		// Init camera
		Editor.Camera = new Engine.Camera.Perspective({ position: [0, 1, 0], look_at : [0, 1, -1] });
		Editor.Camera.AttachHelper(new Engine.Camera.Helper.Roam({ forward : [0, 0, -1], invert_y : true }));

		// Setup modes
		Editor.Modes.push(new Editor.Mode_Scene());
		Editor.Modes.push(new Editor.Mode_Floor());
		Editor.Modes.push(new Editor.Mode_Walls());
		Editor.Modes.push(new Editor.Mode_Lighting());

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
		Editor.SelectedCell = null; // Reset
		Editor.SelectedCellHitPos = Engine.Intersect.RayPlane(Editor.SelectedCellHitPos, Editor.Camera.position, Editor.Camera.forward, [0, 1, 0], 0);
		if(Editor.SelectedCellHitPos != null)
		{
			Editor.SelectedCell = Core.WorldToCell(Editor.SelectedCellHitPos);
		}

		// Switch modes?
		if(Engine.Keyboard.WasJustPressed("1"))
		{
			Editor.CurrentMode = 0; // Scene
		}
		else if(Engine.Keyboard.WasJustPressed("2"))
		{
			Editor.CurrentMode = 1; // Floor
		}
		else if(Engine.Keyboard.WasJustPressed("3"))
		{
			Editor.CurrentMode = 2; // Walls
		}
		else if(Engine.Keyboard.WasJustPressed("4"))
		{
			Editor.CurrentMode = 3; // Lighting
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

	OnEnter : function()
	{
		Editor.MainText.Show();
		Editor.SubText.Show();
	},

	OnExit : function()
	{
		Editor.MainText.Hide();
		Editor.SubText.Hide();
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
		if(current_mode.EnableCursor && Editor.SelectedCell != null)
		{
			Engine.Gfx.EnableDepthTest(false);
			Editor.SelectedCellHitPos[0] += Editor.CursorSize * 0.5; Editor.SelectedCellHitPos[2] += Editor.CursorSize * 0.5; // Centre cursor
			Editor.SelectedCellHitPos[1] += (Constants.ZFightOffset * 2.0); // Prevent z-fighting with selected tile
			Engine.Gfx.BindMaterial(Editor.CursorMaterial);
			mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, Editor.SelectedCellHitPos);
			mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [0.1, 0, 0.1]);
			Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, false);
			Engine.Gfx.EnableDepthTest(true);
		}
	},
};