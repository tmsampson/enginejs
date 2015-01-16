// *******************************************
//# sourceURL=modules/enginejs-audio.js
// *******************************************

Engine.Audio =
{
	LoadSound : function(descriptor, callback)
	{
		Engine.Net.FetchBinaryResource(descriptor.file, function(encoded_audio)
		{
			Engine.Audio.context.decodeAudioData(encoded_audio, function(buffer)
			{
				var sound_object =
				{
					url        : descriptor.file,
					pcm_buffer : buffer
				}
				callback(sound_object);
			});
		});
	},

	PlayBGM : function(sound_object, params)
	{
		Engine.Audio.PlaySound(sound_object, params, Engine.Audio.volume_nodes["bgm"]);
	},

	PlaySFX : function(sound_object, params)
	{
		Engine.Audio.PlaySound(sound_object, params, Engine.Audio.volume_nodes["sfx"]);
	},

	PlaySound : function(sound_object, params, volume_node)
	{
		var source = Engine.Audio.context.createBufferSource();
		source.loop = (params && params["loop"])? params["loop"] : false;
		source.buffer = sound_object.pcm_buffer;

		// sound --> volume node --> speakers
		source.connect(volume_node);
		volume_node.connect(Engine.Audio.context.destination);
		source.start(0);
	},

	SetVolume : function(volume_node_name, volume)
	{
		Engine.Audio.volume_nodes[volume_node_name].gain.value = volume;
	},

	SetVolumeBGM : function(volume)
	{
		Engine.Audio.SetVolume("bgm", volume);
	},

	SetVolumeSFX : function(volume)
	{
		Engine.Audio.SetVolume("sfx", volume);
	},
};

// *******************************************
// Resource Load
// *******************************************
Engine.Resource.RegisterLoadFunction("mp3", Engine.Audio.LoadSound);

// *******************************************
// Init
// *******************************************
window.AudioContext = window.AudioContext || window.webkitAudioContext;
Engine.Audio.context = new AudioContext();
Engine.Audio.volume_nodes =
{
	"bgm" : Engine.Audio.context.createGain(),
	"sfx" : Engine.Audio.context.createGain()
};