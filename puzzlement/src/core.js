Core =
{
	// Resources
	Resources :
	{
		mdl_floor_tile			: { file : "models/floor-tile.model"},
		mat_stone				: { file : "mat/stone.mat"},
		mat_stone_debug			: { file : "mat/stone_debug.mat"},
		mat_wood				: { file : "mat/wood.mat"},
		mat_wool				: { file : "mat/wool.mat"},
	},

	// Editor
	EditorEnabled				: false,

	// Globals
	ScratchMatrix				: null,
	Camera						: null,
	FloorTileModel				: null,
	WallTileModel				: null,

	// Map
	Map :
	{
		Name					: "",
		SkyColour				: [0.5, 0.5, 0.2],
		Sun :
		{
			direction			: [ 0, -1, 0 ],
			ambient				: [ 0.4, 0.4, 0.4 ],
			colour				: [ 0.4, 0.4, 0.4 ],
		},
		RoomSizeX				: 16,
		RoomSizeZ				: 16,
		FloorTileSize			: 1,
		FloorTileMaterials :
		[
			"mat_stone",
			"mat_wood",
			"mat_wool",
		],
		FloorTiles				: { },
	},

	Init : function()
	{
		// ====================================================================================================================================
		// Misc
		Core.ScratchMatrix = mat4.create();
		Engine.Device.Maximise();

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
		// Camera
		Core.Camera = new Engine.Camera.Perspective({ position: [0, 1, 0] });
		Core.Camera.AttachHelper(new Engine.Camera.Helper.Roam({ forward : [0, 0, -1], invert_y : true }));

		// ====================================================================================================================================
		// Models
		Core.FloorTileModel = Core.Resources["mdl_floor_tile"];
		Core.WallTileModel = Engine.Geometry.MakePlane({ x_size : 2, z_size : 2});

		// ====================================================================================================================================
		// Sun
		Engine.Gfx.SetDirectionalLight(Core.Map.Sun);
		return Core.Update;
	},

	Update : function()
	{
		// Clear
		Engine.Gfx.Clear(Core.Map.SkyColour);
		Engine.Gfx.SetDepthTestMode(Engine.GL.LESS, true);

		// Update camera
		Core.Camera.Update();

		// Update editor?
		if(Core.EditorEnabled)
		{
			Editor.Update();
		}

		// Render game
		Core.Render();
	},

	IsValidTile : function(tile)
	{
		if(tile[0] < -(Core.Map.RoomSizeX / 2) || tile[0] >= (Core.Map.RoomSizeX / 2))
		{
			return false;
		}

		if(tile[2] <= -(Core.Map.RoomSizeZ / 2) || tile[2] > (Core.Map.RoomSizeZ / 2))
		{
			return false;
		}

		return true;
	},

	LoadMap(map_name)
	{
		Engine.Net.FetchResource("maps/" + map_name + ".map", function(map)
		{
			Core.Map = map;
		});
	},

	WorldToCell : function(world_pos)
	{
		return [ Math.floor(world_pos[0] / Core.Map.FloorTileSize),
		         0,
		         Math.floor(world_pos[2] / Core.Map.FloorTileSize) + 1 ];
	},

	GetCellId : function(cell)
	{
		return cell[0] + "," + cell[1] + "," + cell[2];
	},

	GetPlayerTile : function()
	{
		return Core.WorldToCell(Core.Camera.position);
	},

	GetDefaultFloorTileMaterial : function()
	{
		return Core.EditorEnabled? Editor.GetDebugFloorTileMat() : Core.Resources[Core.Map.FloorTileMaterials[0]];
	},

	GetMapMaterialIndexFromName : function(material_name)
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

	Render : function()
	{
		// Bind camera
		Engine.Gfx.BindCamera(Core.Camera);

		// Draw default floor
		var default_tile_material = Core.GetDefaultFloorTileMaterial();
		Engine.Gfx.BindMaterial(default_tile_material);
		for(var x = -Core.Map.RoomSizeX / 2; x < Core.Map.RoomSizeX / 2; ++x)
		{
			for(var z = -Core.Map.RoomSizeZ / 2; z < Core.Map.RoomSizeZ / 2; ++z)
			{
				var cell_id = Core.GetCellId([x, 0, z + 1]);
				if(!(cell_id in Core.Map.FloorTiles))
				{
					mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, [x * Core.Map.FloorTileSize, 0, (z + 1) * Core.Map.FloorTileSize]);
					mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, 0, Core.Map.FloorTileSize]);
					Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, false);
				}
			}
		}

		// Draw custom tiles
		var default_tile_material = Core.GetDefaultFloorTileMaterial();
		for(var x = -Core.Map.RoomSizeX / 2; x < Core.Map.RoomSizeX / 2; ++x)
		{
			for(var z = -Core.Map.RoomSizeZ / 2; z < Core.Map.RoomSizeZ / 2; ++z)
			{
				var cell_id = Core.GetCellId([x, 0, z + 1]);
				if(cell_id in Core.Map.FloorTiles)
				{
					var material_name = Core.Map.FloorTiles[cell_id];
					Engine.Gfx.BindMaterial(Core.Resources[material_name]);
					mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, [x * Core.Map.FloorTileSize, 0, (z + 1) * Core.Map.FloorTileSize]);
					mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, 0, Core.Map.FloorTileSize]);
					Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, false);
				}
			}
		}

		// Render editor?
		if(Core.EditorEnabled)
		{
			Editor.Render();
		}
	},
};

