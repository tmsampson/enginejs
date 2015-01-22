// *******************************************
//# sourceURL=modules/enginejs-gamepad.js
// *******************************************

Engine.GamepadButtonNameMap =
{
	"a" : 0,
	"b" : 1,
	"x" : 2,
	"y" : 3,
};

Engine.Gamepad =
{
	Pads : [null, null, null, null], // Array of PadInstance objects
	Update : function()
	{
		// Grab gamepads
		var gamepads = navigator.getGamepads ? navigator.getGamepads() :
		              (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);

		// Process all connected gamepads
		for(var i = 0; i < gamepads.length; ++i)
		{
			var gamepad = gamepads[i];
			if(gamepad)
			{
				// Add new pad?
				if(!Engine.Gamepad.Pads[i])
				{
					Engine.Log("Adding connected gamepad " + i + " " + gamepad.id);
					Engine.Gamepad.Pads[i] = new Engine.Gamepad.PadInstance();
				}

				// Copy gamepad snapshot into our own structure
				// NOTE: Have to do this because on firefox, button array is live data
				//       from pad rather than a snapshot of the gamepad state
				var gamepad_snapshot = { buttons : { } };
				for (var button_name in Engine.GamepadButtonNameMap)
				{
					var button_index = Engine.GamepadButtonNameMap[button_name];
					gamepad_snapshot.buttons[button_name] = gamepad.buttons[button_index].pressed;
				}

				// Update instance
				Engine.Gamepad.Pads[i].Update(gamepad_snapshot);
			}
			else
			{
				// Remove disconnected pads?
				if(Engine.Gamepad.Pads[i])
				{
					Engine.Log("Removing disconnected gamepad " + i + " " + Engine.Gamepad.Pads[i].GetID());
					Engine.Gamepad.Pads[i] = null;
				}
			}
		}
	},

	// Pad object
	PadInstance : function()
	{
		// Double-buffered input
		this.gamepad_prev_frame = null;
		this.gamepad_this_frame = null;

		this.Update = function(gamepad_snapshot)
		{
			// Swap gamepad snapshot buffers
			this.gamepad_prev_frame = this.gamepad_this_frame? Engine.Util.Clone(this.gamepad_this_frame) : null;
			this.gamepad_this_frame = Engine.Util.Clone(gamepad_snapshot);
		};

		this.IsPressed = function(button_name, debounce)
		{
			// Grab button from this frame
			var pressed_this_frame = this.gamepad_this_frame.buttons[button_name];

			// Handle debounce on first ever frame
			if(!this.gamepad_prev_frame)
			{
				return pressed_this_frame;
			}

			// Grab button from previous frame (used only for debounce)
			var pressed_prev_frame = this.gamepad_prev_frame.buttons[button_name];
			var just_pressed = pressed_this_frame && !pressed_prev_frame;
			return debounce? just_pressed : pressed_this_frame;
		}

		this.IsReleased = function(button_name, debounce)
		{
			// Grab button from this frame
			var pressed_this_frame = this.gamepad_this_frame.buttons[button_name];

			// Handle debounce on first ever frame
			if(!this.gamepad_prev_frame)
			{
				return false;
			}

			// Grab button from previous frame (used only for debounce)
			var pressed_prev_frame = this.gamepad_prev_frame.buttons[button_name];
			var just_released = !pressed_this_frame && pressed_prev_frame;
			return debounce? just_released : pressed_this_frame;
		}

		this.GetID = function()
		{
			return this.gamepad.id;
		}
	}
};