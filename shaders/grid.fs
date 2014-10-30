precision mediump float;

// Input
varying vec2 v_uv;

// Settings
#define REPEATS 32.0
uniform vec4 u_colours[2];

void main(void)
{
	float cell_size = 1.0 / REPEATS;
	vec2 row_col = floor(v_uv / cell_size);
	float idx = mod(row_col.x + row_col.y, 2.0);
	gl_FragColor = mix(u_colours[0], u_colours[1], idx);
}