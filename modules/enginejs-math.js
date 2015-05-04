// *******************************************
//# sourceURL=modules/enginejs-math.js
// *******************************************

Engine.Math =
{
	// Constants
	IdentityMatrix : mat4.create(),

	Clamp : function(x, min, max)
	{
		return Math.min(Math.max(x, min), max);
	},

	Random : function(min, max)
	{
		return Math.random() * (max - min) + min;
	},

	Midpoint : function(min, max)
	{
		return min + (max - min) / 2;
	},

	RandomInteger : function(min, max)
	{
		return Math.floor(Math.random() * (max - min + 1) + min);
	},

	AABB2D : function(min, max)
	{
		this.min = min;
		this.max = max;

		this.ContainsPoint = function(point)
		{
			if(point[0] < this.min[0] || point[0] > this.max[0])
				return false;
			if(point[1] < this.min[1] || point[1] > this.max[1])
				return false;
			return true;
		};

		this.Intersects = function(other_aabb)
		{
			return Engine.Math.Intersect_AABB_AABB(this, other_aabb);
		};
	},

	// Intersection tests
	Intersect_AABB_AABB : function(a, b)
	{
		if(a.min[0] > b.max[0] || a.max[0] < b.min[0])
			return false; // horizontal axis separation
		if(a.min[1] > b.max[1] || a.max[1] < b.min[1])
			return false; // vertical axis separation
		return true;
	},

	Intersect_Circle_Circle : function(a, b)
	{
		var radii_squared_sum = (a.radius * a.radius) + (b.radius * b.radius);
		var squared_dist = Engine.Vec2.DistanceSquared(a.position, b.position);
		return squared_dist <= radii_squared_sum;
	}
};