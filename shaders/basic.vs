precision mediump float;

// Input
attribute vec3 vs_in_pos;
attribute vec2 vs_in_uv;

// Output
varying vec2 vs_out_uv;

void main(void)
{
	gl_Position = vec4(vs_in_pos, 1.0);
	vs_out_uv = vs_in_uv;

#ifdef FLIP_Y
	vs_out_uv.y = 1.0 - vs_out_uv.y;
#endif
}