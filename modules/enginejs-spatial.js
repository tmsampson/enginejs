// *******************************************
//# sourceURL=modules/enginejs-spatial.js
// *******************************************
Engine.Spatial =
{
	QuadTree : function(min, max, max_items_per_node)
	{
		this.min = min || [-10000000, -10000000];
		this.max = max || [ 10000000,  10000000];
		this.max_items_per_node = max_items_per_node || 4;
		this.subdivide_count = 0;
		this.nodes = [];
		this.FREE_NODE = 0;

		this.MAKE_NODE = function(parent, min, max)
		{
			var available = this.nodes[this.FREE_NODE++];
			available.parent = parent;
			available.min = min;
			available.max = max;
			return available;
		}

		this.Init = function()
		{
			// Setup default state
			this.root = this.MAKE_NODE(null, this.min, this.max);
		};

		// Pre-allocate
		for(var i = 0; i < 10000; ++i)
		{
			this.nodes[i] = new Engine.Spatial.QuadTreeNode(null, 0, 0, this.max_items_per_node, this);
		}
		this.Init();

		this.Clear = function()
		{
			this.FREE_NODE = 0;
			this.subdivide_count = 0;
			for(var i = 0; i < 10000; ++i)
			{
				this.nodes[i].items = [];
				this.nodes[i].children = [];
			}
			this.Init();
		};

		this.Add = function(item, min, max)
		{
			this.root.Add(item, min, max);
		};

		this.Retrieve = function(min, max)
		{
			return this.root.Retrieve(min, max);
		};

		this.GetSubdivideCount = function()
		{
			return this.subdivide_count;
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

	QuadTreeNode : function(parent, min, max, max_items, tree)
	{
		this.parent = parent;
		this.min = min; this.max = max;
		this.max_items = max_items;
		this.items = [];
		this.children = [];
		this.tree = tree;

		this.HasChildren = function()
		{
			return (this.children.length != 0);
		};

		this.IsFull = function()
		{
			return (this.items.length == this.max_items);
		};

		this.Add = function(item)
		{
			// Do I need to split?
			if(!this.HasChildren() && this.IsFull())
			{
				this.Split();
			}

			// Can we add to a child node?
			if(this.HasChildren() && this.TryAddToChild(item))
			{
				return;
			}

			// No children or item is not contained fully in child, store in this node
			this.Insert(item);
		};

		this.Insert = function(item)
		{
			item.qtree_node = this;
			this.items.push(item);
		};

		this.TryAddToChild = function(item)
		{
			// Look for a suitable child node
			for(var i = 0; i < this.children.length; ++i)
			{
				var child = this.children[i];
				if(child.FullyContainsItem(item))
				{
					child.Add(item);
					return true;
				}
			}

			return false;
		};

		this.Split = function()
		{
			++this.subdivide_count;

			var min = this.min;
			var max = this.max;
			var child_size = [(max[0] - min[0]) / 2, (max[1] - min[1]) / 2];

			// Setup child nodes
			this.children.push(tree.MAKE_NODE(this, min, [min[0] + child_size[0], min[1] + child_size[1]])); // BL
			this.children.push(tree.MAKE_NODE(this, [min[0] + child_size[0], min[1]], [max[0], min[1] + child_size[1]])); // BR
			this.children.push(tree.MAKE_NODE(this, [min[0], min[1] + child_size[1]], [min[0] + child_size[0], max[1]])); // TL
			this.children.push(tree.MAKE_NODE(this, [min[0] + child_size[0], min[1] + child_size[1]], max)); // TR

			// Distribute items
			var items = Engine.Array.Copy(this.items);
			this.items = [];
			for(var i = 0; i < items.length; ++i)
			{
				if(!this.TryAddToChild(items[i]))
				{
					this.Insert(items[i]);
				}
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

		this.Retrieve = function(min, max)
		{
			// Add items from this node
			var results = [];
			for(var i = 0; i < this.items.length; ++i)
			{
				results.push(this.items[i].data);
			}

			if(this.HasChildren())
			{
				// Look for a suitable child node
				for(var i = 0; i < this.children.length; ++i)
				{
					var child = this.children[i];
					if(child.FullyContainsItem({min : min, max : max}))
					{
						results = results.concat(child.Retrieve(min, max));
						return results;
					}
				}

				for(var i = 0; i < this.children.length; ++i)
				{
					results = results.concat(this.children[i].Retrieve(min, max));
				}
			}

			return results;
		};
	}
};