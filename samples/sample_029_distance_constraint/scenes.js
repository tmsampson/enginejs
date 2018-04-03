var scenes =
[
	// ************************************************************************************************************
	// ************************************************************************************************************
	// Hungry Caterpillar
	// ************************************************************************************************************
	// ************************************************************************************************************
	function()
	{
		// Setup name
		scene_name = "Hungry Caterpillar";

		// Setup gravity
		gravity_enabled = false;

		// Setup bodies
		var centre = Engine.Canvas.GetCentre();
		var radius = 32;
		var diameter = radius * 2;
		var separation = 50;
		var b1 = make_body([centre[0] - (diameter * 2) - (separation * 2), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b2 = make_body([centre[0] - (diameter * 1) - (separation * 1), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b3 = make_body(centre, radius, 1.0, Engine.Colour.Red);
		var b4 = make_body([centre[0] + (diameter * 1) + (separation * 1), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b5 = make_body([centre[0] + (diameter * 2) + (separation * 2), centre[1], 0], radius + 10, 1.0, Engine.Colour.Green);
		bodies.push(b1);
		bodies.push(b2);
		bodies.push(b3);
		bodies.push(b4);
		bodies.push(b5);

		// Setup constraints
		var min_separation = diameter;
		var max_separation = diameter + separation;
		var c1 = make_constraint(b1, b2, min_separation, max_separation);
		var c2 = make_constraint(b2, b3, min_separation, max_separation);
		var c3 = make_constraint(b3, b4, min_separation, max_separation);
		var c4 = make_constraint(b4, b5, min_separation + 10, max_separation);
		constraints.push(c1);
		constraints.push(c2);
		constraints.push(c3);
		constraints.push(c4);

		// Setup control
		controlled_body = b5;
	},

	// ************************************************************************************************************
	// ************************************************************************************************************
	// Wrecking ball
	// ************************************************************************************************************
	// ************************************************************************************************************
	function()
	{
		// Setup name
		scene_name = "Wrecking ball";

		// Setup gravity
		gravity_enabled = true;

		// Setup bodies
		var centre = Engine.Canvas.GetCentre();
		centre[1] += 200;
		var radius = 32;
		var diameter = radius * 2;
		var separation = 30;
		var b1 = make_body(centre, radius, 100000.0, Engine.Colour.Blue);
		var b2 = make_body([centre[0] + (diameter * 1) + (separation * 1), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b3 = make_body([centre[0] + (diameter * 2) + (separation * 2), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b4 = make_body([centre[0] + (diameter * 3) + (separation * 3), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b5 = make_body([centre[0] + (diameter * 4) + (separation * 4) + 30, centre[1], 0], radius + 30, 1.0, Engine.Colour.Green);
		bodies.push(b1);
		bodies.push(b2);
		bodies.push(b3);
		bodies.push(b4);
		bodies.push(b5);

		// Setup constraints
		var min_separation = diameter;
		var max_separation = diameter + separation;
		var c1 = make_constraint(b1, b2, min_separation, max_separation);
		var c2 = make_constraint(b2, b3, min_separation, max_separation);
		var c3 = make_constraint(b3, b4, min_separation, max_separation);
		var c4 = make_constraint(b4, b5, min_separation + 30, max_separation + 30);
		constraints.push(c1);
		constraints.push(c2);
		constraints.push(c3);
		constraints.push(c4);

		// Setup control
		controlled_body = b5;
	},

	// ************************************************************************************************************
	// ************************************************************************************************************
	// Snake
	// ************************************************************************************************************
	// ************************************************************************************************************
	function()
	{
		// Setup name
		scene_name = "Snake";

		// Setup gravity
		gravity_enabled = false;

		// Setup bodies
		var centre = Engine.Canvas.GetCentre();
		var radius = 16;
		var diameter = radius * 2;
		var separation = 20;
		var b1 = make_body([centre[0] - (diameter * 10) - (separation * 10), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b2 = make_body([centre[0] - (diameter * 9) - (separation * 9), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b3 = make_body([centre[0] - (diameter * 8) - (separation * 8), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b4 = make_body([centre[0] - (diameter * 7) - (separation * 7), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b5 = make_body([centre[0] - (diameter * 6) - (separation * 6), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b6 = make_body([centre[0] - (diameter * 5) - (separation * 5), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b7 = make_body([centre[0] - (diameter * 4) - (separation * 4), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b8 = make_body([centre[0] - (diameter * 3) - (separation * 3), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b9 = make_body([centre[0] - (diameter * 2) - (separation * 2), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b10 = make_body([centre[0] - (diameter * 1) - (separation * 1), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b11 = make_body(centre, radius, 1.0, Engine.Colour.Red);
		var b12 = make_body([centre[0] + (diameter * 1) + (separation * 1), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b13 = make_body([centre[0] + (diameter * 2) + (separation * 2), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b14 = make_body([centre[0] + (diameter * 3) + (separation * 3), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b15 = make_body([centre[0] + (diameter * 4) + (separation * 4), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b16 = make_body([centre[0] + (diameter * 5) + (separation * 5), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b17 = make_body([centre[0] + (diameter * 6) + (separation * 6), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b18 = make_body([centre[0] + (diameter * 7) + (separation * 7), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b19 = make_body([centre[0] + (diameter * 8) + (separation * 8), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b20 = make_body([centre[0] + (diameter * 9) + (separation * 9), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b21 = make_body([centre[0] + (diameter * 10) + (separation * 10) + 10, centre[1], 0], radius + 10, 1.0, Engine.Colour.Green);
		bodies.push(b1);
		bodies.push(b2);
		bodies.push(b3);
		bodies.push(b4);
		bodies.push(b5);
		bodies.push(b6);
		bodies.push(b7);
		bodies.push(b8);
		bodies.push(b9);
		bodies.push(b10);
		bodies.push(b11);
		bodies.push(b12);
		bodies.push(b13);
		bodies.push(b14);
		bodies.push(b15);
		bodies.push(b16);
		bodies.push(b17);
		bodies.push(b18);
		bodies.push(b19);
		bodies.push(b20);
		bodies.push(b21);

		// Setup constraints
		var min_separation = diameter;
		var max_separation = diameter + separation;
		var c1 = make_constraint(b1, b2, min_separation, max_separation);
		var c2 = make_constraint(b2, b3, min_separation, max_separation);
		var c3 = make_constraint(b3, b4, min_separation, max_separation);
		var c4 = make_constraint(b4, b5, min_separation, max_separation);
		var c5 = make_constraint(b5, b6, min_separation, max_separation);
		var c6 = make_constraint(b6, b7, min_separation, max_separation);
		var c7 = make_constraint(b7, b8, min_separation, max_separation);
		var c8 = make_constraint(b8, b9, min_separation, max_separation);
		var c9 = make_constraint(b9, b10, min_separation, max_separation);
		var c10 = make_constraint(b10, b11, min_separation, max_separation);
		var c11 = make_constraint(b11, b12, min_separation, max_separation);
		var c12 = make_constraint(b12, b13, min_separation, max_separation);
		var c13 = make_constraint(b13, b14, min_separation, max_separation);
		var c14 = make_constraint(b14, b15, min_separation, max_separation);
		var c15 = make_constraint(b15, b16, min_separation, max_separation);
		var c16 = make_constraint(b16, b17, min_separation, max_separation);
		var c17 = make_constraint(b17, b18, min_separation, max_separation);
		var c18 = make_constraint(b18, b19, min_separation, max_separation);
		var c19 = make_constraint(b19, b20, min_separation, max_separation);
		var c20 = make_constraint(b20, b21, min_separation + 10, max_separation + 10);
		constraints.push(c1);
		constraints.push(c2);
		constraints.push(c3);
		constraints.push(c4);
		constraints.push(c5);
		constraints.push(c6);
		constraints.push(c7);
		constraints.push(c8);
		constraints.push(c9);
		constraints.push(c10);
		constraints.push(c11);
		constraints.push(c12);
		constraints.push(c13);
		constraints.push(c14);
		constraints.push(c15);
		constraints.push(c16);
		constraints.push(c17);
		constraints.push(c18);
		constraints.push(c19);
		constraints.push(c20);

		// Setup control
		controlled_body = b21;
	},

	// ************************************************************************************************************
	// ************************************************************************************************************
	// Cape
	// ************************************************************************************************************
	// ************************************************************************************************************
	function()
	{
		// Setup name
		scene_name = "Cape";

		// Setup gravity
		gravity_enabled = false;

		// Setup bodies
		var centre = Engine.Canvas.GetCentre();
		var radius = 16;
		var diameter = radius * 2;
		var separation = 20;
		var b1 = make_body([centre[0] - (diameter * 10) - (separation * 10), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b2 = make_body([centre[0] - (diameter * 9) - (separation * 9), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b3 = make_body([centre[0] - (diameter * 8) - (separation * 8), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b4 = make_body([centre[0] - (diameter * 7) - (separation * 7), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b5 = make_body([centre[0] - (diameter * 6) - (separation * 6), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b6 = make_body([centre[0] - (diameter * 5) - (separation * 5), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b7 = make_body([centre[0] - (diameter * 4) - (separation * 4), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b8 = make_body([centre[0] - (diameter * 3) - (separation * 3), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b9 = make_body([centre[0] - (diameter * 2) - (separation * 2), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b10 = make_body([centre[0] - (diameter * 1) - (separation * 1), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b11 = make_body(centre, radius, 1.0, Engine.Colour.Green);
		var b12 = make_body([centre[0] + (diameter * 1) + (separation * 1), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b13 = make_body([centre[0] + (diameter * 2) + (separation * 2), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b14 = make_body([centre[0] + (diameter * 3) + (separation * 3), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b15 = make_body([centre[0] + (diameter * 4) + (separation * 4), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b16 = make_body([centre[0] + (diameter * 5) + (separation * 5), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b17 = make_body([centre[0] + (diameter * 6) + (separation * 6), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b18 = make_body([centre[0] + (diameter * 7) + (separation * 7), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b19 = make_body([centre[0] + (diameter * 8) + (separation * 8), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b20 = make_body([centre[0] + (diameter * 9) + (separation * 9), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b21 = make_body([centre[0] + (diameter * 10) + (separation * 10), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		bodies.push(b1);
		bodies.push(b2);
		bodies.push(b3);
		bodies.push(b4);
		bodies.push(b5);
		bodies.push(b6);
		bodies.push(b7);
		bodies.push(b8);
		bodies.push(b9);
		bodies.push(b10);
		bodies.push(b11);
		bodies.push(b12);
		bodies.push(b13);
		bodies.push(b14);
		bodies.push(b15);
		bodies.push(b16);
		bodies.push(b17);
		bodies.push(b18);
		bodies.push(b19);
		bodies.push(b20);
		bodies.push(b21);

		// Setup constraints
		var min_separation = diameter;
		var max_separation = diameter + separation;
		var c1 = make_constraint(b1, b2, min_separation, max_separation);
		var c2 = make_constraint(b2, b3, min_separation, max_separation);
		var c3 = make_constraint(b3, b4, min_separation, max_separation);
		var c4 = make_constraint(b4, b5, min_separation, max_separation);
		var c5 = make_constraint(b5, b6, min_separation, max_separation);
		var c6 = make_constraint(b6, b7, min_separation, max_separation);
		var c7 = make_constraint(b7, b8, min_separation, max_separation);
		var c8 = make_constraint(b8, b9, min_separation, max_separation);
		var c9 = make_constraint(b9, b10, min_separation, max_separation);
		var c10 = make_constraint(b10, b11, min_separation, max_separation);
		var c11 = make_constraint(b11, b12, min_separation, max_separation);
		var c12 = make_constraint(b12, b13, min_separation, max_separation);
		var c13 = make_constraint(b13, b14, min_separation, max_separation);
		var c14 = make_constraint(b14, b15, min_separation, max_separation);
		var c15 = make_constraint(b15, b16, min_separation, max_separation);
		var c16 = make_constraint(b16, b17, min_separation, max_separation);
		var c17 = make_constraint(b17, b18, min_separation, max_separation);
		var c18 = make_constraint(b18, b19, min_separation, max_separation);
		var c19 = make_constraint(b19, b20, min_separation, max_separation);
		var c20 = make_constraint(b20, b21, min_separation, max_separation + 10);
		constraints.push(c1);
		constraints.push(c2);
		constraints.push(c3);
		constraints.push(c4);
		constraints.push(c5);
		constraints.push(c6);
		constraints.push(c7);
		constraints.push(c8);
		constraints.push(c9);
		constraints.push(c10);
		constraints.push(c11);
		constraints.push(c12);
		constraints.push(c13);
		constraints.push(c14);
		constraints.push(c15);
		constraints.push(c16);
		constraints.push(c17);
		constraints.push(c18);
		constraints.push(c19);
		constraints.push(c20);

		// Setup control
		controlled_body = b11;
	},

	// ************************************************************************************************************
	// ************************************************************************************************************
	// Slingshot
	// ************************************************************************************************************
	// ************************************************************************************************************
	function()
	{
		// Setup name
		scene_name = "Slingshot";

		// Setup gravity
		gravity_enabled = false;

		// Setup bodies
		var centre = Engine.Canvas.GetCentre();
		var radius = 16;
		var diameter = radius * 2;
		var separation = 20;
		var b5 = make_body([centre[0] - (diameter * 6) - (separation * 6), centre[1], 0], radius, 100000.0, Engine.Colour.Blue);
		var b6 = make_body([centre[0] - (diameter * 5) - (separation * 5), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b7 = make_body([centre[0] - (diameter * 4) - (separation * 4), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b8 = make_body([centre[0] - (diameter * 3) - (separation * 3), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b9 = make_body([centre[0] - (diameter * 2) - (separation * 2), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b10 = make_body([centre[0] - (diameter * 1) - (separation * 1), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b11 = make_body(centre, radius, 1.0, Engine.Colour.Green);
		var b12 = make_body([centre[0] + (diameter * 1) + (separation * 1), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b13 = make_body([centre[0] + (diameter * 2) + (separation * 2), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b14 = make_body([centre[0] + (diameter * 3) + (separation * 3), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b15 = make_body([centre[0] + (diameter * 4) + (separation * 4), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b16 = make_body([centre[0] + (diameter * 5) + (separation * 5), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b17 = make_body([centre[0] + (diameter * 6) + (separation * 6), centre[1], 0], radius, 100000.0, Engine.Colour.Blue);
		bodies.push(b5);
		bodies.push(b6);
		bodies.push(b7);
		bodies.push(b8);
		bodies.push(b9);
		bodies.push(b10);
		bodies.push(b11);
		bodies.push(b12);
		bodies.push(b13);
		bodies.push(b14);
		bodies.push(b15);
		bodies.push(b16);
		bodies.push(b17);

		// Setup constraints
		var min_separation = diameter + separation - 2;
		var max_separation = diameter + separation + 10;
		var c5 = make_constraint(b5, b6, min_separation, max_separation);
		var c6 = make_constraint(b6, b7, min_separation, max_separation);
		var c7 = make_constraint(b7, b8, min_separation, max_separation);
		var c8 = make_constraint(b8, b9, min_separation, max_separation);
		var c9 = make_constraint(b9, b10, min_separation, max_separation);
		var c10 = make_constraint(b10, b11, min_separation, max_separation);
		var c11 = make_constraint(b11, b12, min_separation, max_separation);
		var c12 = make_constraint(b12, b13, min_separation, max_separation);
		var c13 = make_constraint(b13, b14, min_separation, max_separation);
		var c14 = make_constraint(b14, b15, min_separation, max_separation);
		var c15 = make_constraint(b15, b16, min_separation, max_separation);
		var c16 = make_constraint(b16, b17, min_separation, max_separation);
		constraints.push(c5);
		constraints.push(c6);
		constraints.push(c7);
		constraints.push(c8);
		constraints.push(c9);
		constraints.push(c10);
		constraints.push(c11);
		constraints.push(c12);
		constraints.push(c13);
		constraints.push(c14);
		constraints.push(c15);
		constraints.push(c16);

		// Setup control
		controlled_body = b11;
	},

	// ************************************************************************************************************
	// ************************************************************************************************************
	// Bridge
	// ************************************************************************************************************
	// ************************************************************************************************************
	function()
	{
		// Setup name
		scene_name = "Bridge";

		// Setup gravity
		gravity_enabled = true;

		// Setup bodies
		var centre = Engine.Canvas.GetCentre();
		var radius = 16;
		var diameter = radius * 2;
		var separation = 20;
		var b5 = make_body([centre[0] - (diameter * 6) - (separation * 6), centre[1], 0], radius, 100000.0, Engine.Colour.Blue);
		var b6 = make_body([centre[0] - (diameter * 5) - (separation * 5), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b7 = make_body([centre[0] - (diameter * 4) - (separation * 4), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b8 = make_body([centre[0] - (diameter * 3) - (separation * 3), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b9 = make_body([centre[0] - (diameter * 2) - (separation * 2), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b10 = make_body([centre[0] - (diameter * 1) - (separation * 1), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b11 = make_body(centre, radius, 1.0, Engine.Colour.Red);
		var b12 = make_body([centre[0] + (diameter * 1) + (separation * 1), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b13 = make_body([centre[0] + (diameter * 2) + (separation * 2), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b14 = make_body([centre[0] + (diameter * 3) + (separation * 3), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b15 = make_body([centre[0] + (diameter * 4) + (separation * 4), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b16 = make_body([centre[0] + (diameter * 5) + (separation * 5), centre[1], 0], radius, 1.0, Engine.Colour.Red);
		var b17 = make_body([centre[0] + (diameter * 6) + (separation * 6), centre[1], 0], radius, 100000.0, Engine.Colour.Blue);
		bodies.push(b5);
		bodies.push(b6);
		bodies.push(b7);
		bodies.push(b8);
		bodies.push(b9);
		bodies.push(b10);
		bodies.push(b11);
		bodies.push(b12);
		bodies.push(b13);
		bodies.push(b14);
		bodies.push(b15);
		bodies.push(b16);
		bodies.push(b17);

		// Setup constraints
		var min_separation = diameter + separation;
		var max_separation = diameter + separation + 15;
		var c5 = make_constraint(b5, b6, min_separation, max_separation);
		var c6 = make_constraint(b6, b7, min_separation, max_separation);
		var c7 = make_constraint(b7, b8, min_separation, max_separation);
		var c8 = make_constraint(b8, b9, min_separation, max_separation);
		var c9 = make_constraint(b9, b10, min_separation, max_separation);
		var c10 = make_constraint(b10, b11, min_separation, max_separation);
		var c11 = make_constraint(b11, b12, min_separation, max_separation);
		var c12 = make_constraint(b12, b13, min_separation, max_separation);
		var c13 = make_constraint(b13, b14, min_separation, max_separation);
		var c14 = make_constraint(b14, b15, min_separation, max_separation);
		var c15 = make_constraint(b15, b16, min_separation, max_separation);
		var c16 = make_constraint(b16, b17, min_separation, max_separation);
		constraints.push(c5);
		constraints.push(c6);
		constraints.push(c7);
		constraints.push(c8);
		constraints.push(c9);
		constraints.push(c10);
		constraints.push(c11);
		constraints.push(c12);
		constraints.push(c13);
		constraints.push(c14);
		constraints.push(c15);
		constraints.push(c16);
	},
];