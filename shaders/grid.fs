precision mediump float;

// Input
varying vec2 v_uv;

// Settings
uniform float u_repeats;
uniform vec4  u_colours[2];

void main(void)
{
	float cell_size = 1.0 / u_repeats;
	float row = floor(v_uv.y / cell_size);
	float col = floor(v_uv.x / cell_size);
	float idx = mod(row + col, 2.0);
	gl_FragColor = mix(u_colours[0], u_colours[1], idx);
}