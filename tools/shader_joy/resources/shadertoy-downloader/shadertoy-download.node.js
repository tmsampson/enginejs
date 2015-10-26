// Dependencies
var request = require('request');
var fs = require('fs');

// Globals
var make_dir = function(dir) { if (!fs.existsSync(dir)) { fs.mkdirSync(dir); } };
var output_dir = "./shaders"; make_dir(output_dir);
var shader_ids;

// Parse command line
var api_key = process.argv[2];
if(typeof api_key == 'undefined')
{
	console.log("ERROR: Please pass API key on command line");
	return;
}

// Async helper
function ExecuteAsyncLoop(array, func, on_complete)
{
	var current_element = 0;
	var process_next_element = function()
	{
		var element = array[current_element];
		func(element, function(next)
		{
			(++current_element < array.length)? process_next_element() : // Next element?
			                                    on_complete();           // Complete!
		});
	};
	process_next_element(); // Begin processing elements
}

// Main
var shadertoy_api_list_all = "https://www.shadertoy.com/api/v1/shaders?key=" + api_key;
request(shadertoy_api_list_all, function (error, response, body)
{
	if (!error && response.statusCode == 200)
	{
		shader_ids = JSON.parse(body).Results;

		var count = 0;
		ExecuteAsyncLoop(shader_ids, function(shader_id, next)
		{
			var url = "https://www.shadertoy.com/api/v1/shaders/" + shader_id + "?key=" + api_key;
			request(url, function (error, response, body)
			{
				if (!error && response.statusCode == 200)
				{
					// Parse
					var item = JSON.parse(body);
					var code = item.Shader.renderpass[0].code;
					var author = item.Shader.info.username;
					var name = item.Shader.info.name.replace(/[?*|&;$%@"<>()+,\\\/]/g, "-").trim().replace("..", "-");

					// Log
					console.log("=======================================================================");
					console.log(++count + " / " + shader_ids.length);
					console.log(url);
					console.log(author + "/" + name);

					// Setup dir
					var author_dir = output_dir + "/" + author;
					make_dir(author_dir);

					// Store code
					fs.writeFile(author_dir + "/" + name + ".fs", code);

					// Store META (minus code)
					item.Shader.renderpass[0].code = "";
					fs.writeFile(author_dir + "/" + name + ".meta", JSON.stringify(item, null, '\t'));
				}

				next();
			});
		}, function()
		{
			console.log("Finished!");
		});
	}
});