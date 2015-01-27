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

	Sound : function(sound_object, global_volume_node, loop)
	{
		this.resource = sound_object;

		// Setup source
		this.source = Engine.Audio.context.createBufferSource();
		this.source.buffer = sound_object.pcm_buffer;
		this.source.loop = loop;

		// Let this instance have it's own volume range, starting at
		// full volume and clamped to global SFX volume
		this.volume_node = Engine.Audio.context.createGain();
		this.volume_node.gain.value = 1.0;
		this.volume_node.connect(global_volume_node);
		this.source.connect(this.volume_node);

		// Playback control
		this.Play = function() { this.source.start(0); };
		this.Stop = function() { this.source.stop(0);  };

		// Volume controls
		this.GetVolume = function() { return this.volume_node.gain.value; };
		this.SetVolume = function(volume) { this.volume_node.gain.value = volume; };

		// Loop controls
		this.IsLooped = function() { return this.source.loop; };
		this.EnableLoop = function(loop) { this.source.loop = loop; };
	},

	SoundEffect2D : function(sound_object)
	{
		// Inherit base
		$.extend(this, new Engine.Audio.Sound(sound_object, Engine.Audio.volume_nodes["sfx"], false));
	},

	BackgroundMusic : function(sound_object)
	{
		// Inherit base
		$.extend(this, new Engine.Audio.Sound(sound_object, Engine.Audio.volume_nodes["bgm"], true));
	},

	SetGlobalBgmVolume : function(volume)
	{
		Engine.Audio.volume_nodes["bgm"].gain.value = volume;
	},

	SetGlobalSfxVolume : function(volume)
	{
		Engine.Audio.volume_nodes["sfx"].gain.value = volume;
	},
};

// *******************************************
// Init
// *******************************************
window.AudioContext = window.AudioContext || window.webkitAudioContext;
Engine.Audio.context = new AudioContext();

// Setup volume nodes
Engine.Audio.volume_nodes =
{
	"bgm" : Engine.Audio.context.createGain(),
	"sfx" : Engine.Audio.context.createGain()
};

// Connect volume nodes to audio output
Engine.Audio.volume_nodes["bgm"].connect(Engine.Audio.context.destination);
Engine.Audio.volume_nodes["sfx"].connect(Engine.Audio.context.destination);

// Register handler for mp3 files
Engine.Resource.RegisterLoadFunction("mp3", Engine.Audio.LoadSound);