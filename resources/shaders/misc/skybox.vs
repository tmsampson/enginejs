precision highp float;

// -----------------------------------------------------------------------------
// Per-vertex input
attribute vec3 a_pos;

// -----------------------------------------------------------------------------
// Per-vertex output
varying vec3 v_skybox_uv;

// -----------------------------------------------------------------------------
// Uniforms
uniform mat4 u_trans_world; // scale only
uniform mat4 u_trans_view;  // excludes translation
uniform mat4 u_trans_proj;

// -----------------------------------------------------------------------------
// Main routine
void main(void)
{
	v_skybox_uv = a_pos; // pass-through

	// Transform skybox corner
	vec4 pos = u_trans_proj * u_trans_view * u_trans_world * vec4(a_pos, 1.0);
	gl_Position = pos.xyww;
}