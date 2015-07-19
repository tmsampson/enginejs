//# sourceURL=scripts/splash-screen.js

Game.SplashScreen = function()
{
	// Setup and inherit scene
	$.extend(this, new Engine.Game2D.Scene(Game.Resources["bg_space"]));

	// Add logo
	this.logo = new Engine.Game2D.Entity(Game.Resources["tex_logo"]);
	this.Add(this.logo);

	// Add instruction text
	var text = Engine.Touch.IsEnabled()? "Touch screen to begin" : "Press SPACE to begin";
	this.instruction_text = new Engine.Text2D.TextBox(text,
	{
		dock    : ["bottom", "center"],
		padding : 80, size : 50,
		colour  : "#48CAFF",
		css     : Game.Config.FONT_CSS
	});

	this.Enter = function()
	{
		// Show instruction text
		this.instruction_text.Show();
	}

	this.Exit = function()
	{
		// Hide instruction text
		this.instruction_text.Hide();
	}

	this.Update = function(info)
	{
		// Animate logo
		this.logo.SetSize(Engine.Canvas.GetWidth() * 0.7);
		var x = Engine.Canvas.GetCentre()[0];
		var y = (Engine.Canvas.GetHeight() * 0.8) + Math.sin(info.elapsed_s * 3) * 5;
		this.logo.MoveTo([x, y]);

		// Move to main game when user clicks / presses
		var gamepad = Engine.Gamepad.Pads[0];
		if(Engine.Mouse.IsPressed("left", true) || Engine.Keyboard.IsPressed("space", true) || Engine.Touch.IsPressed(0, true) || (gamepad && gamepad.IsPressed("a", true)))
		{
			Game.SetState("Starfield");
		}
	};
};