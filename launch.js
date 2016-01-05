// Dependencies
var fs            = require('fs');
var path          = require('path')
var http          = require('http');
var os            = require('os');
var child_process = require('child_process');
var locateChrome  = require('locate-chrome');
var express       = require('express');
var bodyParser    = require('body-parser');

// Config
var server = express();
var config;
var platform = os.platform();
var enginejs_root = __dirname;
var enginejs_launcher_dir = enginejs_root + "/launcher";
var enginejs_samples_dir = enginejs_root + "/samples";
var user_home_dir = process.env[(platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var junction_tool = enginejs_root + "/tools/junction/junction.exe";
var config_file = enginejs_launcher_dir + "/config.json";
var default_project_folder_name = "EngineJSProjects";
var default_port = 1234;

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

function to_json(x) { return JSON.stringify(x, null, "\t"); }
function from_json(x) { return JSON.parse(x); }

function CreateIfMissing(folder)
{
	if(!fs.existsSync(folder))
	{
		console.log("Creating folder: " + folder);
		fs.mkdirSync(folder);
	}
}

function SetProjectsFolder(folder)
{
	config.project_folder = folder;
	ApplyConfigChanges();

	console.log("Now serving /projects from: " + config.project_folder);
	server.use("/projects", express.static(config.project_folder));
}

function ApplyConfigChanges()
{
	CreateIfMissing(config.project_folder);
	fs.writeFileSync(config_file, to_json(config));
}

// Setup config file?
if(!fs.existsSync(config_file))
{
	config =
	{
		project_folder : user_home_dir + "\\" + default_project_folder_name,
		port           : default_port
	};

	ApplyConfigChanges();
}
else
{
	// Load config file from disk
	config = from_json(fs.readFileSync(config_file, 'utf8'));
}

function CreateSymlink(src, dest)
{
	switch(platform)
	{
		case "win32":
			var cmd = quotes(junction_tool) + quotes(src) + quotes(dest);
			child_process.exec(cmd);
			break;
		default:
			if(!fs.existsSync(src))
			{
				fs.symlinkSync(dest, src);
			}
			break;
	}
}

// Setup symlinks
CreateSymlink(enginejs_root + "/tools/sprite_previewer/enginejs", enginejs_root);
CreateSymlink(enginejs_root + "/tools/shader_joy/enginejs", enginejs_root);
var samples = GetDirectories(enginejs_root + "/samples");
for(var i = 0; i < samples.length; ++i)
{
	var src = enginejs_samples_dir + "/" + samples[i] + "/enginejs";
	CreateSymlink(src, enginejs_root);
}

// Show splash screen
var url = "http://" + GetLocalIPAddress() + ":" + config.port;
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
console.log("          Port : " + config.port);
console.log("    Device URL : " + url);
console.log("==============================================================================");

// Setup Webserver
server.use(bodyParser.json());
server.use("/", express.static(enginejs_root));
SetProjectsFolder(config.project_folder);

server.get('/server/launcher/get_project_details', function (req, res)
{
	var project_details =
	{
		folder   : config.project_folder,
		projects : GetDirectories(config.project_folder)
	};
	res.send(to_json(project_details));
});

server.post('/server/launcher/set_project_folder', function (req, res)
{
	SetProjectsFolder(req.body.folder);
	ApplyConfigChanges(config);
});

server.post('/server/launcher/create_new_project', function (req, res)
{
	if(fs.existsSync(config.project_folder + "/" + req.name))
	{
		res.send("already exists!");
	}

	console.log(req.body);
});

// Start Webserver
server.listen(config.port);

// Launch in chrome app shell
locateChrome(function(chrome)
{
	var args = "--incognito " +
	           "--app=" + url + "/launcher/index.htm " +
	           "--enable-webgl " +
	           "--ignore-gpu-blacklist";
	child_process.exec(quotes(chrome) + args);
});