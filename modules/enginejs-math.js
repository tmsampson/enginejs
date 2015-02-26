// *******************************************
//# sourceURL=modules/enginejs-math.js
// *******************************************

Engine.Math =
{
	// Constants
	IdentityMatrix : mat4.create(),

	Clamp : function(x, min, max)
	{
		return Math.min(Math.max(x, min), max);
	},

	Random : function(min, max)
	{
		return Math.random() * (max - min) + min;
	},

	Midpoint : function(min, max)
	{
		return min + (max - min) / 2;
	},

	RandomInteger : function(min, max)
	{
		return Math.floor(Math.random() * (max - min + 1) + min);
	},
};