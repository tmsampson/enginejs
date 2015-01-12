// *******************************************
//# sourceURL=modules/enginejs-time.js
// *******************************************

Engine.Time =
{
	Now : function()
	{
		return new Date().getTime();
	},

	Sleep : function(milliseconds)
	{
		var start = Engine.Time.Now();
		for(var i = 0; i < 1e7; i++)
		{
			if((Engine.Time.Now() - start) > milliseconds)
			{
				break;
			}
		}
	}
};