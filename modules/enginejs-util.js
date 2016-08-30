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
		var copiedObject = { };
		jQuery.extend(copiedObject, obj);
		return copiedObject;
	},

	IsFunction : function(obj)
	{
		var getType = { };
		return obj && getType.toString.call(obj) === '[object Function]';
	},

	IsArray : function(obj)
	{
		return (obj.constructor === Array);
	},

	IsString : function(obj)
	{
		return typeof obj == 'string' || obj instanceof String;
	},

	IsDefined : function(x)
	{
		return typeof x !== 'undefined';
	},

	CopyToClipboard : function(text)
	{
		// Uses prompt, allowing user to manually copy the text (using ctrl+c)
		window.prompt("EngineJS: Copy to clipboard (Ctrl + C)", text);
	}
};