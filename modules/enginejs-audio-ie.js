// *******************************************
//# sourceURL=modules/enginejs-audio.js
// *******************************************

Engine.Audio =
{
	LoadSound : function(descriptor, callback)
	{
		Engine.LogWarning("Audio not supported in IE, will not load: " + descriptor.file);
		callback({ url : descriptor.file, pcm_buffer : null });
	},

	PlaySFX : function(sound_resource) { Engine.LogWarning("Audio not supported in IE, will not play SFX: " + sound_resource.file); },
	PlayBGM : function(sound_resource) { Engine.LogWarning("Audio not supported in IE, will not play BGM: " + sound_resource.file); },

	Sound : function(sound_resource, global_volume_node, loop)
	{
		this.Play = function()    { };
		this.Pause = function()   { };
		this.Stop = function()    { };
		this.Restart = function() { };

		// Volume controls
		this.GetVolume = function() { return 0; };
		this.SetVolume = function(volume) { };

		// Loop controls
		this.IsLooped = function() { return false; };
		this.EnableLoop = function(loop) {  };
	},

	SoundEffect2D : function(sound_resource)
	{
		// Inherit base
		$.extend(this, new Engine.Audio.Sound(sound_resource, null, false));
	},

	BackgroundMusic : function(sound_resource)
	{
		// Inherit base
		$.extend(this, new Engine.Audio.Sound(sound_resource, null, true));
	},

	SetGlobalBgmVolume : function(volume) { },
	SetGlobalSfxVolume : function(volume) { }
};

// *******************************************
// Init
// *******************************************

// Register handler for mp3 files
Engine.Resource.RegisterLoadFunction("mp3", Engine.Audio.LoadSound);