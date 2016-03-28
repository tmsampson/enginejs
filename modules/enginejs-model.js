// *******************************************
//# sourceURL=modules/enginejs-model.js
// *******************************************

Engine.Model =
{
	Load : function(descriptor, callback)
	{
		Engine.Net.FetchResource(descriptor.file, function(model_json)
		{
			var model_file = jQuery.parseJSON(model_json);
			var model_object = Engine.Model.Generate(model_file);
			callback(model_object);
		});
	},

	Generate : function(model_file)
	{
		// For each primitive...
		var prims = model_file.model_data.primitives;
		for(var i = 0; i < prims.length; ++i)
		{
			// Build vertex buffers
			var vertex_buffers = prims[i].vertex_buffers;
			for(var j = 0; j < vertex_buffers.length; ++j)
			{
				// Place vertex buffer object immediately inside buffer object
				vertex_buffers[j].vbo = Engine.Gfx.CreateVertexBuffer(vertex_buffers[j]);
			}
		}

		// Finalise loaded model
		model_file.is_loaded = true;
		return model_file;
	},
};

// Resource loading
Engine.Resource.RegisterLoadFunction("model", Engine.Model.Load);
