Collision =
{
	IsWallPresent : function(cell, cell_id, wall)
	{
		// Check internal wall
		if(Core.Map.Walls[cell_id] != null && Core.Map.Walls[cell_id][wall] != null)
		{
			return true;
		}

		// Check external (opposite) wall
		var opposite_cell = Core.GetOppositeCell(cell, wall);
		var opposite_cell_id = Core.GetCellId(opposite_cell);
		var opposite_wall = Core.GetOppositeWall(wall);
		if(Core.Map.Walls[opposite_cell_id] != null && Core.Map.Walls[opposite_cell_id][opposite_wall] != null)
		{
			return true;
		}

		return false;
	},

	PositionIsValid : function(detination, radius)
	{
		var destination_cell = Core.WorldToCell(detination);
		var destination_cell_id = Core.GetCellId(destination_cell);
		var destination_cell_world = Core.CellToWorld(destination_cell);
		var destination_x = detination[0];
		var destination_z = detination[2];

		// Calculate  wall limits
		var wall_left_x = destination_cell_world[0];
		var wall_right_x = wall_left_x + Core.Map.FloorTileSize;
		var wall_front_z = destination_cell_world[2];
		var wall_back_z = wall_front_z - Core.Map.FloorTileSize;

		// Check back
		if(Collision.IsWallPresent(destination_cell, destination_cell_id, Core.WALL_FLAG_BACK) && destination_z < (wall_back_z + radius))
		{
			return false;
		}

		// Check right
		if(Collision.IsWallPresent(destination_cell, destination_cell_id, Core.WALL_FLAG_RIGHT) && destination_x > (wall_right_x - radius))
		{
			return false;
		}

		// Check front
		if(Collision.IsWallPresent(destination_cell, destination_cell_id, Core.WALL_FLAG_FRONT) && destination_z > (wall_front_z - radius))
		{
			return false;
		}

		// Check left
		if(Collision.IsWallPresent(destination_cell, destination_cell_id, Core.WALL_FLAG_LEFT) && destination_x < (wall_left_x + radius))
		{
			return false;
		}

		return true;
	}
}