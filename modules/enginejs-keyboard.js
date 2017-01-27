// *******************************************
//# sourceURL=modules/enginejs-keyboard.js
// *******************************************

Engine.KeyboardKeyCodeMap =
{
	// Common
	"left" : 37, "right" : 39, "up"    : 38, "down"  : 40,
	"ctrl" : 17, "alt"   : 18, "shift" : 16, "space" : 32,

	// Function keys
	"f9" : 120, "f10" : 121,

	// Alpha-numeric (populated during init)

	// Ignored
	"f5" : 116
};

Engine.Keyboard =
{
	buffer_idx : 0,            // "current" buffer-index
	key_buffer : [[], [], []], // tripple-buffered

	Update : function()
	{
		// Flip buffers
		this.buffer_idx = this.buffer_idx? 0 : 1;
		this.key_buffer[this.buffer_idx] = Engine.Array.Copy(this.key_buffer[2]);
	},

	IsIgnored : function(key_code)
	{
		return key_code == Engine.KeyboardKeyCodeMap["f5"];
	},

	IsPressed : function(key_name_or_list, debounce)
	{
		// 'key_name_or_list' could be single value or list of keys to check, either
		// way we want a list (even if it only has a single key entry)
		var key_names = Engine.Util.IsArray(key_name_or_list)? key_name_or_list :
		                                                     [ key_name_or_list ];

		// Check if any of the keys are pressed
		var this_buffer = this.key_buffer[this.buffer_idx];
		var prev_buffer = this.key_buffer[this.buffer_idx? 0 : 1];
		for(var i = 0; i < key_names.length; ++i)
		{
			var key_name = key_names[i];
			var key_code = Engine.KeyboardKeyCodeMap[key_name];
			if(debounce && this_buffer[key_code] && !prev_buffer[key_code] ||
			  !debounce && this_buffer[key_code])
			{
				return true;
			}
		}

		return false;
	},

	IsReleased : function(key_name_or_list, debounce)
	{
		// 'key_name_or_list' could be single value or list of keys to check, either
		// way we want a list (even if it only has a single key entry)
		var key_names = Engine.Util.IsArray(key_name_or_list)? key_name_or_list :
		                                                     [ key_name_or_list ];

		// Check if any of the keys are pressed
		var this_buffer = this.key_buffer[this.buffer_idx];
		var prev_buffer = this.key_buffer[this.buffer_idx? 0 : 1];
		for(var i = 0; i < key_names.length; ++i)
		{
			var key_name = key_names[i];
			var key_code = Engine.KeyboardKeyCodeMap[key_name];
			if(debounce && !this_buffer[key_code] && prev_buffer[key_code] ||
			  !debounce && !this_buffer[key_code])
			{
				return true;
			}
		}

		return false;
	}
};

// *******************************************
// Init
// *******************************************

// Add numeric key code mappings
for(var i = 0; i < 10; ++i)
{
	var char_code = 48 + i;
	Engine.KeyboardKeyCodeMap[String.fromCharCode(char_code)] = char_code;
}

// Add alphabetic key code mappings
for(var i = 0; i < 26; ++i)
{
	var char_code_upper = 65 + i;
	var char_code_lower = 97 + i;
	Engine.KeyboardKeyCodeMap[String.fromCharCode(char_code_upper)] = char_code_upper;
	Engine.KeyboardKeyCodeMap[String.fromCharCode(char_code_lower)] = char_code_lower;
}

$(document).keydown(function(e)
{
	Engine.Keyboard.key_buffer[2][e.keyCode] = 1;

	// Enable full-screen mode?
	// Note: This *must* be done from event handler for security reasons!
	if(e.keyCode == Engine.KeyboardKeyCodeMap["f10"] && !Engine.Device.IsFullScreen())
	{
		Engine.Device.EnableFullScreen();
	}

	return !Engine.Keyboard.IsIgnored(e.keyCode);
});

$(document).keyup(function(e)
{
	Engine.Keyboard.key_buffer[2][e.keyCode] = 0;
	return !Engine.Keyboard.IsIgnored(e.keyCode);
});