precision highp float;

// -----------------------------------------------------------------------------
// Per-vertex input
attribute vec3 a_pos;

#if defined(ENGINEJS_ENABLE_UV_COORDS)
attribute vec2 a_uv;
#endif

#if defined(ENGINEJS_ENABLE_NORMALS)
attribute vec3 a_normal;
#endif

#if defined(ENGINEJS_ENABLE_TANGENTS)
attribute vec3 a_tangent;
#endif

// -----------------------------------------------------------------------------
// Per-draw input
#if defined(ENGINEJS_ENABLE_TRANSFORM)
uniform vec3 u_cam_pos;
uniform mat4 u_trans_world;
uniform mat4 u_trans_view;
uniform mat4 u_trans_view_inverse;
uniform mat4 u_trans_proj;

	#if defined(USE_SHADOWS)
	uniform mat4 u_trans_shadow;
	#endif

#endif

uniform float u_time;

#if defined(ENGINEJS_ENABLE_TANGENTS)
uniform mat3 u_trans_tangent;
#endif

// -----------------------------------------------------------------------------
// Per-vertex output
#if defined(ENGINEJS_ENABLE_TRANSFORM)
varying vec4 v_world_pos;

	#if defined(USE_SHADOWS)
	varying vec4 v_shadow_pos;
	#endif

#endif

#if defined(ENGINEJS_ENABLE_UV_COORDS)
varying vec2 v_uv;
#endif

#if defined(ENGINEJS_ENABLE_NORMALS)
varying vec3 v_world_normal;
#endif

#if defined(ENGINEJS_ENABLE_TANGENTS)
varying vec3 v_world_tangent;
#endif


// -----------------------------------------------------------------------------
// Main routine
void main(void)
{
	// Transform position from model-->world space?
	#if defined(ENGINEJS_ENABLE_TRANSFORM)
	v_world_pos = u_trans_world * vec4(a_pos, 1.0);
	gl_Position = u_trans_proj * u_trans_view * v_world_pos;

		#if defined(USE_SHADOWS)
		v_shadow_pos = u_trans_shadow * v_world_pos;
		v_shadow_pos.xyz /= v_shadow_pos.w; // perspective divide
		v_shadow_pos = v_shadow_pos * 0.5 + 0.5; // [-1..1] --> [0..1]
		#endif

	#else

	gl_Position = vec4(a_pos, 1.0);
	#endif

	// Transform normal from model --> world space?
	#if defined(ENGINEJS_ENABLE_NORMALS)
	mat3 normal_world_mtx = mat3(u_trans_world); // mat3 = rotation only
	v_world_normal = normalize(normal_world_mtx * a_normal);
	#endif

	#if defined(ENGINEJS_ENABLE_TANGENTS)
	mat3 tangent_world_mtx = mat3(u_trans_world); // mat3 = rotation only
	v_world_tangent = normalize(tangent_world_mtx * a_tangent);
	#endif

	// Pass-through UV co-ordinates?
	#if defined(ENGINEJS_ENABLE_UV_COORDS)
	v_uv = a_uv;
		#ifdef FLIP_Y
		v_uv.y = 1.0 - v_uv.y;
		#endif
	#endif
}