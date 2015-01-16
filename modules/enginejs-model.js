// *******************************************
//# sourceURL=modules/enginejs-model.js
// *******************************************

Engine.Model =
{
	Load : function(descriptor, callback)
	{
		Engine.Net.FetchResource(descriptor.file, function(model_json)
		{
			var model = jQuery.parseJSON(model_json);

			// For each primitive...
			var prims = model.model_data.primitives;
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

			// Finalise
			model.is_loaded = true;
			callback(model);
		});
	},
};

// Resource loading
Engine.Resource.RegisterLoadFunction("model", Engine.Model.Load);