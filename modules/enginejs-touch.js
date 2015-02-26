// *******************************************
//# sourceURL=modules/enginejs-touch.js
// *******************************************

Engine.Touch =
{
	streams : [],

	IsPressed : function(index, debounce)
	{
		var i = index || 0;
		var have_stream = Engine.Touch.streams.length > i;
		if(!have_stream) { return false; }
		return debounce? Engine.Array.GetLastValue(Engine.Touch.streams[i]).just_pressed :
		                 true;
	},

	GetPosition : function(index)
	{
		var i = index || 0;
		if(!Engine.Touch.IsPressed(i)) { return null; }
		return Engine.Array.GetLastValue(Engine.Touch.streams[i]).position;
	},

	Kick : function()
	{
		// Clear just_pressed flag where set
		for(var i = 0; i < Engine.Touch.streams.length; ++i)
		{
			if(Engine.Touch.streams[i].length > 0)
			{
				Engine.Touch.streams[i][0].just_pressed = false;
			}
		}
	},

	// Internal event handling
	_event_touch_start : function(e)
	{
		e.preventDefault();
		var touches = e.changedTouches;
		for(var i = 0; i < touches.length; ++i)
		{
			var touch = touches[i];
			Engine.Touch._event_register(touch, true);
		}
	},

	_event_touch_move : function(e)
	{
		e.preventDefault();
		var touches = e.changedTouches;
		for(var i = 0; i < touches.length; ++i)
		{
			var touch = touches[i];
			Engine.Touch._event_register(touch, false);
		}
	},

	_event_touch_end : function(e)
	{
		e.preventDefault();
		var touches = e.changedTouches;
		for(var i = 0; i < touches.length; ++i)
		{
			var touch = touches[i];
			for(var i = 0; i < Engine.Touch.streams.length; ++i)
			{
				if(Engine.Touch.streams[i].length && Engine.Touch.streams[i][0].identifier == touch.identifier)
				{
					Engine.Touch.streams.splice(i, 1);
				}
			}
		}
	},

	_event_register : function(touch)
	{
		Engine.Log("event");
		if(Engine.Touch.streams.length == 2) { return; } // Only support 2 fingers

		var touch_event =
		{
			identifier   : touch.identifier,
			time         : Engine.Time.Now(),
			position     : [ touch.pageX - Engine.Canvas.getBoundingClientRect().left,
			                 Engine.Canvas.getBoundingClientRect().bottom - touch.pageY ],
			just_pressed : false
		};

		// Find existing stream
		var existing_stream = null;
		for(var i = 0; i != Engine.Touch.streams.length; ++i)
		{
			if(Engine.Touch.streams[i].length && Engine.Touch.streams[i][0].identifier == touch.identifier)
			{
				existing_stream = i;
				break;
			}
		};

		// Update / insert stream
		if(existing_stream != null)
		{
			Engine.Touch.streams[existing_stream].push(touch_event);
		}
		else
		{
			touch_event.just_pressed = true;
			Engine.Touch.streams.push([touch_event]);
		}
	}
};

// Register canvas touch events
Engine.Canvas.addEventListener("touchstart",  Engine.Touch._event_touch_start, false);
Engine.Canvas.addEventListener("touchmove",   Engine.Touch._event_touch_move,  false);
Engine.Canvas.addEventListener("touchend",    Engine.Touch._event_touch_end,   false);
Engine.Canvas.addEventListener("touchcancel", Engine.Touch._event_touch_end,   false);
Engine.Canvas.addEventListener("touchleave",  Engine.Touch._event_touch_end,   false);