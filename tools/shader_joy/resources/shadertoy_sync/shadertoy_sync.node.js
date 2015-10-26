var request = require('request');
var fs = require('fs');

var output_dir = "./shaders";
var shadertoy_api_list_all = "https://www.shadertoy.com/api/v1/shaders?key=ftHKwr";
var shader_ids;

// Setup shader dir
if (!fs.existsSync(output_dir))
{
	fs.mkdirSync(output_dir);
}

function ExecuteAsyncLoop(array, func, on_complete)
{
	var current_element = 0;
	var process_next_element = function()
	{
		var element = array[current_element];
		func(element, function(carry_on)
		{
			// Break out of loop on fail
			if(!carry_on) { on_complete(false); return; }
			(++current_element < array.length)? process_next_element() : // Next element?
			                                    on_complete(true);       // Complete!
		});
	};
	process_next_element(); // Begin processing elements
}

request(shadertoy_api_list_all, function (error, response, body)
{
	if (!error && response.statusCode == 200)
	{
		shader_ids = JSON.parse(body).Results;

		var count = 0;
		ExecuteAsyncLoop(shader_ids, function(shader_id, carry_on)
		{
			var url = "https://www.shadertoy.com/api/v1/shaders/" + shader_id + "?key=ftHKwr";
			request(url, function (error, response, body)
			{
				if (!error && response.statusCode == 200)
				{
					// Parse
					var item = JSON.parse(body);
					var code = item.Shader.renderpass[0].code;
					var author = item.Shader.info.username;
					var name = item.Shader.info.name.replace("/", "-");

					// Log
					console.log("*************************************");
					console.log(++count + "/" + shader_ids.length);
					console.log(url);
					console.log(author + "/" + name);

					// Setup dir
					var author_dir = output_dir + "/" + author;
					if (!fs.existsSync(author_dir))
					{
						fs.mkdirSync(author_dir);
					}

					// Store code
					var code_filename = author_dir + "/" + name + ".fs";
					fs.writeFile(code_filename, code, function(err)
					{
						if(err)
						{
							console.log("Failed to write file: " + code_filename);
						}
					});

					// Store META
					item.Shader.renderpass[0].code = "";
					var meta_filename = author_dir + "/" + name + ".meta";
					fs.writeFile(meta_filename, JSON.stringify(item, null, '\t'), function(err)
					{
						if(err)
						{
							console.log("Failed to write file: " + code_filename);
						}
					});
				}

				carry_on(true);
			});
		}, function(ok)
		{
			console.log("Finished: " + ok? "SUCCESS" : "FAIL");
		});
	}
});