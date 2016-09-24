//# sourceURL=scripts/player-ship.js

Game.PlayerShip = function()
{
	// Params
	this.fire_speed = 500;
	this.move_speed = 0.2; // 1 = no delay
	this.bullets = 100;
	this.shield = new Engine.Game2D.Entity(Game.Resources["spr_ship_shield"]);
	this.shield_time = 0;

	// Setup and inherit entity (so PlayerShip "is a" Entity)
	$.extend(this, new Engine.Game2D.Entity(Game.Resources["spr_ship"], "ship"));

	this.Init = function()
	{
		// Position
		var canvas_size = Engine.Canvas.GetSize();
		this.MoveTo([canvas_size[0] / 2, canvas_size[1] / 6]);
		this.target_x = this.GetX();
		this.SetDepth(1); this.SetSize(canvas_size[0]/5);

		//if(Engine.Touch.IsEnabled())
			//this.move_speed = 0.08;

		// Reset
		this.state      = "idle";
		this.health     = 100;
	};

	this.Update = function()
	{
		var canvas_size = Engine.Canvas.GetSize();
		this.SetSize(canvas_size[0]/5);
		this.shield.SetSize(canvas_size[0]/5);

		// Move
		var gamepad = Engine.Gamepad.Pads[0];
		if(Engine.Touch.IsPressed())
			this.target_x = Engine.Touch.GetX();

		var move_speed = Game.Config.SHIP_MOVE_SPEED * Engine.Canvas.GetWidth();
		if(Engine.Keyboard.IsPressed("left") || (gamepad && gamepad.IsPressed("left")))
		{
			this.target_x = this.GetX() - move_speed;
		}
		else if(Engine.Keyboard.IsPressed("right") || (gamepad && gamepad.IsPressed("right")))
		{
			this.target_x = this.GetX() + move_speed;
		}

		if(gamepad)
		{
			var stick = gamepad.GetLeftStick()[0];
			if(Math.abs(stick) > 0.1)
			{
				this.target_x = this.GetX() + (stick * move_speed);
			}
		}

		// Fire?
		if(this.IsTapped() || Engine.Keyboard.IsPressed("space", true) || (gamepad && gamepad.IsPressed("a", true)))
		{
			this.Fire();
		}

		var half_width = this.GetSize() / 2;
		var x_delta = this.target_x - this.GetX();
		var new_x = this.GetX() + (x_delta * this.move_speed);
		new_x = Engine.Math.Clamp(new_x, half_width, Engine.Canvas.GetWidth() - half_width);
		var move_x = new_x - this.GetX();
		this.MoveTo([new_x, canvas_size[1] / 10]);

		// Set sprite
		if(move_x < -Game.Config.SHIP_TILT_BACK_SPEED && this.state != "bank_left")
		{
			this.sprite.SetSequence("bank_left");
			this.state = "bank_left";
		}
		else if(move_x > Game.Config.SHIP_TILT_BACK_SPEED && this.state != "bank_right")
		{
			this.sprite.SetSequence("bank_right");
			this.state = "bank_right";
		}
		else if(Math.abs(move_x) < Game.Config.SHIP_TILT_BACK_SPEED && this.state != "idle")
		{
			this.sprite.SetSequence("idle");
			this.state = "idle";
		}

		// Remove off-screen bullets
		for(bullet of Game.GetStarfield().FindByTag("bullet"))
		{
			if(bullet.IsOutsideView())
			{
				Game.GetStarfield().Remove(bullet);
			}
		}

		// Handle ship<-->asteroid collisions
		var asteroids_touching_ship = Game.GetStarfield().HitTest(this, "asteroid");
		for(var i = 0; i < asteroids_touching_ship.length; ++i)
		{
			var asteroid = asteroids_touching_ship[i];
			if(!asteroid.is_exploding)
			{
				Game.GetStarfield().DestroyAsteroid(asteroids_touching_ship[i]);
				this.health -= asteroid.damage;
			}
		}

		// Handle ammo pickup
		var collected_ammo = Game.GetStarfield().HitTest(this, "ammo");
		for(var i = 0; i < collected_ammo.length; ++i)
		{
			var ammo = collected_ammo[i];
			Game.GetStarfield().Remove(ammo);
			this.bullets = 100;
			Engine.Audio.PlaySFX(Game.Resources["sfx_ammo_pickup"]);
		}

		// Handle shield pickup
		var collected_shield = Game.GetStarfield().HitTest(this, "shield");
		for(var i = 0; i < collected_shield.length; ++i)
		{
			var shield = collected_shield[i];
			Game.GetStarfield().Remove(shield);
			this.shield_time = 240;
			this.shield.SetAlpha(1);
			Engine.Audio.PlaySFX(Game.Resources["sfx_shield_pickup"]);
		}

		// Draw shield?
		if(this.shield_time > 0)
		{
			this.shield.SetVisible(true);
			this.shield.MoveTo(this.GetPosition());
			this.shield_time--;

			// Low shield?
			if(this.shield_time < 100)
			{
				this.shield.SetAlpha(this.shield_time / 100);
			}

			// Handle shield<-->asteroid collisions
			var asteroids_touching_shield = Game.GetStarfield().HitTest(this.shield, "asteroid");
			for(var i = 0; i < asteroids_touching_shield.length; ++i)
			{
				var asteroid = asteroids_touching_shield[i];
				if(!asteroid.is_exploding && !asteroid.bounced)
				{
					var y_reverse = Math.abs(asteroid.GetVelocity()[1]);
					asteroid.SetVelocity([0, y_reverse]);
					asteroid.bounced = true;
					Engine.Audio.PlaySFX(Game.Resources["sfx_bounce"]);
					Game.GetStarfield().AddScore(100);
				}
			}
		}
		else
		{
			this.shield.SetVisible(false);
		}
	};

	this.Fire = function()
	{
		if(this.bullets > 0)
		{
			var bullet = new Engine.Game2D.Entity(Game.Resources["spr_bullet"], "bullet");
			bullet.MoveTo(this.GetPosition());
			bullet.SetVelocity([0, this.fire_speed]);
			bullet.SetSize(this.GetSize());
			Game.GetStarfield().Add(bullet);
			Engine.Audio.PlaySFX(Engine.Math.RandomInteger(0, 1)? Game.Resources["sfx_lazer_1"] : Game.Resources["sfx_lazer_2"]);
			this.bullets -= 1;
		}
		else
		{
			// Out of ammo
			Engine.Audio.PlaySFX(Game.Resources["sfx_no_ammo"]);
		}
	};

	this.GetHealth = function()
	{
		return this.health;
	};
}