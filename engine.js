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
			Engine.Canvas.GetSize   = function()      { return [this.width, this.height] };
			Engine.Canvas.GetWidth  = function()      { return this.width; };
			Engine.Canvas.GetHeight = function()      { return this.height; };
			Engine.Canvas.GetCentre = function()      { return [this.width / 2, this.height / 2, 0] };
			Engine.Canvas.GetAspectRatio = function() { return this.width / this.height; };
			Engine.Canvas.IsFullScreen = function()   { return this.is_full_screen; }
			Engine.Canvas.EnableContextMenu = function(do_enable)
			{
				// Suppress canvas right-click context menu?
				Engine.Canvas.oncontextmenu = do_enable? null : function(e)
				{
					e.preventDefault();
				};
			};

			// Maximise canvas for mobile device?
			if(Engine.IsMobileDevice())
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
		// Make sure we're not already full-screen
		if(Engine.Canvas.IsFullScreen())
			return;

		// Cache the original size of the canvas
		var original_canvas_size  = Engine.Canvas.GetSize();

		// Handle transition between windowed / fullscreen
		var toggle_fullscreen = function(is_fullscreen)
		{
			Engine.Canvas.is_full_screen = is_fullscreen;
			Engine.Log(is_fullscreen? "Going full screen..." :
			                          "Going into windowed mode...");

			// Update canvas size accordingly
			if(!is_fullscreen)
			{
				Engine.Canvas.width  = original_canvas_size[0];
				Engine.Canvas.height = original_canvas_size[1];
			}

			Engine.Gfx.ResizeViewport();
		};

		// Hookup event handlers
		document.onwebkitfullscreenchange = function() { toggle_fullscreen(document.webkitIsFullScreen); };
		document.onmozfullscreenchange = function() { toggle_fullscreen(document.mozFullScreenElement != null); };

		// Maximise canvas
		Engine.Canvas.width  = screen.width;
		Engine.Canvas.height = screen.height;

		// Initiate transition to fullscreen mode
		if(Engine.Canvas.webkitRequestFullScreen)
		{
			Engine.Canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		}
		else
		{
			Engine.Canvas.mozRequestFullScreen();
		}
	},

	IsMobileDevice : function()
	{
		var check = false;
		(function(a,b){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
		return check;
	}
};