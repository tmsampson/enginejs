precision mediump float;

// Input
varying vec2 v_uv;
uniform sampler2D u_tx0;
uniform vec3 u_anim_config; // x = rows, y = cols, z = frame
uniform vec4 u_tint;        // alpha in w

void main(void)
{
	float tile_col = mod(u_anim_config.z, u_anim_config.x);
	float tile_row = floor(u_anim_config.z / u_anim_config.y);

	vec2 uv_scale  = 1.0 / u_anim_config.xy;
	vec2 uv_offset = vec2(tile_col, tile_row) * uv_scale;
	vec2 uv = v_uv.xy * uv_scale + uv_offset;

	#ifdef FLIP_Y
		uv.y = 1.0 - uv.y;
	#endif

	gl_FragColor = texture2D(u_tx0, uv) * u_tint;
}