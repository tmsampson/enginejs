// *******************************************
//# sourceURL=modules/enginejs-net.js
// *******************************************

Engine.Net =
{
	FetchResource : function(resource_url, callback)
	{
		callback = callback || false;
		var request = jQuery.ajax(
		{
			url     : resource_url + Engine.Net.MakeCachPreventionString(resource_url),
			async   : callback,
			cache   : false,
			success : function(data)
			{
				if(callback)
				{
					var size = request.getResponseHeader("Content-Length");
					callback(data, size);
				}
			},
			error   : function(err)
			{
				Engine.LogError("Failed fetching resource: " + resource_url);
			}
		});
	},

	FetchBinaryResource : function(resource_url, callback)
	{
		// No support for binary ajax calls in jQuery, using XHTML Request Level 2 instead
		// see: http://bugs.jquery.com/ticket/11461
		callback = callback || false;
		var request = new XMLHttpRequest();
		request.open("GET", resource_url + Engine.Net.MakeCachPreventionString(resource_url), true);
		request.responseType = 'arraybuffer';
		request.onload = function(e)
		{
			if(this.status == 200)
			{
				var size = request.getResponseHeader("Content-Length");
				if(callback) { callback(request.response, size); }
			}
			else
			{
				Engine.LogError("Failed fetching resource: " + resource_url);
			}
		};
		request.send();
	},

	MakeCachPreventionString : function(resource_url)
	{
		var url_contains_param = (resource_url.indexOf('?') != -1);
		return (url_contains_param? "&" : "?") + "timestamp=" + Engine.Time.Now();
	}
};