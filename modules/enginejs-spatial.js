// *******************************************
//# sourceURL=modules/enginejs-spatial.js
// *******************************************
Engine.Spatial =
{
	// ==========================================================================================================
	// ==========================================================================================================
	//  Type : QuadTree
	// ==========================================================================================================
	// ==========================================================================================================
	QuadTree : function(min, max, max_items_per_node, max_node_count)
	{
		// ------------------------------------------------------------------------------------------------------
		// Global constants
		this.DEFAULT_WORLD_MIN = [-10000000, -10000000];
		this.DEFAULT_WORLD_MAX = [ 10000000,  10000000];
		this.DEFAULT_MAX_NODE_COUNT = 5000;
		this.DEFAULT_MAX_ITEMS_PER_NODE = 4;

		// ------------------------------------------------------------------------------------------------------
		// Set tree properties
		this.world_min = min || this.DEFAULT_WORLD_MIN;
		this.world_max = max || this.DEFAULT_WORLD_MAX;
		this.max_node_count = max_node_count || this.DEFAULT_MAX_NODE_COUNT;
		this.max_items_per_node = max_items_per_node || this.DEFAULT_MAX_ITEMS_PER_NODE;

		// ------------------------------------------------------------------------------------------------------
		// Pre-allocate tree nodes
		this.nodes = []; this.free_node_idx = 0;
		for(var i = 0; i < this.max_node_count; ++i)
		{
			this.nodes[i] = new Engine.Spatial.QuadTreeNode(null, this.world_min, this.world_max, this);
		}

		// ------------------------------------------------------------------------------------------------------
		// Internal node management functions
		this.CreateNode = function(parent, min, max)
		{
			// Do we have a node available?
			if(this.free_node_idx >= this.max_node_count)
			{
				Engine.LogError("Quadtree ran out of nodes, consider increasing the maximum node count");
				return null;
			}

			// Grab a free node
			var available_node = this.nodes[this.free_node_idx++];

			// Set node attributes
			available_node.parent = parent;
			available_node.min = min;
			available_node.max = max;
			return available_node;
		};

		// ------------------------------------------------------------------------------------------------------
		// Public node management functions
		this.Add = function(item, min, max)
		{
			this.root.Add(item, min, max);
		};

		this.Search = function(min, max)
		{
			return this.root.Search(min, max);
		};

		this.Clear = function()
		{
			// Mark all nodes as re-usable
			this.free_node_idx = 0;
			for(var i = 0; i < this.max_node_count; ++i)
			{
				this.nodes[i].items = [];
				this.nodes[i].child_nodes = [];
			}

			// Reset root node
			this.root = this.CreateNode(null, this.world_min, this.world_max);

			// Reset debug stats
			this.dbg_subdivide_count = 0;
		};
		this.Clear(); // Clear on initialisation

		// ------------------------------------------------------------------------------------------------------
		// Debug tracking
		this.dbg_subdivide_count = 0;
		this.GetDebugInfo = function()
		{
			return { subdivide_count : this.dbg_subdivide_count };
		};

		// ------------------------------------------------------------------------------------------------------
		// Debug rendering
		this.DebugRender = function()
		{
			var debug_render_node = function(node)
			{
				if(node.child_nodes.length)
				{
					var node_width  = node.max[0] - node.min[0];
					var node_height = node.max[1] - node.min[1];
					Engine.Debug.DrawLine([node.min[0], node.min[1] + (node_height/2)],
					                      [node.max[0], node.min[1] + (node_height/2)], Engine.Colour.Blue, 1);
					Engine.Debug.DrawLine([node.min[0] + (node_width/2), node.min[1]],
					                      [node.min[0] + (node_width/2), node.max[1]], Engine.Colour.Blue, 1);
				}

				for(var i = 0; i < node.child_nodes.length; ++i)
				{
					debug_render_node(node.child_nodes[i]);
				}
			};
			debug_render_node(this.root);
		};
	},

	// ==========================================================================================================
	// ==========================================================================================================
	//  Type : QuadTreeNode
	// ==========================================================================================================
	// ==========================================================================================================
	QuadTreeNode : function(parent, min, max, tree)
	{
		// ------------------------------------------------------------------------------------------------------
		// Set node properties
		this.tree = tree;     // Owner tree
		this.parent = parent; // Parent-node
		this.min = min; this.max = max;

		// ------------------------------------------------------------------------------------------------------
		// Node contents
		this.items       = [];

		// ------------------------------------------------------------------------------------------------------
		// Node heirarchy
		this.child_nodes = [];

		// ------------------------------------------------------------------------------------------------------
		// Public add / Search functions
		this.Add = function(item)
		{
			// Do I need to split?
			if(!this.HasChildNodes() && this.IsFull())
			{
				this.Split();
			}

			// Can we add to a child node?
			if(this.HasChildNodes() && this.TryAddToChild(item))
			{
				return;
			}

			// Couldn't fit the item completely into any child nodes so store in this node instead
			this.Insert(item);
		};

		this.Search = function(min, max)
		{
			// Add all items from this node
			var results = [];
			for(var i = 0; i < this.items.length; ++i)
			{
				results.push(this.items[i].data);
			}

			// Gather items from child nodes
			if(this.HasChildNodes())
			{
				// Look for a suitable child node
				for(var i = 0; i < this.child_nodes.length; ++i)
				{
					var child_node = this.child_nodes[i];
					if(child_node.FullyContainsRegion({min : min, max : max}))
					{
						results = results.concat(child_node.Search(min, max));
						return results;
					}
				}

				// If no child node fully contained the search region, we need to
				// drill down into each child node
				for(var i = 0; i < this.child_nodes.length; ++i)
				{
					results = results.concat(this.child_nodes[i].Search(min, max));
				}
			}

			return results;
		};

		// ------------------------------------------------------------------------------------------------------
		// Internal item / child management functions
		this.Insert = function(item)
		{
			// All items held in this node have a back-pointer to the qtree node
			item.qtree_node = this;

			// Add item
			this.items.push(item);
		};

		this.TryAddToChild = function(item)
		{
			// Look for a suitable child node
			for(var i = 0; i < this.child_nodes.length; ++i)
			{
				var child_node = this.child_nodes[i];
				if(child_node.FullyContainsRegion(item))
				{
					child_node.Add(item);
					return true;
				}
			}

			return false;
		};

		this.Split = function()
		{
			++this.dbg_subdivide_count;

			var min = this.min;
			var max = this.max;

			var child_width  = (max[0] - min[0]) / 2;
			var child_height = (max[1] - min[1]) / 2;

			// Setup child nodes
			this.child_nodes.push(tree.CreateNode(this, min, [min[0] + child_width, min[1] + child_height])); // BL
			this.child_nodes.push(tree.CreateNode(this, [min[0] + child_width, min[1]], [max[0], min[1] + child_height])); // BR
			this.child_nodes.push(tree.CreateNode(this, [min[0], min[1] + child_height], [min[0] + child_width, max[1]])); // TL
			this.child_nodes.push(tree.CreateNode(this, [min[0] + child_width, min[1] + child_height], max)); // TR

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

		// ------------------------------------------------------------------------------------------------------
		// Helper functions
		this.HasChildNodes = function()
		{
			return (this.child_nodes.length != 0);
		};

		this.IsFull = function()
		{
			return (this.items.length == this.tree.max_items_per_node);
		};

		this.FullyContainsRegion = function(item)
		{
			if(item.min[0] < this.min[0] || item.min[1] < this.min[1])
				return false;
			if(item.max[0] > this.max[0] || item.max[1] > this.max[1])
				return false;
			return true;
		};
	}
};