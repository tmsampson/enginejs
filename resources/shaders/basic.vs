precision highp float;

// -----------------------------------------------------------------------------
// Per-vertex input
attribute vec3 a_pos;

#ifdef ENGINEJS_ENABLE_UV_COORDS
attribute vec2 a_uv;
#endif

#ifdef ENGINEJS_ENABLE_NORMALS
attribute vec3 a_normal;
#endif

// -----------------------------------------------------------------------------
// Per-draw input
#ifdef ENGINEJS_ENABLE_TRANSFORM
uniform mat4 u_trans_model;
uniform mat4 u_trans_view;
uniform mat4 u_trans_view_inverse;
uniform mat4 u_trans_proj;
#endif

#ifdef ENGINEJS_ENABLE_NORMALS
uniform mat3 u_trans_normal;
#endif

// -----------------------------------------------------------------------------
// Per-vertex output
#ifdef ENGINEJS_ENABLE_TRANSFORM
varying vec4 v_world_pos;
#endif

#ifdef ENGINEJS_ENABLE_UV_COORDS
varying vec2 v_uv;
#endif

#ifdef ENGINEJS_ENABLE_NORMALS
varying vec3 v_normal;
#endif

// -----------------------------------------------------------------------------
// Main routine
void main(void)
{
	// Transform point?
	#ifdef ENGINEJS_ENABLE_TRANSFORM
	v_world_pos = u_trans_model * vec4(a_pos, 1.0);
	gl_Position = u_trans_proj * u_trans_view * v_world_pos;
	#else
	gl_Position = vec4(a_pos, 1.0);
	#endif

	// Pass-through UV co-ordinates?
	#ifdef ENGINEJS_ENABLE_UV_COORDS
	v_uv = a_uv;
	#ifdef FLIP_Y
	v_uv.y = 1.0 - v_uv.y;
	#endif
	#endif

	// Transform normal?
	#ifdef ENGINEJS_ENABLE_NORMALS
	v_normal = u_trans_normal * a_normal;
	#endif
}