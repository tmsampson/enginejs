// *******************************************
//# sourceURL=modules/enginejs-game-2d.js
// *******************************************

Engine.Game2D =
{
	Entity : function(textures, config)
	{
		//Setup defaults
		this.textures = [];
		this.size = [0, 0];
		this.position = [0, 0];
		this.velocity = [0, 0];
		this.rotation = 0;
		this.depth = 0; // 0 = front
		this.tint = [1, 1, 1, 1];
		this.alpha = 1;

		// Setup texture(s)?
		if(textures)
		{
			if(Engine.Array.IsArray(textures))
			{
				this.textures = textures;
			}
			else
			{
				this.textures.push(textures);
			}

			// Set entity size to match first texture
			this.size = [this.textures[0].width, this.textures[0].height];
		}

		// Apply any user overrides
		$.extend(this, config);

		this.SetVelocity = function(x, y)
		{
			this.velocity[0] = x;
			this.velocity[1] = y;
		};

		this.MoveTo = function(x, y)
		{
			this.position[0] = x;
			this.position[1] = y;
		};

		this.SetDepth = function(depth)
		{
			this.depth = depth;
		};

		this.SetRotation = function(theta)
		{
			this.rotation = theta;
		};

		this.SetSize = function(size)
		{
			this.size[0] = size;
			this.size[1] = size;
		};

		this.SetTint = function(r, g, b)
		{
			this.tint[0] = r;
			this.tint[1] = g;
			this.tint[2] = b;
		};

		this.SetAlpha = function(alpha)
		{
			this.tint[3] = alpha;
		};
	},

	Scene : function()
	{
		this.entities = [];

		// Setup the viewport to match the canvas by default
		var viewport_size = Engine.Canvas.GetSize();

		// Setup 2D orthographic camera
		this.camera = new Engine.Camera.Orthographic({ size : viewport_size });
		this.background = new Engine.Game2D.Background();

		// Setup shader programs
		this.program_grid   = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_basic_transformed"],
		                                                     Engine.Resources["fs_grid"]);
		this.program_sprite = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_basic_transformed"],
		                                                     Engine.Resources["fs_2d_sprite"]);

		this.Add = function(entity)
		{
			if(Engine.Array.IsArray(entity))
			{
				for(var i = 0; i < entity.length; ++i)
				{
					this.entities.push(entity[i]);
				}
			}
			else
			{
				this.entities.push(entity);
			}
		};

		this.Clear = function()
		{
			this.entities = [];
		};

		this.Render = function(info)
		{
			// Update & bind camera
			this.camera.Update(info);
			Engine.Gfx.BindCamera(this.camera);
			var mtx_trans = mat4.create();

			// Render background (or grid if background not setup)
			var background_in_use = this.background.hasOwnProperty("colour") ||
			                        this.background.layers.length > 0;
			if(background_in_use)
			{
				this.background.Render(info);
			}
			else
			{
				Engine.Gfx.EnableDepthTest(false);
				mat4.scale(mtx_trans, mtx_trans, [Engine.Canvas.GetWidth(), Engine.Canvas.GetHeight(), 0.0]);
				Engine.Gfx.BindShaderProgram(this.program_grid);
				Engine.Gfx.SetShaderConstant("u_trans_model", mtx_trans, Engine.Gfx.SC_MATRIX4);
				Engine.Gfx.DrawQuad();
			}

			// Update entities
			for(var i = 0; i < this.entities.length; ++i)
			{
				var entity = this.entities[i];

				// Integrate linear velocity
				entity.position[0] += entity.velocity[0];
				entity.position[1] += entity.velocity[1];
			}

			// For now let's depth sort on CPU to avoid issues with alpha sprites with same depth
			Engine.Gfx.EnableDepthTest(false);
			this.entities.sort(function(a,b){ return a.depth >= b.depth; });

			// Render entities
			Engine.Gfx.SetBlendMode(Engine.GL.SRC_ALPHA, Engine.GL.ONE_MINUS_SRC_ALPHA, true);
			for(var i = 0; i < this.entities.length; ++i)
			{
				var entity = this.entities[i];

				// Setup transforms
				var entity_trans = [entity.position[0], entity.position[1], 0];
				var entity_scale = [entity.size[0] / 2, entity.size[1] / 2, 0]; // half size as DrawQuad is 2x2 clip space
				mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, entity_trans);
				mat4.rotate(mtx_trans, mtx_trans, entity.rotation, [0, 0, 1]);
				mat4.scale(mtx_trans, mtx_trans, entity_scale);

				// Draw (setup)
				Engine.Gfx.BindShaderProgram(this.program_sprite);
				Engine.Gfx.SetShaderConstant("u_tint", entity.tint, Engine.Gfx.SC_VEC4);
				Engine.Gfx.SetShaderConstant("u_trans_model", mtx_trans, Engine.Gfx.SC_MATRIX4);

				// Draw (setup texture)
				var entity_texture = entity.textures[0];
				Engine.Gfx.BindTexture(entity_texture, 0);

				// Draw (finalise)
				Engine.Gfx.DrawQuad();
			}
		}
	},

	Background : function()
	{
		this.MAX_LAYERS = 7;
		this.x_scroll = 0; this.y_scroll = 0;
		this.program = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_basic"],
					                                  Engine.Resources["fs_2d_background"]);
		this.layers = [];

		this.Render = function(info)
		{
			// Init shader params
			var u_textures = [];
			var u_depth    = new Float32Array(this.MAX_LAYERS);
			var u_config   = new Float32Array(this.MAX_LAYERS * 4);

			// Generate shader params
			var canvas_width = Engine.Canvas.GetWidth();
			var canvas_height = Engine.Canvas.GetHeight();
			this.layers.sort(function(a,b){ return a.depth >= b.depth; });
			for(var i = 0; i < this.layers.length; ++i)
			{
				var layer = this.layers[i];
				var layer_width  = layer.texture.width;
				var layer_height = layer.texture.height;
				u_textures[i] = layer.texture;
				u_depth[i] = layer.depth;
				u_config[i * 4 + 0] = (1.0 / layer.x_scale) * (canvas_width / layer_width);   // x-scale
				u_config[i * 4 + 1] = (1.0 / layer.y_scale) * (canvas_height / layer_height); // y-scale
				u_config[i * 4 + 2] = (layer.x_offset / (layer_width * layer.x_scale));       // x-offset
				u_config[i * 4 + 3] = (layer.y_offset / (layer_height * layer.y_scale));      // y-offset
			}

			// Always draw on top
			Engine.Gfx.EnableDepthTest(false);

			// Draw layers?
			if(this.layers.length > 0)
			{
				var bg_colour = [this.colour.r, this.colour.g, this.colour.b, this.colour.a];
				var scroll = [this.x_scroll / canvas_width, this.y_scroll / canvas_height];
				Engine.Gfx.BindShaderProgram(this.program);
				Engine.Gfx.SetShaderConstant("u_background_color", bg_colour, Engine.Gfx.SC_VEC4);
				Engine.Gfx.SetShaderConstant("u_layer_depth", u_depth, Engine.Gfx.SC_FLOAT_ARRAY);
				Engine.Gfx.SetShaderConstant("u_layer_config", u_config, Engine.Gfx.SC_VEC4_ARRAY);
				Engine.Gfx.SetShaderConstant("u_scroll", scroll, Engine.Gfx.SC_VEC2);
				Engine.Gfx.BindTextureArray(u_textures, "u_layer_tx");
				Engine.Gfx.DrawQuad();
			}
			else
			{
				Engine.Gfx.Clear(this.colour);
			}
		};
	},
};

// *************************************************************************************
// Sprite resource loading
Engine.Resource.RegisterLoadFunction("sprite", function(descriptor, callback)
{
	// TODO: Implement sprites!
	callback(new Engine.Resource.Base(descriptor, {}));
});