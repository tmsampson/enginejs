//# sourceURL=scripts/starfield.js

Game.Starfield = function()
{
	// Setup and inherit scene (so Starfield "is a" Scene)
	$.extend(this, new Engine.Game2D.Scene(Game.Resources["bg_space"]));
	this.layer_scroll_0 = this.background.layers[0].scroll[1];
	this.layer_scroll_1 = this.background.layers[0].scroll[1];

	// Setup ship
	this.player_ship = new Game.PlayerShip();

	// Setup score
	this.score_text = new Engine.Text2D.TextBox("0",
	{
		prefix : "Score: ",
		dock   : ["top", "left"],
		size   : 50,
		colour : "#48CAFF",
		css    : Game.Config.FONT_CSS
	}); this.score_text.Hide();

	// Setup health
	this.health_text = new Engine.Text2D.TextBox(Game.Config.MAX_AMMO,
	{
		prefix : "Health: ",
		dock   : ["top", "right"],
		size   : 50,
		colour : "#FFFFFF",
		css    : Game.Config.FONT_CSS
	}); this.health_text.Hide();

	// Setup ammo icons
	this.ammo_icons = [];
	for(var i = 0; i < Game.Config.MAX_AMMO; ++i)
	{
		this.ammo_icons[i] = new Engine.Game2D.Entity(Game.Resources["tex_ammo_icon"]);
		this.ammo_icons[i].SetDepth(-1);
		this.Add(this.ammo_icons[i]);
	}

	this.Enter = function()
	{
		// Make sure text is visible
		this.player_ship.Init();
		this.SetScore(0);
		this.score_text.Show();
		this.health_text.Show();

		var canvas_size = Engine.Canvas.GetSize();

		// Enable debug rendering?
		this.EnableDebugRender(Game.Config.ENABLE_DEBUG_RENDER);

		// Add player ship & ammo icons
		this.Add(this.player_ship);
		this.Add(this.player_ship.shield);
		this.player_ship.bullets = Game.Config.MAX_AMMO;
		for(var i = 0; i < Game.Config.MAX_AMMO; ++i)
		{
			this.Add(this.ammo_icons[i]);
		}

		// Setup earth (scenery)
		var earth = new Engine.Game2D.Entity(Game.Resources["spr_earth"], "scenery");
		earth.SetVelocity([0, -600]); earth.lifespan = [3, 6];
		earth.SetDepth(2); earth.parallax = 10;
		earth.SetSize(Engine.Canvas.GetWidth() / 3);
		this.Add(earth);

		// Setup shooting star (scenery)
		var shooting_star = new Engine.Game2D.Entity(Game.Resources["spr_shooting_star"], "scenery");
		shooting_star.SetVelocity([0, -4000]); shooting_star.lifespan = [2, 3];
		shooting_star.SetDepth(-1); shooting_star.parallax = 3;
		this.Add(shooting_star);

		// Setup asteroids
		this.asteroid_wait = 0;
	};

	this.Exit = function()
	{
		this.Clear();
		this.scenery = [];
		this.score_text.Hide();
		this.health_text.Hide();
	};

	this.UpdateScenery = function(ship_shift, info)
	{
		for(item of this.FindByTag("scenery"))
		{
			// Update parallax
			item.SetX(item.random_x - (ship_shift * item.parallax));

			// Respawn?
			if(item.wait == undefined || item.wait <= 0)
			{
				var half_size = item.GetSize() / 2;
				item.random_x = Engine.Math.RandomInteger(-half_size, Engine.Canvas.GetWidth() + half_size);
				item.wait = Engine.Math.Random(item.lifespan[0], item.lifespan[1]);
				item.MoveTo([item.random_x, Engine.Canvas.GetHeight() + half_size]);
			}

			// Tick
			item.wait -= info.delta_s;
		}
	};

	this.SpawnAsteroid = function()
	{
		// Create a new asteroid & reset spawn timer
		var asteroid = new Engine.Game2D.Entity(Game.Resources["spr_asteroid"], "asteroid");
		this.asteroid_wait = Engine.Math.RandomInteger(30, 120);

		// Move asteroid into place (off-screen)
		asteroid.MoveTo([Engine.Math.RandomInteger(0, Engine.Canvas.GetWidth()), Engine.Canvas.GetHeight() + 100]);

		// Randomly size the asteroid
		var min_size = Game.Config.ASTEROID_SIZE_MIN * Engine.Canvas.GetWidth();
		var max_size = Game.Config.ASTEROID_SIZE_MAX * Engine.Canvas.GetWidth();
		var size = Engine.Math.RandomInteger(min_size, max_size);
		asteroid.SetSize(size);

		// Randomly swap the sprite sequence used to draw the asteroid
		var swap = Engine.Math.RandomInteger(0, 3);
		if(swap == 0)
		{
			asteroid.sprite.SetSequence("asteroid_2");
		}
		else if(swap == 1)
		{
			asteroid.sprite.SetSequence("asteroid_3");
		}

		// Start the asteroid moving at a speed proportional to it's size (small asteroids fly quicker)
		var speed = Game.Config.ASTEROID_SPEED_MIN + (max_size / size) * Game.Config.ASTEROID_SPEED_SCALE;
		asteroid.SetVelocity([0, -speed]);

		// Try and match the anmation speed with the velocity
		asteroid.sprite.SetSpeed(speed / 50);

		// Setup a "damage" amount for this asteroid based on it's random size
		asteroid.damage = 5; // Min damage = 5
		asteroid.damage += 5 * Math.floor(((size - min_size) / (max_size - min_size)) * 3); // Max damage = 20
		asteroid.health = asteroid.damage / 5; // Max hits rqd = 3;

		// Add the asteroid to the scene
		this.Add(asteroid);
	};

	this.DestroyAsteroid = function(asteroid, increase_score)
	{
		if(!asteroid.is_exploding)
		{
			asteroid.is_exploding = true;
			asteroid.sprite.SetSequence("explosion");
			asteroid.SetAlpha(0.4);
			Engine.Audio.PlaySFX(Game.Resources["sfx_explosion"]);
			if(increase_score)
			{
				this.AddScore(asteroid.damage * (asteroid.bounced? 10 : 1));
			}
		}
	};

	this.Update = function(info)
	{
		this.player_ship.Update(info);
		var ship_shift = ((this.player_ship.GetX() / Engine.Canvas.GetWidth()) * 2) - 1; // -1 --> 1

		// Update parallax effect for background / scenery
		this.background.layers[0].scroll[1] = this.layer_scroll_0 * (Engine.Canvas.GetHeight() / 1000);
		this.background.layers[1].scroll[1] = this.layer_scroll_1 * (Engine.Canvas.GetHeight() / 1000);
		for(layer of this.background.layers)
		{
			var layer_multiplier = 1 / (layer.depth + 1);
			layer.offset[0] = -(ship_shift * layer_multiplier * Game.Config.PARALAX_AMOUNT);
		}

		// Update scenery
		this.UpdateScenery(ship_shift, info);

		// Spawn more asteroids?
		if(--this.asteroid_wait < 0)
			this.SpawnAsteroid();

		// Update asteroids
		for(asteroid of this.FindByTag("asteroid"))
		{
			// Skip exploding asteroids (removing if explosion is complete)
			if(asteroid.is_exploding)
			{
				if(asteroid.sprite.SequenceHasFinished())
					this.Remove(asteroid);
				continue;
			}

			// Remove off-screen asteroids
			if(asteroid.GetY() < -(asteroid.GetSize() / 2))
			{
				this.Remove(asteroid);
				continue;
			}

			// Handle asteroid<-->bullet collisions (for on-screen asteroids only)
			if(asteroid.IsWithinView())
			{
				var bullets = this.HitTest(asteroid, "bullet");
				if(bullets.length > 0)
				{
					asteroid.health -= 1;
					this.Remove(bullets);
					if(asteroid.health == 0)
					{
						this.DestroyAsteroid(asteroid, true);
					}
					else
					{
						Engine.Audio.PlaySFX(Game.Resources["sfx_asteroid_hit"]);
					}
				}
			}
		}

		// Drop ammo?
		if(Engine.Math.RandomInteger(0, 500) == 0)
		{
			var ammo = new Engine.Game2D.Entity(Game.Resources["spr_pickup"], "ammo");
			ammo.MoveTo([Engine.Math.RandomInteger(0, Engine.Canvas.GetWidth()), Engine.Canvas.GetHeight() + 100]);
			ammo.SetVelocity([0, -600]);
			ammo.sprite.SetSequence("ammo_pickup");
			this.Add(ammo);
		}

		// Drop shield?
		if(Engine.Math.RandomInteger(0, 320) == 0)
		{
			var shield = new Engine.Game2D.Entity(Game.Resources["spr_pickup"], "shield");
			shield.MoveTo([Engine.Math.RandomInteger(0, Engine.Canvas.GetWidth()), Engine.Canvas.GetHeight() + 100]);
			shield.SetVelocity([0, -600]);
			shield.sprite.SetSequence("shield_pickup");
			this.Add(shield);
		}

		// Draw ship health
		var health = this.player_ship.GetHealth();
		this.health_text.Set(health);
		if(health <= 0)
		{
			Game.SetState("Score");
		}

		// Draw ammo icons
		var spacing = 6;
		var left = Engine.Canvas.GetCentre()[0] - (spacing * this.player_ship.bullets) / 2;
		for(var i = 0; i < Game.Config.MAX_AMMO; ++i)
		{
			this.ammo_icons[i].SetVisible(i < this.player_ship.bullets);
			this.ammo_icons[i].MoveTo([left + i * spacing, 16]);
		}
	};

	this.SetScore = function(amount)
	{
		this.score = amount;
		this.score_text.Set(this.score);
	};

	this.AddScore = function(amount)
	{
		this.score += amount;
		this.score_text.Set(this.score);
	};

	this.GetScore = function()
	{
		return this.score;
	};
};