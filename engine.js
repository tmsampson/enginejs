Engine =
{
	// *************************************************************************************
	// External dependencies
	// *************************************************************************************
	Dependencies :
	[
		"enginejs/css/engine.css",
		"enginejs/script/third_party/hashCode-v1.0.0.js",
		"enginejs/script/third_party/webtoolkit.md5.js",
		"enginejs/script/third_party/gl-matrix-min.js",
		"enginejs/script/third_party/jquery-ui.min.js",
		"enginejs/css/third_party/jquery-ui/jquery-ui.css",
	],

	// *************************************************************************************
	// EngineJS Modules
	// *************************************************************************************
	Modules :
	[
		{ name : "EngineJS-Util",     js : "enginejs/modules/enginejs-util.js"        },
		{ name : "EngineJS-Time",     js : "enginejs/modules/enginejs-time.js"        },
		{ name : "EngineJS-Colour",   js : "enginejs/modules/enginejs-colour.js"      },
		{ name : "EngineJS-Debug",    js : "enginejs/modules/enginejs-debug.js"       },
		{ name : "EngineJS-Array",    js : "enginejs/modules/enginejs-array.js"       },
		{ name : "EngineJS-Math",     js : "enginejs/modules/enginejs-math.js"        },
		{ name : "EngineJS-Vec2",     js : "enginejs/modules/enginejs-vec2.js"        },
		{ name : "EngineJS-Vec3",     js : "enginejs/modules/enginejs-vec3.js"        },
		{ name : "EngineJS-Camera",   js : "enginejs/modules/enginejs-camera.js"      },
		{ name : "EngineJS-Net",      js : "enginejs/modules/enginejs-net.js"         },
		{ name : "EngineJS-Resource", js : "enginejs/modules/enginejs-resource.js"    },
		{ name : "EngineJS-Audio",    js : "enginejs/modules/enginejs-audio.js"       },
		{ name : "EngineJS-Keyboard", js : "enginejs/modules/enginejs-keyboard.js"    },
		{ name : "EngineJS-Mouse",    js : "enginejs/modules/enginejs-mouse.js"       },
		{ name : "EngineJS-Gamepad",  js : "enginejs/modules/enginejs-gamepad.js"     },
		{ name : "EngineJS-Gfx",      js : "enginejs/modules/enginejs-gfx.js"         },
		{ name : "EngineJS-Geometry", js : "enginejs/modules/enginejs-geometry.js"    },
		{ name : "EngineJS-Model",    js : "enginejs/modules/enginejs-model.js"       },
		{ name : "EngineJS-Game-2D",  js : "enginejs/modules/enginejs-game-2d.js"     },
		{ name : "EngineJS-Editor",   js : "enginejs/modules/enginejs-editor.js"      },
	],

	// *************************************************************************************
	// Resources
	// *************************************************************************************
	Resources :
	{
		// Vertex shaders
		vs_basic             : { file: "enginejs/shaders/basic.vs" },
		vs_basic_transformed : { file: "enginejs/shaders/basic-transformed.vs" },

		// Fragment shaders
		fs_basic             : { file: "enginejs/shaders/basic.fs" },
		fs_basic_colour      : { file: "enginejs/shaders/basic-colour.fs" },
		fs_basic_textured    : { file: "enginejs/shaders/basic-textured.fs" },
		fs_grid              : { file: "enginejs/shaders/grid.fs" },
		fs_grid_3d           : { file: "enginejs/shaders/grid-3d.fs" },
		fs_grid_3d_fog       : { file: "enginejs/shaders/grid-3d-fog.fs" },

		// Game-2D shaders
		fs_2d_background     : { file: "enginejs/shaders/2d/background.fs" },
		fs_2d_sprite         : { file: "enginejs/shaders/2d/sprite.fs" },

		// Models
		ml_quad              : { file: "enginejs/models/quad.model"       },
		ml_floor_tile        : { file: "enginejs/models/floor_tile.model" },
		ml_tri               : { file: "enginejs/models/tri.model"        },
		ml_cube              : { file: "enginejs/models/cube.model"       },

		// Misc
		tx_white             : { file: "enginejs/img/white.png" },
	},

	// *************************************************************************************
	// Main initialisation
	Init : function(on_user_init, user_resources, canvas)
	{
		// First load in JS dependencies...
		Engine.LoadDependencies(function()
		{
			// Carry out asynchronous jobs
			ExecuteAsyncJobQueue(
			{
				jobs :
				[
					{
						first : function(cb) // 1. Initialise canvas & WebGL
						{
							Engine.LogSection("Initialising WebGL");
							Engine.InitWebGL(canvas, cb)
						}
					},
					{
						first : function(cb) // 2. Load internal modules
						{
							Engine.LogSection("Loading internal modules");
							Engine.LoadModules(Engine.Modules, cb);
						}
					},
					{
						first : function(cb) // 3. Load internal resources
						{
							Engine.LogSection("Loading internal resources");
							Engine.Resource.LoadBatch(Engine.Resources, cb);
						}
					},
					{
						first : function(cb) // 4. Load user resources
						{
							Engine.LogSection("Loading user resources");
							Engine.Resource.LoadBatch(user_resources, cb);
						}
					}
				],
				finally: function(ok)
				{
					Engine.Log(ok? "Initialised successfully" : "Initialised failed");
					if(!on_user_init) { return; }

					// User init handler returns the user render function
					var on_user_render = on_user_init(ok? Engine.GL : null);
					if(on_user_render)
					{
						Engine.LogSection("Starting game loop");
						Engine.RunGameLoop(on_user_render);
					}
				}
			});
		});
	},

	InitWebGL : function(canvas, callback)
	{
		Engine.Log("Initialising WebGL context");
		try
		{
			// Try to grab the standard context. If it fails, fallback to experimental
			Engine.Canvas = canvas || document.getElementsByTagName("canvas")[0];
			Engine.GL = Engine.Canvas.getContext("webgl") || Engine.Canvas.getContext("experimental-webgl");
			Engine.Canvas.is_fullscreen = false;

			// Canvas helper methods
			Engine.Canvas.GetSize   = function()    { return [this.width, this.height] };
			Engine.Canvas.GetWidth  = function()    { return this.width; };
			Engine.Canvas.GetHeight = function()    { return this.height; };
			Engine.Canvas.GetCentre = function()    { return [this.width / 2, this.height / 2, 0] };
			Engine.Canvas.IsFullScreen = function() { return this.is_full_screen; }
			Engine.Canvas.EnableContextMenu = function(do_enable)
			{
				// Suppress canvas right-click context menu?
				Engine.Canvas.oncontextmenu = do_enable? null : function(e)
				{
					e.preventDefault();
				};
			};

			var mobile=true;
			if(mobile)
			{
				Engine.Canvas.width = window.innerWidth;
				Engine.Canvas.height = window.innerHeight;
				$("*").css("margin", "0").css("padding", "0");
				$("html,body").css("width", "100%").css("height", "100%");
				$(Engine.Canvas).css("display", "block");
				$(document).bind("touchstart", function (event) { event.preventDefault(); });
			}

			// WebGL initialised successfully
			Engine.Log("WebGL context created");
			callback(true);
		}
		catch(e)
		{
			$(canvas).html("EngineJS initialisation failed");
			Engine.Log("Failed initialising WebGL context");
			callback(false);
		}
	},

	// *************************************************************************************
	// Main Game Loop
	// *************************************************************************************
	RunGameLoop : function(on_user_render)
	{
		var on_render_internal = function()
		{
			// Generate frame stats
			var elapsed_ms = Engine.Time.Now() - first_frame_time;
			var delta_ms   = Engine.Time.Now() - last_frame_time;

			// Request next render frame
			Engine.SetRenderCallback(on_render_internal);

			// Flip input buffers
			Engine.Mouse.Update();
			Engine.Keyboard.Update();
			Engine.Gamepad.Update();
			Engine.Gfx.Update();

			// Setup per-frame info for client
			var info =
			{
				elapsed_s  : elapsed_ms / 1000,
				elapsed_ms : elapsed_ms,
				delta_s    : delta_ms / 1000,
				delta_ms   : delta_ms,
			}

			// Call user render function
			last_frame_time = Engine.Time.Now();
			on_user_render(info);
		};

		// Request first render frame
		var first_frame_time = Engine.Time.Now();
		var last_frame_time  = Engine.Time.Now();
		Engine.SetRenderCallback(on_render_internal);
	},

	// *************************************************************************************
	// Logging
	// *************************************************************************************
	LogSection : function(msg)
	{
		console.log("[engine] *****************************************");
		console.log("[engine]  " + msg);
		console.log("[engine] *****************************************");
	},

	Log : function(msg)
	{
		console.log("[engine]  INFO: " + msg)
	},

	LogError : function(msg)
	{
		console.error("[engine] ERROR: " + msg);
	},

	// *************************************************************************************
	// Misc
	// *************************************************************************************
	LoadModules : function(modules, on_complete)
	{
		ExecuteAsyncLoop(modules, function(_module, carry_on)
		{
			Engine.Log("Loading module: " + _module.name);
			Engine.LoadJS(_module.js, function()
			{
				carry_on(true); // Load next module
			});
		}, on_complete);
	},

	LoadDependencies : function(on_complete)
	{
		// *************************************************************************************
		// Runtime javascript dependency load & init
		var dependency_load_functions =
		{
			js  : function(url, callback) { Engine.LoadJS(url, callback);  },
			css : function(url, callback) { Engine.LoadCSS(url, callback); },
		};

		// 1. Load ajq for better async jobs/loops
		Engine.LogSection("Loading Dependencies");
		$.getScript("enginejs/script/third_party/ajq/ajq.js", function(script)
		{
			eval(script); // Hotload ajq.js

			// 2. Use ajq to dynamically load remaining dependencies
			ExecuteAsyncLoop(Engine.Dependencies, function(entry, carry_on)
			{
				Engine.Log("Loading dependency: " + entry);
				var extension = entry.split('.').pop();
				if(extension in dependency_load_functions)
				{
					dependency_load_functions[extension](entry, function()
					{
						carry_on(true);
					});
				}
				else
				{
					Engine.LogError("Dependency type with extension '" + extension + "' not supported");
					on_complete(null);
				}
			}, on_complete);
		});
	},

	LoadJS : function(url, callback)
	{
		$.getScript(url, function(script)
		{
			eval(script); // Hotload script
			callback(script);
		}).fail(function(jqxhr, settings, exception)
		{
			Engine.LogError("Failed to load " + url);
			Engine.LogError(exception);
		});
	},

	LoadCSS : function(url, callback)
	{
		$("<link/>", { rel: "stylesheet", type: "text/css", href: url }).appendTo("head");
		callback();
	},

	SetRenderCallback : function(callback)
	{
		var request_func = window.requestAnimationFrame       ||
		                   window.webkitRequestAnimationFrame ||
		                   window.mozRequestAnimationFrame    ||
		                   function(callback) { window.setTimeout(callback, 1000 / 60); };
		request_func(callback, this.canvas);
	},

	EnableFullScreen : function()
	{
		// Cache the original size of the canvas
		var original_canvas_size  = Engine.Canvas.GetSize();

		// Handle transition between windowed / fullscreen
		var toggle_fullscreen = function(is_fullscreen)
		{
			Engine.is_full_screen = is_fullscreen;
			Engine.Log(is_fullscreen? "Going full screen..." :
			                          "Going into windowed mode...");

			// Update canvas size accordingly
			Engine.Canvas.width  = is_fullscreen? screen.width  : original_canvas_size[0];
			Engine.Canvas.height = is_fullscreen? screen.height : original_canvas_size[1];
			Engine.Gfx.ResizeViewport();
		};

		// Hookup event handlers
		document.onwebkitfullscreenchange = function() { toggle_fullscreen(document.webkitIsFullScreen); };
		document.onmozfullscreenchange = function() { toggle_fullscreen(document.mozFullScreenElement != null); };

		// Initiate transition to fullscreen mode
		if(Engine.Canvas.webkitRequestFullScreen)
		{
			toggle_fullscreen(true); // Needed as Chrome doesn't fire first event
			Engine.Canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		}
		else
		{
			Engine.Canvas.mozRequestFullScreen();
		}
	},
};