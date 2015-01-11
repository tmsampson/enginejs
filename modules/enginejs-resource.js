// *******************************************
//# sourceURL=modules/enginejs-resource.js
// *******************************************

Engine.Resource =
{
	LoadFunctions :
	{
		// TODO: Move into relevant modules
		png   : function(descriptor, callback) { Engine.LoadTexture(descriptor, callback); },
		jpg   : function(descriptor, callback) { Engine.LoadTexture(descriptor, callback); },
		vs    : function(descriptor, callback) { Engine.LoadShader(descriptor, callback);  },
		fs    : function(descriptor, callback) { Engine.LoadShader(descriptor, callback);  },
		model : function(descriptor, callback) { Engine.LoadModel(descriptor, callback);   },
	},

	LoadBatch : function(descriptor_list, on_complete)
	{
		// Skip null / empty lists
		if(!descriptor_list) { return on_complete(); }

		// Extract optional on_loaded callback from list
		var on_loaded = descriptor_list["on_loaded"];

		// Process all descriptors in resource list
		var i = 0; var property_count = Object.keys(descriptor_list).length - (on_loaded? 1 : 0);
		ExecuteAsyncLoopProps(descriptor_list, function(prop_key, descriptor, carry_on)
		{
			// Don't try and load the user callback as a resource!
			if(prop_key == "on_loaded") { return carry_on(true); }

			Engine.Log("Loading resource: " + descriptor.file);
			descriptor.prop_key = prop_key; // Pass prop_key through closure
			Engine.Resource.Load(descriptor, function(resource_object)
			{
				descriptor_list[descriptor.prop_key] = resource_object;
				delete descriptor.prop_key; // No use to client
				if(on_loaded) { on_loaded(descriptor.file, ++i, property_count); }
				carry_on(true);
			});
		}, on_complete);
	},

	Load : function(descriptor, on_complete)
	{
		// Is this resource type supported?
		var extension = descriptor.file.split('.').pop();
		if(extension in Engine.Resource.LoadFunctions)
		{
			Engine.Resource.LoadFunctions[extension](descriptor, function(resource_object)
			{
				on_complete(resource_object);
			});
		}
		else
		{
			Engine.LogError("Resource type with extension '" + extension + "' not supported");
			on_complete(null);
		}
	},

	RegisterLoadFunction : function(extension, func)
	{
		Engine.Resource.LoadFunctions[extension] = func;
	},

	Base : function(descriptor, resource_object)
	{
		$.extend(this, resource_object);
		this.descriptor = descriptor;
	}
};