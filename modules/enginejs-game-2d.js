// *******************************************
//# sourceURL=modules/enginejs-game-2d.js
// *******************************************

Engine.Game2D =
{
	Entity : function(texture_or_sprite, config)
	{
		// Setup defaults
		this.size       = [0, 0];
		this.position   = [0, 0];
		this.velocity   = [0, 0];
		this.rotation   = 0;
		this.depth      = 0; // 0 = front
		this.tint       = [1, 1, 1, 1];
		this.alpha      = 1;
		this.is_visible = true;

		// Apply any user overrides
		$.extend(this, config);

		// Setup sprite?
		this.sprite = null;
		if(texture_or_sprite)
		{
			var is_sprite = texture_or_sprite.descriptor.extension == "sprite";
			if(is_sprite)
			{
				// Use sprite directly and set entity size to match
				// grid size of first texture
				this.sprite = texture_or_sprite;
				var first_texture = Engine.Array.GetFirstValue(this.sprite.textures);
				this.size = [first_texture.width  / first_texture.descriptor.cols,
				             first_texture.height / first_texture.descriptor.rows];
			}
			else
			{
				// Create a basic sprite from texture and set entity size to
				// match texture size
				this.sprite = new Engine.Game2D.Sprite();
				this.sprite.textures["default"] = texture_or_sprite;
				this.sprite.textures["default"].descriptor.rows = 1;
				this.sprite.textures["default"].descriptor.cols = 1;
				this.sprite.active_texture = this.sprite.textures["default"];
				this.size = [texture_or_sprite.width, texture_or_sprite.height];
			}
		}

		this.Update = function(info)
		{
			// Integrate linear velocity
			this.position[0] += this.velocity[0] * info.delta_s;
			this.position[1] += this.velocity[1] * info.delta_s;

			// Update sprite?
			if(this.sprite)
			{
				this.sprite.Update(info);
			}
		};

		this.SetVelocity = function(velocity)
		{
			this.velocity = Engine.Array.Copy(velocity);
		};

		this.Move = function(delta)
		{
			this.position[0] += delta[0];
			this.position[1] += delta[1];
		};

		this.MoveTo = function(new_pos)
		{
			this.position[0] = new_pos[0];
			this.position[1] = new_pos[1];
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

		this.SetTint = function(colour)
		{
			this.tint[0] = colour[0];
			this.tint[1] = colour[1];
			this.tint[2] = colour[2];
		};

		this.SetAlpha = function(alpha)
		{
			this.tint[3] = alpha;
		};

		this.SetVisible = function(is_visible)
		{
			this.is_visible = is_visible;
		};

		this.IsVisible = function()
		{
			return this.is_visible;
		};

		this.GetPosition = function()
		{
			return this.position;
		};

		this.GetRotation = function()
		{
			return this.rotation;
		};

		this.GetSize = function()
		{
			return this.size[0];
		};
	},

	Scene : function(background_texture_or_object)
	{
		this.entities = [];

		// Setup 2D orthographic camera
		this.camera = new Engine.Camera.Orthographic();

		// Setup background
		if(background_texture_or_object)
		{
			var is_background_object = background_texture_or_object.descriptor.extension == "background";
			if(is_background_object)
			{
				// Use background directly
				this.background = background_texture_or_object;
			}
			else
			{
				// Setup a new background and apply texture to first layer
				var background_texture = background_texture_or_object; // Must be a texture
				this.background = new Engine.Game2D.Background();
				this.background.layers.push(
				{
					texture : background_texture,
					depth   : 1,
					scale   : [1, 1],
					offset  : [0, 0],
					scroll  : [0, 0],
					repeat  : [true, true]
				});
			}
		}
		else
		{
			// Use default (grid) background
			this.background = new Engine.Game2D.Background();
		}

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
				this.entities[i].Update(info);
			}

			// For now let's depth sort on CPU to avoid issues with alpha sprites with same depth
			Engine.Gfx.EnableDepthTest(false);
			this.entities.sort(function(a, b){ return a.depth - b.depth; });

			// Render setup
			Engine.Gfx.SetBlendMode(Engine.GL.SRC_ALPHA, Engine.GL.ONE_MINUS_SRC_ALPHA, true);
			Engine.Gfx.BindShaderProgram(this.program_sprite);
			var last_bound_texture = null;
			var last_bound_tint = null;

			// Render entities
			for(var i = 0; i < this.entities.length; ++i)
			{
				var entity = this.entities[i];
				if(!entity.IsVisible()) { continue; }

				// Setup transforms
				var entity_trans = [entity.position[0], entity.position[1], 0];
				var entity_scale = [entity.size[0] / 2, entity.size[1] / 2, 0]; // half size as DrawQuad is 2x2 clip space
				mat4.translate(mtx_trans, Engine.Math.IdentityMatrix, entity_trans);
				mat4.rotate(mtx_trans, mtx_trans, entity.rotation, [0, 0, 1]);
				mat4.scale(mtx_trans, mtx_trans, entity_scale);
				Engine.Gfx.SetShaderConstant("u_trans_model", mtx_trans, Engine.Gfx.SC_MATRIX4);

				// Setup tint
				if(entity.tint != last_bound_tint)
				{
					Engine.Gfx.SetShaderConstant("u_tint", entity.tint, Engine.Gfx.SC_VEC4);
					last_bound_tint = entity.tint;
				}

				// Setup sprite?
				if(entity.sprite)
				{
					// Setup anim frame
					var anim_config = [entity.sprite.active_texture.descriptor.rows,
					                   entity.sprite.active_texture.descriptor.cols,
					                   entity.sprite.current_anim_frame];
					Engine.Gfx.SetShaderConstant("u_anim_config", anim_config, Engine.Gfx.SC_VEC3);

					// Setup mirror config
					Engine.Gfx.SetShaderConstant("u_mirror_config", entity.sprite.mirror, Engine.Gfx.SC_VEC2);

					// Setup texture
					if(entity.sprite.active_texture != last_bound_texture)
					{
						Engine.Gfx.BindTexture(entity.sprite.active_texture, 0);
						last_bound_texture = entity.sprite.active_texture;
					}
				}
				else
				{
					// Fill with tint colour
					var dummy_texture = Engine.Resources["tx_white"];
					Engine.Gfx.BindTexture(dummy_texture, 0);
					last_bound_texture = dummy_texture;
				}

				// Draw
				Engine.Gfx.DrawQuad();
			}
		}
	},

	Background : function()
	{
		this.MAX_LAYERS = 7;
		this.program = Engine.Gfx.CreateShaderProgram(Engine.Resources["vs_basic"],
					                                  Engine.Resources["fs_2d_background"]);
		this.layers = [];
		this.repeat = [false, false];

		this.Render = function(info)
		{
			// Setup constants
			var canvas_width = Engine.Canvas.GetWidth();
			var canvas_height = Engine.Canvas.GetHeight();

			// Sort layers from back to front
			this.layers.sort(function(a,b){ return a.depth - b.depth; });

			// Init shader params
			var u_textures = [];
			var u_config_1 = new Float32Array(this.MAX_LAYERS * 4);
			var u_config_2 = new Float32Array(this.MAX_LAYERS * 4);
			var u_config_3 = new Float32Array(this.MAX_LAYERS * 4);

			// Pack per-layer data into shader params
			for(var i = 0; i < this.MAX_LAYERS; ++i)
			{
				if(i < this.layers.length)
				{
					var layer = this.layers[i];
					var layer_texture_width  = layer.texture.width;
					var layer_texture_height = layer.texture.height;
					u_textures[i] = layer.texture;
					u_config_1[i * 4 + 0] = (1.0 / layer.scale[0]) * (canvas_width / layer_texture_width);   // x-scale
					u_config_1[i * 4 + 1] = (1.0 / layer.scale[1]) * (canvas_height / layer_texture_height); // y-scale
					u_config_1[i * 4 + 2] = (-layer.offset[0] / (layer_texture_width * layer.scale[0]));     // x-offset
					u_config_1[i * 4 + 3] = (layer.offset[1] / (layer_texture_height * layer.scale[1]));     // y-offset
					u_config_2[i * 4 + 0] = layer_texture_width;                                             // layer texture width
					u_config_2[i * 4 + 1] = layer_texture_height;                                            // layer texture height
					u_config_2[i * 4 + 2] = -layer.scroll[0];                                                // layer uv scroll x
					u_config_2[i * 4 + 3] = layer.scroll[1];                                                 // layer uv scroll y
					u_config_3[i * 4 + 0] = layer.repeat[0]? 0 : 1;                                          // layer repeat-x
					u_config_3[i * 4 + 1] = layer.repeat[1]? 0 : 1;                                          // layer repeat-y
					u_config_3[i * 4 + 2] = layer.depth;                                                     // layer depth
					u_config_3[i * 4 + 3] = 0;
				}
				else
				{
					// Need to pass default x/y repeat values to shader for non-existent layers
					u_config_3[i * 4 + 0] = 1; // layer repeat-x
					u_config_3[i * 4 + 1] = 1; // layer repeat-y
				}
			}

			// Always draw on top
			Engine.Gfx.EnableDepthTest(false);

			// Draw layers?
			if(this.layers.length > 0)
			{
				Engine.Gfx.BindShaderProgram(this.program);

				// Bind background data
				var bg_colour = this.colour? this.colour : Engine.Colour.Black;
				Engine.Gfx.SetShaderConstant("u_background_color", bg_colour, Engine.Gfx.SC_VEC4);
				Engine.Gfx.SetShaderConstant("u_time", info.elapsed_s, Engine.Gfx.SC_FLOAT);

				// Bind per-layer textures
				Engine.Gfx.BindTextureArray(u_textures, "u_layer_tx");

				// Bind packed per-layer data
				Engine.Gfx.SetShaderConstant("u_layer_config_1", u_config_1, Engine.Gfx.SC_VEC4_ARRAY);
				Engine.Gfx.SetShaderConstant("u_layer_config_2", u_config_2, Engine.Gfx.SC_VEC4_ARRAY);
				Engine.Gfx.SetShaderConstant("u_layer_config_3", u_config_3, Engine.Gfx.SC_VEC4_ARRAY);

				// Draw all layers in single pass
				Engine.Gfx.DrawQuad();
			}
			else
			{
				Engine.Gfx.Clear(this.colour? this.colour : Engine.Colour.Black);
			}
		};
	},

	Sprite : function()
	{
		this.name = ""
		this.textures  = {};
		this.sequences = {};

		// For update
		this.requires_update = false;
		this.active_sequence = null;
		this.anim_time = 0.0;

		// For rendering
		this.active_texture = null;
		this.current_anim_frame = 0;
		this.mirror = [0, 0];

		this.SetSequence = function(sequence_name)
		{
			if(sequence_name in this.sequences)
			{
				var sequence = this.sequences[sequence_name];
				this.active_sequence = sequence;
				this.active_texture = sequence.texture;
				this.mirror = this.active_sequence.mirror;

				// Calculate frame duration and reset animation
				this.anim_frame_length = (sequence.speed == 0)? 1 : 1.0 / sequence.speed;
				this.anim_time = 0.0;

				// Calculate start, end and max frame indices (linear, left-to-right)
				this.anim_start_frame_index = (sequence.begin[0] * sequence.texture.descriptor.cols) + sequence.begin[1];
				this.anim_end_frame_index   = (  sequence.end[0] * sequence.texture.descriptor.cols) + sequence.end[1];
				this.anim_max_frame_index   = sequence.texture.descriptor.rows * sequence.texture.descriptor.cols;
				this.current_anim_frame = this.anim_start_frame_index; // Begin at first frame incase we set requires_update = false

				// Calculate how many frames belong to this sequence
				var wrap_around = this.anim_start_frame_index > this.anim_end_frame_index;
				this.anim_frame_count = wrap_around? (this.anim_max_frame_index + this.anim_start_frame_index) - this.anim_end_frame_index :
				                                      this.anim_end_frame_index - this.anim_start_frame_index;

				// Will the sprite need updating?
				this.requires_update = (this.active_sequence.speed != 0 && this.anim_frame_count != 0);
			}
			else
			{
				Engine.LogError("Invalid sprite sequence name '" + sequence_name + "'");
			}
		};

		this.Update = function(info)
		{
			if(!this.requires_update)
				return;

			// Progress anim time and calculate which frame to display
			this.anim_time += info.delta_s;
			var current_frame = Math.floor(this.anim_time / this.anim_frame_length);

			// Deal with animation loop / end
			if(current_frame >= this.anim_frame_count)
			{
				if(this.active_sequence.loop)
				{
					current_frame = current_frame % (this.anim_frame_count + 1);
				}
				else
				{
					current_frame = this.anim_frame_count;
					this.requires_update = false;
				}
			}

			// Offset current_frame from anim start frame
			this.current_anim_frame = (this.anim_start_frame_index + current_frame) % this.anim_max_frame_index;
		};

		this.GetSequenceName = function()
		{
			return this.active_sequence.name;
		}

		this.SetMirror = function(horizontal, vertical)
		{
			this.mirror[0] = horizontal? 1 : 0;
			this.mirror[1] = vertical?   1 : 0;
		}
	},
};

