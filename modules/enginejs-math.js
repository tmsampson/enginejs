// *******************************************
//# sourceURL=modules/enginejs-math.js
// *******************************************

Engine.Math =
{
	Clamp : function(x, min, max)
	{
		return Math.min(Math.max(x, min), max);
	},
	Random : function(min, max)
	{
		return Math.random() * (max - min) + min;
	},
	RandomInteger : function(min, max)
	{
		return Math.floor(Math.random() * (max - min + 1) + min);
	},

	// Constants
	IdentityMatrix : mat4.create(),
};