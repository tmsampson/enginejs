precision mediump float;

// Input
attribute vec3 a_pos;
attribute vec2 a_uv;

// Transform
uniform mat4 u_trans_model;
uniform mat4 u_trans_proj;

// Output
varying vec2 v_uv;

void main(void)
{
	gl_Position = u_trans_proj * u_trans_model * vec4(a_pos, 1.0);
	v_uv = a_uv;

#ifdef FLIP_Y
	v_uv.y = 1.0 - v_uv.y;
#endif
}