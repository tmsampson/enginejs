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

	Find : function(array, predicate)
	{
		for(var i = 0; i < array.length; ++i)
		{
			if(predicate(array[i]))
				return array[i];
		}
		return undefined;
	},

	Filter : function(array, predicate)
	{
		var filtered = [];
		for(var i = 0; i < array.length; ++i)
		{
			if(predicate(array[i]))
				filtered.push(array[i]);
		}
		return filtered;
	}
};