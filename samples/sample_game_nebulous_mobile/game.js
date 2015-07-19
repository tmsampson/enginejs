Game =
{
	Resources :
	{
		// Config
		js_config          : { file : "config/nebulous-config.js"    },

		// Scripts
		js_splash          : { file : "scripts/splash-screen.js"     },
		js_starfield       : { file : "scripts/starfield.js"         },
		js_player_ship     : { file : "scripts/player-ship.js"       },
		js_score           : { file : "scripts/score-screen.js"     },

		// Backgrounds
		bg_space           : { file : "backgrounds/space.background" },

		// Sprites
		spr_earth          : { file : "sprites/earth.sprite"         },
		spr_ship           : { file : "sprites/ship.sprite"          },
		spr_bullet         : { file : "sprites/bullet.sprite"        },
		spr_asteroid       : { file : "sprites/asteroid.sprite"      },
		spr_pickup         : { file : "sprites/pickup.sprite"        },
		spr_ship_shield    : { file : "sprites/ship_shield.sprite"   },

		// Music
		bgm_music          : { file : "bgm/music.mp3"                },

		// Sound effects
		sfx_explosion      : { file : "sfx/explosion.mp3"            },
		sfx_lazer_1        : { file : "sfx/lazer_1.mp3"              },
		sfx_lazer_2        : { file : "sfx/lazer_2.mp3"              },
		sfx_no_ammo        : { file : "sfx/no_ammo.mp3"              },
		sfx_asteroid_hit   : { file : "sfx/asteroid_hit.mp3"         },
		sfx_ammo_pickup    : { file : "sfx/ammo_pickup.mp3"          },
		sfx_shield_pickup  : { file : "sfx/shield_pickup.mp3"        },
		sfx_bounce         : { file : "sfx/bounce.mp3"               },

		// Textures
		tex_logo           : { file : "img/logo.png"                 },
		tex_ammo_icon      : { file : "img/ammo_icon.png"            },

		// Fonts
		fnt_homenaje       : { file : "fonts/homenaje.css"           },

		// Load callback
		on_loaded : function(resource, i, total)
		{
			var percent = Math.round(i / total * 100) + "%";
			$("#loadinfo").html("Loading " + percent + "<br/><br/>" + resource);
		}
	},

	CurrentState : null,
	States       : { },

	Launch : function()
	{
		Engine.Init(Game.OnInit, Game.Resources);
	},

	OnInit : function()
	{
		// Make sure canvas is visible (hidden by default)
		Engine.Canvas.Show();

		// Setup canvas size
		//Engine.Device.SetAspectRatio(15/9);
		Engine.Device.Maximise();

		// Setup game state bank
		Game.States["Splash"]    = new Game.SplashScreen();
		Game.States["Starfield"] = new Game.Starfield();
		Game.States["Score"]     = new Game.ScoreScreen();

		// Start background music
		var bgm = new Engine.Audio.BackgroundMusic(Game.Resources["bgm_music"]);
		bgm.Play();

		// Set initial game state
		Game.SetState("Splash");
		return Game.OnRender;
	},

	GetStarfield : function()
	{
		return Game.States["Starfield"];
	},

	SetState : function(state)
	{
		if(Game.CurrentState != null)
		{
			Game.CurrentState.Exit();
		}
		Game.CurrentState = Game.States[state];
		Game.CurrentState.Enter();
	},

	OnRender : function(info)
	{
		Game.CurrentState.Update(info);
		Game.CurrentState.Render(info);
	}
};
