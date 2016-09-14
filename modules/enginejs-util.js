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
	},

	Hash : function(x)
	{
		var string_to_hash = Engine.Util.IsString(x)? x : JSON.stringify(x);
		var hash = 0, i, chr, len;
		for (i = 0, len = string_to_hash.length; i < len; i++)
		{
			chr = string_to_hash.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32-bit integer
		}
		return hash;
	}
};