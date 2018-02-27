Core =
{
	// Resources
	Resources :
	{
		mdl_floor_tile			: { file : "models/floor-tile.model"},
		mdl_chair				: { file : "models/chair/chair.obj" },
		mdl_wall				: { file : "models/wall.model" },
		mat_stone				: { file : "mat/stone.mat" },
		mat_stone_debug			: { file : "mat/stone_debug.mat" },
		mat_wood				: { file : "mat/wood.mat" },
		mat_wool				: { file : "mat/wool.mat" },
		mat_cobbles				: { file : "mat/cobbles.mat" },
		mat_rug1				: { file : "mat/rug1.mat" },
		mat_rug2				: { file : "mat/rug2.mat" },
		mat_paving				: { file : "mat/paving.mat" },
		mat_wallpaper1			: { file : "mat/wallpaper1.mat" },
		mat_wall_select_back	: { file : "mat/wall_select_back.mat" },
		mat_wall_select_right	: { file : "mat/wall_select_right.mat" },
		mat_wall_select_front	: { file : "mat/wall_select_front.mat" },
		mat_wall_select_left	: { file : "mat/wall_select_left.mat" },
	},

	// Editor
	EditorEnabled				: false,

	// Player
	Player						: null,

	// Globals
	ScratchMatrix				: null,
	FloorTileModel				: null,
	WallTileModel				: null,

	// Wall flags
	WALL_FLAG_BACK				: 0b0001,
	WALL_FLAG_RIGHT				: 0b0010,
	WALL_FLAG_FRONT				: 0b0100,
	WALL_FLAG_LEFT				: 0b1000,

	// Map
	Map :
	{
		Name					: "",
		SkyColour				: [0.5, 0.5, 0.2],
		Sun :
		{
			position   : [0, 20, 0],
			direction  : [0, -1, 0],
			ambient    : [ 0.6, 0.6, 0.6 ],
			colour     : [ 0.4, 0.4, 0.4 ],
		},
		RoomSizeX				: 16,
		RoomSizeZ				: 16,
		FloorTileSize			: 1,
		WallHeight				: 3,
		DoorHeight				: 2,
		FloorTileMaterials :
		[
			"mat_stone",
			"mat_wood",
			"mat_wool",
			"mat_rug1",
			"mat_rug2",
			"mat_paving"
		],
		FloorTiles				: { },
		WallMaterials :
		[
			"mat_cobbles",
			"mat_wood",
			"mat_wallpaper1"
		],
		Walls 					: { }
	},

	Init : function()
	{
		// ====================================================================================================================================
		// Misc
		Core.ScratchMatrix = mat4.create();
		Engine.Device.Maximise();

		// ====================================================================================================================================
		// Shadow config
		var shadow_mode = 2;
		var shadow_resolution = 512;
		Engine.Gfx.InitShadowMapping(shadow_resolution, shadow_mode);

		// ====================================================================================================================================
		// Graphics state
		Engine.Gfx.EnableBackFaceCulling(true);

		// ====================================================================================================================================
		// Load specific map?
		var map_name = Engine.Device.GetQueryString("map");
		if(map_name)
		{
			Core.LoadMap(map_name);
		}

		// ====================================================================================================================================
		// Init editor?
		if(Engine.Device.GetQueryString("edit"))
		{
			Core.EditorEnabled = true;
			Editor.Init();
		}

		// ====================================================================================================================================
		// Init player
		Core.MainPlayer = new Core.Player();
		Core.MainPlayer.Init();

		// ====================================================================================================================================
		// Models
		Core.FloorTileModel = Core.Resources["mdl_floor_tile"];
		Core.WallTileModel = Core.Resources["mdl_wall"];

		// ====================================================================================================================================
		// Sun
		return Core.Update;
	},

	Update : function()
	{
		// Switch modes (editor / game)?
		if(Engine.Keyboard.WasJustPressed("enter"))
		{
			if(Core.EditorEnabled)
			{
				Core.EditorEnabled = false;
				Editor.OnExit();
			}
			else
			{
				Core.EditorEnabled = true;
				Editor.OnEnter();
			}
		}

		// Update (editor / game)
		if(Core.EditorEnabled)
		{
			Editor.Update();
		}
		else
		{
			Core.MainPlayer.Update();
		}

		// Update camera
		var active_camera = Core.GetActiveCamera();
		active_camera.Update();

		// Render game
		Core.Render();
	},

	LoadMap(map_name)
	{
		Engine.Net.FetchResource("maps/" + map_name + Constants.MapFileExtension, function(map)
		{
			Core.Map = map;
		});
	},

	GetActiveCamera()
	{
		return Core.EditorEnabled? Editor.Camera : Core.MainPlayer.Camera;
	},

	IsValidCell : function(cell)
	{
		if(cell[0] < -(Core.Map.RoomSizeX / 2) || cell[0] >= (Core.Map.RoomSizeX / 2))
		{
			return false;
		}

		if(cell[2] <= -(Core.Map.RoomSizeZ / 2) || cell[2] > (Core.Map.RoomSizeZ / 2))
		{
			return false;
		}

		return true;
	},

	WorldToCell : function(world_pos)
	{
		// Maps any (unquantized) world position to a cell
		return [ Math.floor(world_pos[0] / Core.Map.FloorTileSize),
		         0,
		         Math.floor(world_pos[2] / Core.Map.FloorTileSize) + 1 ];
	},

	WorldToCellPos : function(world_pos)
	{
		// Maps any (unquantized) world position to cell space (0..1)
		var cell = Core.WorldToCell(world_pos);
		var cell_pos = Core.CellToWorld(cell);
		var x = (world_pos[0] - cell_pos[0]) / Core.Map.FloorTileSize;
		var z = (world_pos[2] - cell_pos[2]) / Core.Map.FloorTileSize;
		return [x, -z];
	},

	CellToWorld : function(cell)
	{
		// Maps cell (3 component array) to world space (front left of tile)
		return [ cell[0] * Core.Map.FloorTileSize,
		         0,
		         cell[2] * Core.Map.FloorTileSize ];
	},

	GetCellId : function(cell)
	{
		return cell[0] + "," + cell[1] + "," + cell[2];
	},

	GetCellFromId : function(cell_id)
	{
		var components = cell_id.split(',');
		return [ parseInt(components[0]), parseInt(components[1]), parseInt(components[2]) ];
	},

	GetPlayerCell : function()
	{
		return Core.WorldToCell(Core.MainPlayer.Position);
	},

	GetDefaultFloorTileMaterial : function()
	{
		return Core.EditorEnabled? Editor.GetDebugFloorTileMat() : Core.Resources[Core.Map.FloorTileMaterials[0]];
	},

	GetFloorTileMaterialIndexFromName : function(material_name)
	{
		for(var i = 0; i < Core.Map.FloorTileMaterials.length; ++i)
		{
			if(Core.Map.FloorTileMaterials[i] == material_name)
			{
				return i;
			}
		}
		return -1;
	},

	GetWallMaterialIndexFromName : function(material_name)
	{
		for(var i = 0; i < Core.Map.WallMaterials.length; ++i)
		{
			if(Core.Map.WallMaterials[i] == material_name)
			{
				return i;
			}
		}
		return -1;
	},

	Render : function()
	{
		// Clear
		Engine.Gfx.Clear(Core.Map.SkyColour);
		Engine.Gfx.SetDepthTestMode(Engine.GL.LESS, true);

		// Bind light(s)
		Engine.Gfx.SetDirectionalLight(Core.Map.Sun);

		// Shadow pass
		Engine.Gfx.BeginShadowMappingPass();
		for(var x = -Core.Map.RoomSizeX / 2; x < Core.Map.RoomSizeX / 2; ++x)
		{
			for(var z = -Core.Map.RoomSizeZ / 2; z < Core.Map.RoomSizeZ / 2; ++z)
			{
				var cell = [x, 0, z + 1];
				var cell_id = Core.GetCellId(cell);

				// Draw custom wall(s)?
				if(cell_id in Core.Map.Walls)
				{
					var wall_cell_entry = Core.Map.Walls[cell_id];
					for (var wall in wall_cell_entry)
					{
						// Draw wall to shadow map
						var wall_flag = parseInt(wall);
						var wall_entry = wall_cell_entry[wall];
						var wall_height = wall_entry.is_doorway? Core.Map.WallHeight - Core.Map.DoorHeight : Core.Map.WallHeight;
						Core.RenderWall(cell, wall_flag, wall_height, wall_entry.is_doorway);
					}
				}
			}
		}

		// Draw chair
		mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, [0, 0, 0]);
		Engine.Gfx.DrawModel(Core.Resources["mdl_chair"], Core.ScratchMatrix, false, false);

		Engine.Gfx.EndShadowMappingPass();
		Engine.Gfx.EnableShadowMappingPreview(Core.EditorEnabled && Editor.CurrentMode == 3);

		// Bind active camera
		Engine.Gfx.BindCamera(Core.GetActiveCamera());

		// Draw default floor
		var default_floor_tile_material = Core.GetDefaultFloorTileMaterial();
		Engine.Gfx.BindMaterial(default_floor_tile_material, true);
		var default_floor_tile_repeat = [ Core.Map.RoomSizeX, Core.Map.RoomSizeZ ];
		default_floor_tile_material.SetVec2("albedo_map_repeat", default_floor_tile_repeat);
		default_floor_tile_material.SetVec2("normal_map_repeat", default_floor_tile_repeat);
		default_floor_tile_material.SetVec2("specular_map_repeat", default_floor_tile_repeat);
		var x = -Core.Map.RoomSizeX * 0.5;
		var z = Core.Map.RoomSizeZ * 0.5;
		mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, [x * Core.Map.FloorTileSize, 0, z * Core.Map.FloorTileSize]);
		mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.RoomSizeX * Core.Map.FloorTileSize, 0, Core.Map.RoomSizeZ * Core.Map.FloorTileSize]);
		Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, true);

		// Draw custom elements
		var view_angle = Engine.Math.DegToRad(180);
		var default_tile_material = Core.GetDefaultFloorTileMaterial();
		for(var x = -Core.Map.RoomSizeX / 2; x < Core.Map.RoomSizeX / 2; ++x)
		{
			for(var z = -Core.Map.RoomSizeZ / 2; z < Core.Map.RoomSizeZ / 2; ++z)
			{
				var cell = [x, 0, z + 1];
				var cell_id = Core.GetCellId(cell);

				var player_to_cell = Engine.Vec3.Subtract(cell, Core.MainPlayer.Position);
				var angle = Engine.Vec3.Angle(player_to_cell, Core.MainPlayer.Forward);

				if(angle < view_angle)
				{
					// Draw custom tile?
					if(cell_id in Core.Map.FloorTiles)
					{
						var material_name = Core.Map.FloorTiles[cell_id];
						Engine.Gfx.BindMaterial(Core.Resources[material_name], true);
						mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, [x * Core.Map.FloorTileSize, 0.001, (z + 1) * Core.Map.FloorTileSize]);
						mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, 0, Core.Map.FloorTileSize]);
						Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, true);
					}

					// Draw custom wall(s)?
					if(cell_id in Core.Map.Walls)
					{
						var wall_cell_entry = Core.Map.Walls[cell_id];
						for (var wall in wall_cell_entry)
						{
							// Setup wall material (tiling uvs to match height)
							var wall_flag = parseInt(wall);
							var wall_entry = wall_cell_entry[wall_flag];
							var wall_material_name = wall_entry.material;
							var wall_material = Core.Resources[wall_material_name];
							var wall_height = wall_entry.is_doorway? Core.Map.WallHeight - Core.Map.DoorHeight : Core.Map.WallHeight;
							var uv_repeat = [1, wall_height];
							wall_material.SetVec2("albedo_map_repeat", uv_repeat);
							wall_material.SetVec2("normal_map_repeat", uv_repeat);
							wall_material.SetVec2("specular_map_repeat", uv_repeat);
							Engine.Gfx.BindMaterial(wall_material, true);

							// Draw wall
							Core.RenderWall(cell, wall_flag, wall_height, wall_entry.is_doorway);
						}
					}
				}
			}
		}

		// Draw chair
		mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, [0, 0, 0]);
		Engine.Gfx.DrawModel(Core.Resources["mdl_chair"], Core.ScratchMatrix);

		// Draw sky box?
		Engine.Gfx.DrawSkybox(100, null);

		// Render editor?
		if(Core.EditorEnabled)
		{
			Editor.Render();
		}
	},

	Average : 0,

	GetOppositeCell : function(cell, wall)
	{
		switch(wall)
		{
			case Core.WALL_FLAG_BACK:
				return [ cell[0], cell[1], cell[2] -1 ];
			case Core.WALL_FLAG_RIGHT:
				return [ cell[0] + 1, cell[1], cell[2] ];
			case Core.WALL_FLAG_FRONT:
				return [ cell[0], cell[1], cell[2] + 1];
			case Core.WALL_FLAG_LEFT:
				return [ cell[0] - 1, cell[1], cell[2] ];
		};
	},

	GetOppositeWall : function(wall)
	{
		switch(wall)
		{
			case Core.WALL_FLAG_BACK:
				return Core.WALL_FLAG_FRONT;
			case Core.WALL_FLAG_RIGHT:
				return Core.WALL_FLAG_LEFT;
			case Core.WALL_FLAG_FRONT:
				return Core.WALL_FLAG_BACK;
			case Core.WALL_FLAG_LEFT:
				return Core.WALL_FLAG_RIGHT;
		};
	},

	HasOppositeWall : function(cell, wall)
	{
		var opposite_cell = Core.GetOppositeCell(cell, wall);
		var opposite_cell_id = Core.GetCellId(opposite_cell);
		var opposite_wall = Core.GetOppositeWall(wall);
		return Engine.Util.IsDefined(Core.Map.Walls[opposite_cell_id]) && Engine.Util.IsDefined(Core.Map.Walls[opposite_cell_id][opposite_wall]);
	},

	RenderWall : function(cell, sides, wall_height, is_doorway)
	{
		var cell_centre = Core.CellToWorld(cell);
		cell_centre[0] += (Core.Map.FloorTileSize * 0.5);
		cell_centre[1] += is_doorway? Core.Map.DoorHeight : 0;
		cell_centre[2] -= (Core.Map.FloorTileSize * 0.5);
		var rotation = Engine.Math.DegToRad(90);

		// Draw back wall?
		if(sides & Core.WALL_FLAG_BACK)
		{
			mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, cell_centre);
			mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, wall_height, Core.Map.FloorTileSize]);
			Engine.Gfx.DrawModel(Core.WallTileModel, Core.ScratchMatrix, false, false);
		}

		// Draw right wall?
		if(sides & Core.WALL_FLAG_RIGHT)
		{
			mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, cell_centre);
			mat4.rotate(Core.ScratchMatrix, Core.ScratchMatrix, -rotation, [0, 1, 0]);
			mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, wall_height, Core.Map.FloorTileSize]);
			Engine.Gfx.DrawModel(Core.WallTileModel, Core.ScratchMatrix, false, false);
		}

		// Draw left wall?
		if(sides & Core.WALL_FLAG_LEFT)
		{
			mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, cell_centre);
			mat4.rotate(Core.ScratchMatrix, Core.ScratchMatrix, rotation, [0, 1, 0]);
			mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, wall_height, Core.Map.FloorTileSize]);
			Engine.Gfx.DrawModel(Core.WallTileModel, Core.ScratchMatrix, false, false);
		}

		// Draw front wall?
		if(sides & Core.WALL_FLAG_FRONT)
		{
			mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, cell_centre);
			mat4.rotate(Core.ScratchMatrix, Core.ScratchMatrix, rotation * 2.0, [0, 1, 0]);
			mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, wall_height, Core.Map.FloorTileSize]);
			Engine.Gfx.DrawModel(Core.WallTileModel, Core.ScratchMatrix, false, false);
		}
	},
};

