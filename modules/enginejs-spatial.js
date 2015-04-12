// *******************************************
//# sourceURL=modules/enginejs-quadtree.js
// *******************************************
var g_stat_splits = 0;

Engine.Spatial =
{
	QuadTree : function(min, max, max_items_per_node)
	{
		this.min = min || [-10000000, -10000000];
		this.max = max || [ 10000000,  10000000];
		this.max_items_per_node = max_items_per_node || 4;

		this.Init = function()
		{
			// Setup default state
			this.root = new Engine.Spatial.QuadTreeNode(this.min, this.max, this.max_items_per_node);
		};
		this.Init();

		this.Clear = function()
		{
			g_stat_splits = 0;
			this.Init(); // Clears all nodes
		};

		this.Add = function(item, min, max)
		{
			this.root.Add(item, min, max);
		};

		this.Query = function(min, max)
		{
		};

		this.DebugRender = function()
		{
			var debug_render_node = function(node)
			{
				if(node.children.length)
				{
					var node_width  = node.max[0] - node.min[0];
					var node_height = node.max[1] - node.min[1];
					Engine.Debug.DrawLine([node.min[0], node.min[1] + (node_height/2)],
					                      [node.max[0], node.min[1] + (node_height/2)], Engine.Colour.Blue, 1);
					Engine.Debug.DrawLine([node.min[0] + (node_width/2), node.min[1]],
					                      [node.min[0] + (node_width/2), node.max[1]], Engine.Colour.Blue, 1);
				}

				for(var i = 0; i < node.children.length; ++i)
				{
					debug_render_node(node.children[i]);
				}
			};
			debug_render_node(this.root);
		};
	},

	QuadTreeNode : function(min, max, max_items)
	{
		this.min = min; this.max = max;
		this.max_items = max_items;
		this.items = [];
		this.children = [];

		this.Add = function(item)
		{
			// Do I need to split?
			if((this.children.length == 0) && this.items.length == (this.max_items-1))
			{
				this.Split();
			}

			// Do I have child nodes?
			if(this.children.length == 0)
			{
				this.items.push(item); // Insert into this node
			}
			else
			{
				this.AddToChildren(item);
			}
		}

		this.AddToChildren = function(item)
		{
			// Look for a suitable child node
			for(var i = 0; i < this.children.length; ++i)
			{
				var child = this.children[i];
				if(child.FullyContainsItem(item))
				{
					child.Add(item);
					return;
				}
			}

			// Looks like we couldn't find a suitable child that fully contained the
			// item. In this situation we store the item in the parent (this node), even
			// if we've surpassed max_items
			this.items.push(item);
		};

		this.Split = function()
		{
			++g_stat_splits;

			var min = this.min;
			var max = this.max;
			var child_size = [(max[0] - min[0]) / 2, (max[1] - min[1]) / 2];

			// Setup child nodes
			this.children.push(new Engine.Spatial.QuadTreeNode(min, [min[0] + child_size[0], min[1] + child_size[1]], this.max_items)); // BL
			this.children.push(new Engine.Spatial.QuadTreeNode([min[0] + child_size[0], min[1]], [max[0], min[1] + child_size[1]], this.max_items)); // BR
			this.children.push(new Engine.Spatial.QuadTreeNode([min[0], min[1] + child_size[1]], [min[0] + child_size[0], max[1]], this.max_items)); // TL
			this.children.push(new Engine.Spatial.QuadTreeNode([min[0] + child_size[0], min[1] + child_size[1]], max, this.max_items)); // TR

			// Distribute items
			var items = Engine.Array.Copy(this.items);
			this.items = [];
			for(var i = 0; i < items.length; ++i)
			{
				this.AddToChildren(items[i]);
			}
		};

		this.FullyContainsItem = function(item)
		{
			if(item.min[0] < this.min[0] || item.min[1] < this.min[1])
				return false;
			if(item.max[0] > this.max[0] || item.max[1] > this.max[1])
				return false;
			return true;
		};
	}
};