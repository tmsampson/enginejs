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
	},

	FromHex   : function(hex)
	{
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function(m, r, g, b)
		{
			return r + r + g + g + b + b;
		});

		// Parse channels
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if(result)
		{
			return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255, 1];
		}

		return [0, 0, 0, 1];
	},

	ToHex     : function(colour)
	{
		var component_to_hex = function(c)
		{
			var hex = c.toString(16);
			return hex.length == 1 ? "0" + hex : hex;
		};

		return "#" + component_to_hex(parseInt(colour[0] * 255)) +
					 component_to_hex(parseInt(colour[1] * 255)) +
					 component_to_hex(parseInt(colour[2] * 255));
	},

	Lerp      : function(colour_a, colour_b, t)
	{
		return [ (colour_a[0] * (1.0 - t)) + (colour_b[0] * t),
		         (colour_a[1] * (1.0 - t)) + (colour_b[1] * t),
		         (colour_a[2] * (1.0 - t)) + (colour_b[2] * t),
		         (colour_a[3] * (1.0 - t)) + (colour_b[3] * t) ];
	},
};