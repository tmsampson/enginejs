Core =
{
	// Resources
	Resources :
	{
		mdl_floor_tile			: { file : "models/floor-tile.model"},
		mat_stone				: { file : "mat/stone.mat"},
		mat_floor_debug			: { file : "mat/stone_debug.mat"},
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
		SkyColour				: [0.5, 0.5, 0.2],
		Sun :
		{
			angle				: 0, // 0 = straight down y-axis
			direction			: [ 0, -1, 0 ],
			ambient				: [ 0.4, 0.4, 0.4 ],
			colour				: [ 0.4, 0.4, 0.4 ],
		},
		FloorTileSize			: 1,
		RoomSizeX				: 20,
		RoomSizeZ				: 20,
	},

	Init : function()
	{
		// ====================================================================================================================================
		// Misc
		Core.ScratchMatrix = mat4.create();

		// ====================================================================================================================================
		// Init editor?
		if(Engine.Device.GetQueryString("editor"))
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

	GetDefaultFloorTileMaterial : function()
	{
		return Core.EditorEnabled? Editor.GetDebugFloorTileMat() : Core.Resources["mat_stone"];
	},

	Render : function()
	{
		// Bind camera
		Engine.Gfx.BindCamera(Core.Camera);

		// Draw floor
		Engine.Gfx.BindMaterial(Core.GetDefaultFloorTileMaterial());
		for(var x = -Core.Map.RoomSizeX / 2; x < Core.Map.RoomSizeX / 2; ++x)
		{
			for(var z = -Core.Map.RoomSizeZ / 2; z < Core.Map.RoomSizeZ / 2; ++z)
			{
				mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, [x * Core.Map.FloorTileSize, 0, z * Core.Map.FloorTileSize]);
				mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, 0, Core.Map.FloorTileSize]);
				Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, false);
			}
		}

		// Render editor?
		if(Core.EditorEnabled)
		{
			Editor.Render();
		}
	},
};

