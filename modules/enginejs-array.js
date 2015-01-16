// *******************************************
//# sourceURL=modules/enginejs-array.js
// *******************************************

Engine.Array =
{
	IsArray : function(object)
	{
		return (object.constructor === Array);
	},

	Copy : function(array)
	{
		return array.slice(0);
	},

	GetFirstValue : function(array)
	{
		return array[Object.keys(array)[0]]
	},
};