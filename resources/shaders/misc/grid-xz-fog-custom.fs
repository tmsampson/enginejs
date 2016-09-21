precision highp float;

#if PROPERTY_INFO
{
	"col_one"   : { "name" : "Colour 1", "default" : [1, 1, 1, 0] },
	"col_two"   : { "name" : "Colour 2", "default" : [0.75, 0.75, 0.75, 0] },
	"tile_size" : { "name" : "Tile Size", "default" : 2.0 }
}
#endif

// Input
varying vec4 v_world_pos;

// Settings
uniform float tile_size;
uniform vec4 col_one;
uniform vec4 col_two;

void main(void)
{
	// Calc tile colour @ this fragment
	vec2 row_col = floor(v_world_pos.xz / tile_size);
	float idx = mod(row_col.x + row_col.y, 2.0);
	vec4 albedo = mix(col_one, col_two, idx);

	// Calc fog
	vec4 fog_colour = vec4(0.0, 0.0, 0.0, 1.0);
	float fog_amount = min(1.0, gl_FragCoord.w * 2.0);

	// Blend fog
	gl_FragColor = mix(fog_colour, albedo, fog_amount);
}