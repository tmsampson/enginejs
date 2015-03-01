// *******************************************
//# sourceURL=modules/enginejs-touch.js
// *******************************************

Engine.Touch =
{
	streams              : [],   // Event stream per-finger
	just_released        : [],   // Index of stream just released (lifetime = 1 frame)
	is_first_touch       : true, // Flag used to detect first ever touch
	first_touch_handlers : [],   // Collection of registered handler functions for "first-touch" event

	IsPressed : function(index, debounce)
	{
		var i = index || 0;
		var have_stream = Engine.Touch.streams.length > i;
		if(!have_stream) { return false; }
		return debounce? Engine.Array.GetLastValue(Engine.Touch.streams[i]).just_pressed :
		                 true;
	},

	IsReleased : function(index, debounce)
	{
		var i = index || 0;
		var have_stream = Engine.Touch.streams.length > i;
		return debounce? Engine.Touch.just_released.indexOf(i) != -1 :
		                 !have_stream;
	},

	GetPosition : function(index)
	{
		var i = index || 0;
		if(!Engine.Touch.IsPressed(i)) { return null; }
		return Engine.Array.GetLastValue(Engine.Touch.streams[i]).position;
	},

	IsSwiped : function(index, dir, min_length, max_time)
	{
		var stream = (Engine.Touch.streams.length > index)? Engine.Touch.streams[index] : 0;
		if(!stream) { return false; }

		// Grab events
		var first_event = stream[0];
		var last_event  = stream[stream.length - 1];

		// Calculate ongoing swipe info
		var swipe_vector = Engine.Vec2.Subtract(last_event.position, first_event.position);
		var swipe_angle = Engine.Vec2.AngleBetween(swipe_vector, dir) * (180 / Math.PI);
		var swipe_length = Engine.Vec2.Length(swipe_vector);
		var swipe_duration = last_event.time - first_event.time;

		var tollerance = 3;
		return swipe_length   >= min_length &&
		       swipe_duration <= max_time &&
		       swipe_angle    <  tollerance;
	},

	IsSwipedLeft : function(override_params)
	{
		// return Engine.Touch.IsSwiped(0,
		// {
		// 	direction  : [-1, 0, 0],
		// 	min_length : 
		// });
	},

	OnFirstTouch : function(handler)
	{
		Engine.Touch.first_touch_handlers.push(handler);
	},

	Update : function()
	{
		// Clear just_pressed flag where set
		for(var i = 0; i < Engine.Touch.streams.length; ++i)
		{
			if(Engine.Touch.streams[i].length > 0)
			{
				Engine.Touch.streams[i][0].just_pressed = false;
			}
		}

		// Clear out release events
		Engine.Touch.just_released = [];
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
					Engine.Touch.just_released.push(i);
					break;
				}
			}
		}
	},

	_event_register : function(touch)
	{
		if(Engine.Touch.streams.length == 2) { return; } // Only support 2 fingers

		if(Engine.Touch.is_first_touch)
		{
			// If first ever touch, fire any "first touch" callbacks registered with this module
			Engine.Touch.is_first_touch = false;
			for(var i = 0; i < Engine.Touch.first_touch_handlers.length; ++i)
			{
				// Fire user callback
				Engine.Touch.first_touch_handlers[i](touch);
			}
		}

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