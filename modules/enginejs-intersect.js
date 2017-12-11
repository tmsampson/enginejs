// *******************************************
//# sourceURL=modules/enginejs-intersect.js
// *******************************************

Engine.Intersect =
{
	AABB_AABB : function(a, b)
	{
		if(a.min[0] > b.max[0] || a.max[0] < b.min[0])
			return false; // horizontal axis separation
		if(a.min[1] > b.max[1] || a.max[1] < b.min[1])
			return false; // vertical axis separation
		return true;
	},

	Circle_Circle : function(a, b)
	{
		var radii_squared_sum = (a.radius + b.radius) * (a.radius + b.radius);
		var squared_dist = Engine.Vec2.DistanceSquared(a.position, b.position);
		return squared_dist <= radii_squared_sum;
	},

	RayPlane : function(hit_pos, ray_origin, ray_dir, plane_normal, plane_dist)
	{
		var denom = Engine.Vec3.DotProduct(ray_dir, plane_normal);
		if (denom !== 0)
		{
			var t = -(Engine.Vec3.DotProduct(ray_origin, plane_normal) + plane_dist) / denom
			if (t < 0)
			{
				return null;
			}

			var offset = Engine.Vec3.MultiplyScalar(ray_dir, t);
			return Engine.Vec3.Add(ray_origin, offset);
		}
		else if (Engine.Vec3.DotProduct(plane_normal, ray_origin) + plane_dist === 0)
		{
			return Engine.Vec3.Copy(ray_origin);
		}
		else
		{
			return null;
		}
	}
};