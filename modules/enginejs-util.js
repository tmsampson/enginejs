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
	}
};

// Make 'Web App Capable' on mobile devices. This allows the app
// to runs in fullscreen when launched from a mobile device's home screen.
$('head').append("<meta name='mobile-web-app-capable' content='yes'>");
$('head').append("<meta name='apple-mobile-web-app-capable' content='yes'>");