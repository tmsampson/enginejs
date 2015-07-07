precision highp float;

// Input
varying vec2 v_uv;
uniform sampler2D u_tx0;

// Anim configuration
//	x = horizontal tile count
//	y = vertical tile count
//	z = anim frame
uniform vec3 u_anim_config;

void main(void)
{
	vec2 tile_size = vec2(1.0 / u_anim_config.x, 1.0 / u_anim_config.y);
	float tile_col = mod(u_anim_config.z, u_anim_config.x);
	float tile_row = floor(u_anim_config.z / u_anim_config.y);
	vec2 tile_uv = (v_uv.xy * tile_size) + vec2(tile_size * vec2(tile_col, tile_row));
	gl_FragColor = texture2D(u_tx0, tile_uv);
}