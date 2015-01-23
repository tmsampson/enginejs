// *******************************************
//# sourceURL=modules/enginejs-gamepad.js
// *******************************************

Engine.GamepadButtonNameMap =
{
	"a"     : 0,
	"b"     : 1,
	"x"     : 2,
	"y"     : 3,
	"lb"    : 4,
	"rb"    : 5,
	"lt"    : 6,
	"rt"    : 7,
	"back"  : 8,
	"start" : 9,
	"l3"    : 10,
	"r3"    : 11,
	"up"    : 12,
	"down"  : 13,
	"left"  : 14,
	"right" : 15,
};

Engine.Gamepad =
{
	Pads : [], // Array of PadInstance objects
	Update : function()
	{
		// Grab raw gamepads
		var raw_gamepads = navigator.getGamepads ? navigator.getGamepads() :
		              (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);

		// Process raw gamepads
		for(var i = 0; i < raw_gamepads.length; ++i)
		{
			var raw_gamepad = raw_gamepads[i];
			if(!raw_gamepad) { continue; }
			var existing = Engine.Array.Find(Engine.Gamepad.Pads, function(pad)
			{
				return (pad.GetIndex() == raw_gamepad.index);
			});

			if(!existing)
			{
				// Add new pad
				Engine.Log("Adding connected gamepad " + raw_gamepad.index + " " + raw_gamepad.id);
				existing = new Engine.Gamepad.PadInstance();
				Engine.Gamepad.Pads.push(existing);
			}

			// Copy gamepad snapshot into our own structure
			// NOTE: Have to do this because on firefox, button array is live data
			//       from pad rather than a snapshot of the gamepad state
			var gamepad_snapshot = { index : raw_gamepad.index, id : raw_gamepad.id, buttons : { } };
			for (var button_name in Engine.GamepadButtonNameMap)
			{
				var button_index = Engine.GamepadButtonNameMap[button_name];
				gamepad_snapshot.buttons[button_name] = raw_gamepad.buttons[button_index].pressed;
			}
			existing.Update(gamepad_snapshot);
		}

		// Remove disconnected pads
		Engine.Gamepad.Pads = Engine.Array.Filter(Engine.Gamepad.Pads, function(pad)
		{
			var is_attached = function(raw_gamepad) { return raw_gamepad && raw_gamepad.index == pad.GetIndex(); };
			if(Engine.Array.Find(raw_gamepads, is_attached))
			{
				return true;
			}

			Engine.Log("Removing disconnected gamepad " + pad.GetIndex() + " " + pad.GetID());
			return false;
		});
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
		};

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
		};

		this.GetID = function()
		{
			return this.gamepad_this_frame.id;
		};

		this.GetIndex = function()
		{
			return this.gamepad_this_frame.index;
		};
	}
};