// *******************************************
//# sourceURL=modules/enginejs-util.js
// *******************************************

Engine.Util =
{
	MD5 : function(data)
	{
		return HashCode.value(data);
	},

	Clone : function(obj)
	{
		var copiedObject = {};
		jQuery.extend(copiedObject,obj);
		return copiedObject;
	},

	IsFunction : function(x)
	{
		var getType = { };
		return x && getType.toString.call(x) === '[object Function]';
	}
};