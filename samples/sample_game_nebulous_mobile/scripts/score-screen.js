//# sourceURL=scripts/score-screen.js

Game.ScoreScreen = function()
{
	// Setup and inherit scene
	$.extend(this, new Engine.Game2D.Scene(Game.Resources["bg_space"]));

	// Add instruction text
	this.instruction_text = new Engine.Text2D.TextBox("Game Over!",
	{
		dock    : ["top", "center"],
		padding : 80, size : Engine.Canvas.GetWidth() * 0.2,
		colour  : "#48CAFF",
		css     : Game.Config.FONT_CSS
	}); this.instruction_text.Hide();

	this.score_text = new Engine.Text2D.TextBox("0",
	{
		prefix  : "You Scored: ",
		dock    : ["center", "center"],
		padding : 80, size : Engine.Canvas.GetWidth() * 0.15,
		colour  : "#FFFFFF",
		css     : Game.Config.FONT_CSS
	}); this.score_text.Hide();

	this.Enter = function()
	{
		// Show instruction text & score
		this.instruction_text.Show();
		this.score_text.Set(Game.GetStarfield().GetScore());
		this.score_text.Show();
	};

	this.Exit = function()
	{
		// Hide instruction text & score
		this.instruction_text.Hide();
		this.score_text.Hide();
	};

	this.Update = function()
	{
		var min_size = Engine.Canvas.GetWidth() * 0.13;
		var max_size = Engine.Canvas.GetWidth() * 0.15;
		var x = (1 + Math.sin(Engine.Time.elapsed_s * 5)) / 2; // Animate with sin wave
		this.score_text.SetSize(Engine.Easing.Linear(min_size, max_size, x));

		// Return to splash screen when user clicks / presses
		var gamepad = Engine.Gamepad.Pads[0];
		if(Engine.Mouse.IsPressed("left", true) || Engine.Keyboard.IsPressed("space", true) ||
		   Engine.Touch.IsPressed(0, true) || (gamepad && gamepad.IsPressed("a", true)))
		{
			this.Exit();
			Game.SetState("Splash");
		}
	};
};