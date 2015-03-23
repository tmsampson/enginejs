// *******************************************
//# sourceURL=modules/enginejs-text-2d.js
// *******************************************

Engine.Text2D =
{
	instances : [],

	RegisterTextBox : function(instance)
	{
		Engine.Text2D.instances.push(instance);
	},

	ResizeElements : function()
	{
		// We have to delay the CSS position updates slightly such that the DOM has
		// finished resizing and subsequent results from getBoundingClientRect are correct!
		setTimeout(function()
		{
			for(var i = 0; i < Engine.Text2D.instances.length; ++i)
			{
				var instance = Engine.Text2D.instances[i];
				instance.UpdateCSSPosition();
			}
		}, 250);
	},

	TextBox : function(text, config)
	{
		// Setup defaults
		this.position   = [0, 0];
		this.dock       = ["none", "none"];
		this.padding    = 20;
		this.text       = "";
		this.size       = 30;
		this.colour     = "black";
		this.background = "none";
		this.css        = "";
		this.prefix     = "";
		this.div        = $("<div />").appendTo("body");

		// Apply any user overrides
		$.extend(this, config);

		this.MoveTo = function(position)
		{
			this.position = position;
			this.UpdateCSSPosition();
		};

		this.Move = function(delta)
		{
			this.position[0] += delta[0];
			this.position[1] += delta[1];
			this.UpdateCSSPosition();
		};

		this.Set = function(text)
		{
			this.text = text;
			this.div.html(this.prefix + this.text);
		};

		this.SetSize = function(size)
		{
			this.size = size;
			this.UpdateCSSSize();
		}

		this.SetColour = function(foreground_colour, background_colour)
		{
			this.colour = foreground_colour;
			if(background_colour)
			{
				this.background = background_colour;
			}
			this.UpdateCSSColour();
		};

		this.SetCSS = function(user_css)
		{
			this.css = user_css;
			this.UpdateCSSUser();
		};

		this.UpdateCSSUser = function()
		{
			var base_css = "position             : absolute;\
			                user-select          : none;\
			                cursor               : default;\
			                font-weight          : bold;\
			               -webkit-touch-callout : none;\
			               -webkit-user-select   : none;\
			               -khtml-user-select    : none;\
			               -moz-user-select      : none;\
			               -ms-user-select       : none;";
			this.div.attr("style", base_css + this.css);

			// Override base & user css with properties
			this.UpdateCSSSize();
			this.UpdateCSSColour();
			this.UpdateCSSPosition();
		};

		this.UpdateCSSPosition = function()
		{
			var canvas_centre = Engine.Canvas.GetCentre();
			var canvas_size   = Engine.Canvas.GetSize();
			var canvas_left   = Engine.Canvas.getBoundingClientRect().left;
			var canvas_bottom = Engine.Canvas.getBoundingClientRect().bottom;

			// Use absolute position
			var x = canvas_left + this.position[0];
			var y = canvas_bottom - this.div.height() - this.position[1];

			// Apply vertical docking?
			switch(this.dock[0])
			{
				case "top":
					y = canvas_bottom - canvas_size[1] + this.padding;
					break;
				case "middle":
				case "centre":
				case "center":
					y = canvas_bottom - (canvas_size[1] / 2) - (this.div.height() / 2);
					break;
				case "bottom":
					y = canvas_bottom - this.div.height() - this.padding;
					break;
			}

			// Apply horizontal docking?
			switch(this.dock[1])
			{
				case "left":
					x = canvas_left + this.padding;
					break;
				case "middle":
				case "centre":
				case "center":
					x = canvas_left + (canvas_size[0] / 2) - (this.div.width() / 2);
					break;
				case "right":
					x = canvas_left + canvas_size[0] - this.div.width() - this.padding;
					break;
			}

			// Update DOM element
			this.div.css("left", x + "px");
			this.div.css("top",  y + "px");
		};

		this.UpdateCSSSize = function()
		{
			this.div.css("font-size", this.size + "px");
		};

		this.UpdateCSSColour = function()
		{
			this.div.css("color", this.colour);
			this.div.css("background-color", this.background);
		};

		this.Dock = function(vertical, horizontal, padding)
		{
			this.dock = [vertical, horizontal];
			if(padding != undefined) { this.padding = padding; }
			this.UpdateCSSPosition();
		};

		// Setup DOM element
		this.Set(text);
		this.UpdateCSSUser();

		// Register this instance
		Engine.Text2D.RegisterTextBox(this);
	}
};