// *************************************************************************************
// Background resource loading
Engine.Resource.RegisterLoadFunction("background", function(descriptor, callback)
{
	Engine.Net.FetchResource(descriptor.file, function(background_json)
	{
		var json = jQuery.parseJSON(background_json);
		var background_object = new Engine.Game2D.Background();
		$.extend(background_object, json);

		// Load in textures
		Engine.Resource.LoadBatch(background_object.textures, function()
		{
			// Validate background
			var layer_count = background_object.layers.length;
			if(background_object.layers.length > background_object.MAX_LAYERS)
			{
				Engine.LogError("Background '" + descriptor.file +
				                "' exceeds maximum layer count of " + background_object.MAX_LAYERS);
				return;
			}

			// Process layers
			for(var i = 0; i < layer_count; ++i)
			{
				Engine.Log("    Validating background layer " + i);
				var layer = background_object.layers[i];

				// Hookup texture references
				if(layer.texture in background_object.textures)
				{
					layer.texture = background_object.textures[layer.texture];
				}
				else
				{
					// Broken reference
					var msg = "    Unknown texture '" + layer.texture +
					          "' referenced in background '" + descriptor.file + "' layer " + i;
					Engine.LogError(msg);
				}
			}

			callback(background_object);
		});
	});
});

// *************************************************************************************
// Sprite resource loading
Engine.Resource.RegisterLoadFunction("sprite", function(descriptor, callback)
{
	Engine.Net.FetchResource(descriptor.file, function(sprite_json)
	{
		var json = jQuery.parseJSON(sprite_json);
		var sprite_object = new Engine.Game2D.Sprite();
		$.extend(sprite_object, json);

		// Load in textures
		Engine.Resource.LoadBatch(sprite_object.textures, function()
		{
			// Process sequences
			for(var sequence_name in sprite_object.sequences)
			{
				var sequence = sprite_object.sequences[sequence_name];
				sequence.name = sequence_name; // Add key-name as member
				Engine.Log("    Validating sprite sequence " + sequence.name);

				// Hookup texture references
				if(sequence.texture in sprite_object.textures)
				{
					sequence.texture = sprite_object.textures[sequence.texture];
				}
				else
				{
					// Broken reference
					var msg = "    Unknown texture '" + sequence.texture +
					          "' referenced in sprite sequence '" + sequence_name + "'";
					Engine.LogError(msg);
				}

				// Set first sequence as active
				if(!sprite_object.active_sequence)
				{
					sprite_object.SetSequence(sequence_name);
				}
			}

			callback(sprite_object);
		});
	});
});