// *******************************************
//# sourceURL=modules/enginejs-touch.js
// *******************************************

Engine.Touch =
{
	streams : [],

	IsPressed : function(index)
	{
		var i = index || 0;
		return Engine.Touch.streams.length > i;
	},

	GetPosition : function(index)
	{
		var i = index || 0;
		if(!Engine.Touch.IsPressed(i)) { return null; }
		return Engine.Array.GetLastValue(Engine.Touch.streams[i]).position;
	},

	// Internal event handling
	_event_touch_start : function(e)
	{
		e.preventDefault();
		var touches = e.changedTouches;
		for(var i = 0; i < touches.length; ++i)
		{
			var touch = touches[i];
			Engine.Touch._event_register(touch);
		}
	},

	_event_touch_move : function(e)
	{
		e.preventDefault();
		var touches = e.changedTouches;
		for(var i = 0; i < touches.length; ++i)
		{
			var touch = touches[i];
			Engine.Touch._event_register(touch);
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
		if(Engine.Touch.streams.length == 2) { return; } // Only support 2 fingers

		var touch_event =
		{
			identifier : touch.identifier,
			time       : Engine.Time.Now(),
			position   : [ touch.pageX - Engine.Canvas.getBoundingClientRect().left,
			               Engine.Canvas.getBoundingClientRect().bottom - touch.pageY ],
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