Core =
{
	Resources :
	{
		mdl_floor_tile    : { file : "models/floor-tile.model"},
		mat_stone         : { file : "mat/stone.mat"},
	},


	ScratchMatrix				: null,
	DefaultFloorTileMaterial	: null,
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
		// Camera
		Core.Camera = new Engine.Camera.Perspective({ position: [0, 1, 0] });
		Core.Camera.AttachHelper(new Engine.Camera.Helper.Roam({ forward : [0, 0, -1] }));

		// ====================================================================================================================================
		// Models
		Core.FloorTileModel = Core.Resources["mdl_floor_tile"];
		Core.WallTileModel = Engine.Geometry.MakePlane({ x_size : 2, z_size : 2});

		// ====================================================================================================================================
		// Materials
		Core.DefaultFloorTileMaterial = Core.Resources["mat_stone"];

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

		// Render game
		Core.Render();
	},

	Render : function()
	{
		// Bind camera
		Engine.Gfx.BindCamera(Core.Camera);

		// Draw floor
		Engine.Gfx.BindMaterial(Core.DefaultFloorTileMaterial);
		for(var x = -Core.Map.RoomSizeX / 2; x < Core.Map.RoomSizeX / 2; ++x)
		{
			for(var z = -Core.Map.RoomSizeZ / 2; z < Core.Map.RoomSizeZ / 2; ++z)
			{
				mat4.translate(Core.ScratchMatrix, Engine.Math.IdentityMatrix, [x * Core.Map.FloorTileSize, 0, z * Core.Map.FloorTileSize]);
				mat4.scale(Core.ScratchMatrix, Core.ScratchMatrix, [Core.Map.FloorTileSize, 0, Core.Map.FloorTileSize]);
				Engine.Gfx.DrawModel(Core.FloorTileModel, Core.ScratchMatrix, false, false);
			}
		}
	},
};

