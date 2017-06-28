// *******************************************
//# sourceURL=modules/enginejs-colour.js
// *******************************************

Engine.Colour =
{
	Black     : [0.0,  0.0,  0.0,  1.0],
	White     : [1.0,  1.0,  1.0,  1.0],
	Red       : [1.0,  0.0,  0.0,  1.0],
	Green     : [0.0,  1.0,  0.0,  1.0],
	DarkGreen : [0.0,  0.4,  0.0,  1.0],
	Blue      : [0.0,  0.0,  1.0,  1.0],
	Orange    : [1.0,  0.6,  0.0,  1.0],
	Pink      : [0.95, 0.0,  1.0,  1.0],

	Random    : function()
	{
		return [ Math.random(), Math.random(), Math.random(), 1 ];
	}
};