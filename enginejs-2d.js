function Engine2D_Scene(engine)
{
	this.engine = engine;
	this.entities = [];

	// Setup the viewport to match the canvas by default
	var viewport_size =
	[
		engine.GetCanvasWidth(),
		engine.GetCanvasHeight()
	];

	// Setup 2D orthographic camera
	this.camera = new EngineCameraOrtho({ size : viewport_size });
	this.background = new Engine2D_Background(engine);

	// Setup shader programs
	this.program_grid    = engine.CreateShaderProgram(Engine.Resources["vs_basic_transformed"],
	                                                  Engine.Resources["fs_grid"]);
	this.program_sprite  = engine.CreateShaderProgram(Engine.Resources["vs_basic_transformed"],
	                                                  Engine.Resources["fs_2d_sprite"]);
}

Engine2D_Scene.prototype.Add = function(entity)
{
	var is_array = (entity.constructor === Array);
	if(is_array)
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
}

Engine2D_Scene.prototype.Clear = function()
{
	this.entities = [];
}

Engine2D_Scene.prototype.Render = function(info)
{
	// Update & bind camera
	this.camera.Update(info);
	this.engine.BindCamera(this.camera);
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
		this.engine.EnableDepthTest(false);
		mat4.scale(mtx_trans, mtx_trans, [this.engine.GetCanvasWidth(), this.engine.GetCanvasHeight(), 0.0]);
		this.engine.BindShaderProgram(this.program_grid);
		this.engine.SetShaderConstant("u_trans_model", mtx_trans, Engine.SC_MATRIX4);
		this.engine.DrawQuad();
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
	this.engine.EnableDepthTest(false);
	this.entities.sort(function(a,b){ return a.depth >= b.depth; });

	// Render entities
	this.engine.SetBlendMode(this.engine.gl.SRC_ALPHA, this.engine.gl.ONE_MINUS_SRC_ALPHA, true);
	for(var i = 0; i < this.entities.length; ++i)
	{
		var entity = this.entities[i];

		// Setup transforms
		var entity_trans = [entity.position[0], entity.position[1], 0];
		var entity_scale = [entity.size[0] / 2, entity.size[1] / 2, 0]; // half size as DrawQuad is 2x2 clip space
		mat4.translate(mtx_trans, Engine.IdentityMatrix, entity_trans);
		mat4.rotate(mtx_trans, mtx_trans, entity.rotation, [0, 0, 1]);
		mat4.scale(mtx_trans, mtx_trans, entity_scale);

		// Draw
		this.engine.BindShaderProgram(this.program_sprite);
		this.engine.SetShaderConstant("u_tint", entity.tint, Engine.SC_VEC4);
		this.engine.SetShaderConstant("u_trans_model", mtx_trans, Engine.SC_MATRIX4);
		this.engine.BindTexture(entity.texture, 0);
		this.engine.DrawQuad();
	}
}

function Engine2D_Background(engine)
{
	this.MAX_LAYERS = 7;
	this.engine  = engine;
	this.x_scroll = 0; this.y_scroll = 0;
	this.program = engine.CreateShaderProgram(Engine.Resources["vs_basic"],
				                              Engine.Resources["fs_2d_background"]);
	this.layers = [];
}

Engine2D_Background.prototype.Render = function(info)
{
	// Init shader params
	var u_textures = [];
	var u_depth    = new Float32Array(this.MAX_LAYERS);
	var u_config   = new Float32Array(this.MAX_LAYERS * 4);

	// Generate shader params
	var canvas_width = this.engine.GetCanvasWidth();
	var canvas_height = this.engine.GetCanvasHeight();
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
	this.engine.EnableDepthTest(false);

	// Draw layers?
	if(this.layers.length > 0)
	{
		var bg_colour = [this.colour.r, this.colour.g, this.colour.b, this.colour.a];
		var scroll = [this.x_scroll / canvas_width, this.y_scroll / canvas_height];
		this.engine.BindShaderProgram(this.program);
		this.engine.SetShaderConstant("u_background_color", bg_colour, Engine.SC_VEC4);
		this.engine.SetShaderConstant("u_layer_depth", u_depth, Engine.SC_FLOAT_ARRAY);
		this.engine.SetShaderConstant("u_layer_config", u_config, Engine.SC_VEC4_ARRAY);
		this.engine.SetShaderConstant("u_scroll", scroll, Engine.SC_VEC2);
		this.engine.BindTextureArray(u_textures, "u_layer_tx");
		this.engine.DrawQuad();
	}
	else
	{
		this.engine.Clear(this.colour);
	}
}

function Engine2D_Entity(texture, config)
{
	this.texture = texture;
	this.size = [texture.width, texture.height];
	this.position = [0, 0];
	this.velocity = [0, 0];
	this.rotation = 0;
	this.depth = 0; // 0 = front
	this.tint = [1, 1, 1, 1];
	this.alpha = 1;
}

Engine2D_Entity.prototype.SetVelocity = function(x, y)
{
	this.velocity[0] = x;
	this.velocity[1] = y;
}

Engine2D_Entity.prototype.MoveTo = function(x, y)
{
	this.position[0] = x;
	this.position[1] = y;
}

Engine2D_Entity.prototype.SetDepth = function(depth)
{
	this.depth = depth;
}

Engine2D_Entity.prototype.SetRotation = function(theta)
{
	this.rotation = theta;
}

Engine2D_Entity.prototype.SetSize = function(size)
{
	this.size[0] = size;
	this.size[1] = size;
}

Engine2D_Entity.prototype.SetTint = function(r, g, b)
{
	this.tint[0] = r;
	this.tint[1] = g;
	this.tint[2] = b;
}

Engine2D_Entity.prototype.SetAlpha = function(alpha)
{
	this.tint[3] = alpha;
}