function pos_dir_to_parametric_2d(pos, dir)
{
	// Find two points on line
	var p1 = pos;
	var p2 = Engine.Vec2.Add(pos, dir);

	// Find A, B and C where Ax + By = C
	var a = p2[1] - p1[1];         // A = y2 - y1
	var b = p1[0] - p2[0];         // B = x1 - x2
	var c = a * p1[0] + b * p1[1]; // C = A * x1 + B * y1
	return { A : a , B : b, C : c };
}

function intersect_2d(E0, E1)
{
	// First we want the trajectories of each entity in the
	// form: Ax + By = C
	var line1 = pos_dir_to_parametric_2d(E0.u, E0.v);
	var line2 = pos_dir_to_parametric_2d(E1.u, E1.v);

	// Next we calculate the determinant (if zero, no intersection)
	var determinant = (line1.A * line2.B) - (line1.B * line2.A);
	if(determinant == 0) { return null; }

	// Calculate points of intersection
	var intersect_x = (line2.B * line1.C - line1.B * line2.C) / determinant;
	var intersect_y = (line1.A * line2.C - line2.A * line1.C) / determinant;
	return [ intersect_x, intersect_y ];
}

function find_intersection_and_times_2d(E0, E1)
{
	var _intersect = intersect_2d(E0, E1)
	if(_intersect == null) { return { intersect : null }; }

	// Find t1
	var e0_to_intersect = Engine.Vec2.Subtract(_intersect, E0.u); // intersection point relative to E0 starting position (E0.u)
	var mul1 = Engine.Vec2.Dot(e0_to_intersect, E0.v) > 0 ? 1 : -1;
	var _t1 = Engine.Vec2.Length(e0_to_intersect) / Engine.Vec2.Length(E0.v) * mul1;

	// Find t2
	var e1_to_intersect = Engine.Vec2.Subtract(_intersect, E1.u); // intersection point relative to E0 starting position (E0.u)
	var mul2 = Engine.Vec2.Dot(e1_to_intersect, E1.v) > 0 ? 1 : -1;
	var _t2 = Engine.Vec2.Length(e1_to_intersect) / Engine.Vec2.Length(E1.v) * mul2;

	return { intersect : _intersect, t1 : _t1, t2 : _t2 };
}