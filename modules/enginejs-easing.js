// *******************************************
//# sourceURL=modules/enginejs-easing.js
// *******************************************

Engine.Easing =
{
	Linear : function(x1, x2, t)
	{
		var dist = x2 - x1;
		return x1 + (t * dist);
	},

	CubicInOut : function(x1, x2, t)
	{
		var dist = x2 - x1;
		var t = t / 0.5;
		if(t < 1) { return x1 + dist / 2 * t * t * t; }
		t -= 2; return x1 + dist / 2 * (t * t * t + 2);
	},
};