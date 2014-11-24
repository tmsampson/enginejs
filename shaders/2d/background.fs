precision mediump float;
#define MAX_LAYERS 7

// Input
varying vec2 v_uv;

// Background data
uniform vec2 u_scroll;
uniform vec4 u_background_color;

// Layer data
uniform sampler2D u_layer_tx[MAX_LAYERS]; // Layer samplers
uniform float u_layer_depth[MAX_LAYERS];  // Layer depths (0 = front)
uniform vec4 u_layer_config[MAX_LAYERS];  // Layer config (xy = scale, zw = offset)

vec2 get_layer_uv(const vec2 uv, const vec4 layer_config, float layer_depth)
{
	// Apply scale + offset
	vec2 result = (uv * layer_config.xy) + layer_config.zw;

	// Flip-y
	result = vec2(result.x, 1.0 - layer_config.y + result.y);

	// Apply scroll
	return result + vec2(u_scroll.x * (1.0 / (layer_depth / layer_config.x)),
	                     u_scroll.y * (1.0 / (layer_depth / layer_config.y)));
}

void main(void)
{
	vec2 uv = v_uv.xy;

	// Sample layers
	vec4 layer_0_col = texture2D(u_layer_tx[0], get_layer_uv(uv, u_layer_config[0], u_layer_depth[0]));
	vec4 layer_1_col = texture2D(u_layer_tx[1], get_layer_uv(uv, u_layer_config[1], u_layer_depth[1]));
	vec4 layer_2_col = texture2D(u_layer_tx[2], get_layer_uv(uv, u_layer_config[2], u_layer_depth[2]));
	vec4 layer_3_col = texture2D(u_layer_tx[3], get_layer_uv(uv, u_layer_config[3], u_layer_depth[3]));
	vec4 layer_4_col = texture2D(u_layer_tx[4], get_layer_uv(uv, u_layer_config[4], u_layer_depth[4]));
	vec4 layer_5_col = texture2D(u_layer_tx[5], get_layer_uv(uv, u_layer_config[5], u_layer_depth[5]));
	vec4 layer_6_col = texture2D(u_layer_tx[6], get_layer_uv(uv, u_layer_config[6], u_layer_depth[6]));

	// Blend layers
	gl_FragColor = u_background_color;
	gl_FragColor = vec4(layer_6_col.a) * layer_6_col + vec4(1.0 - layer_6_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_5_col.a) * layer_5_col + vec4(1.0 - layer_5_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_4_col.a) * layer_4_col + vec4(1.0 - layer_4_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_3_col.a) * layer_3_col + vec4(1.0 - layer_3_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_2_col.a) * layer_2_col + vec4(1.0 - layer_2_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_1_col.a) * layer_1_col + vec4(1.0 - layer_1_col.a) * gl_FragColor;
	gl_FragColor = vec4(layer_0_col.a) * layer_0_col + vec4(1.0 - layer_0_col.a) * gl_FragColor;
}