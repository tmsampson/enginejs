// Dependencies
var fs            = require('fs');
var path          = require('path')
var http          = require('http');
var final_handler = require('finalhandler');
var serve_static  = require('serve-static');
var os            = require('os');
var child_process = require('child_process');
var locateChrome  = require('locate-chrome');

// Config
var platform = os.platform();
var port = 1234;
var enginejs_root = __dirname;
var enginejs_samples_dir = enginejs_root + "/samples";
var junction_tool = enginejs_root + "/tools/junction/junction.exe";

// Helpers
function GetLocalIPAddress()
{
	var ifaces = os.networkInterfaces(); var ip_address = "";
	Object.keys(ifaces).forEach(function(ifname)
	{
		ifaces[ifname].forEach(function(iface)
		{
			if ('IPv4' !== iface.family || iface.internal !== false)
				return; // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
			ip_address = iface.address;
		});
	});
	return ip_address;
}

function GetDirectories(srcpath)
{
	return fs.readdirSync(srcpath).filter(function(file)
	{
		return fs.statSync(path.join(srcpath, file)).isDirectory();
	});
}

function quotes(x)
{
	return "\"" + x + "\" ";
}

// Setup symlinks
var samples = GetDirectories(enginejs_root + "/samples");
for(var i = 0; i < samples.length; ++i)
{
	var src = enginejs_samples_dir + "/" + samples[i] + "/enginejs";
	switch(platform)
	{
		case "win32":
			var cmd = quotes(junction_tool) + quotes(src) + quotes(enginejs_root);
			child_process.exec(cmd);
			break;
		default:
			if(!fs.existsSync(src))
			{
				fs.symlinkSync(enginejs_root, src);
			}
			break;
	}
}

// Setup Webserver
var serve = serve_static(enginejs_root);
var server = http.createServer(function(req, res)
{
	if(req.url == "/") { req.url = "/index.htm"; }
	var done = final_handler(req, res);
	serve(req, res, done);
});

// Show splash screen
var url = "http://" + GetLocalIPAddress() + ":" + port;
console.log("==============================================================================");
console.log("                     _____         _            __ _____                      ");
console.log("                    |   __|___ ___|_|___ ___ __|  |   __|                     ");
console.log("                    |   __|   | . | |   | -_|  |  |__   |                     ");
console.log("                    |_____|_|_|_  |_|_|_|___|_____|_____|                     ");
console.log("                              |___|                                           ");
console.log("                                                                              ");
console.log("==============================================================================");
console.log("                            Development Server V1                             ");
console.log("==============================================================================");
console.log(" EngineJS root : " + enginejs_root);
console.log("   Server root : " + enginejs_root);
console.log("          Port : " + port);
console.log("    Device URL : " + url);
console.log("==============================================================================");

// Start Webserver
server.listen(port);

// Launch in chrome app shell
locateChrome(function(chrome)
{
	var args = "--incognito " +
	           "--app=" + url + "/samples/index.htm " +
	           "--enable-webgl " +
	           "--ignore-gpu-blacklist";
  	child_process.exec(quotes(chrome) + args);
});
