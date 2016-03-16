precision highp float;

// Input
varying vec3 v_world_normal;
varying vec2 v_uv;
varying vec4 v_world_pos;
uniform sampler2D u_tx0;
uniform vec3 u_light;
uniform mat4 u_trans_view;

float attenuation(float r, float f, float d)
{
	return pow(max(0.0, 1.0 - (d / r)), f + 1.0);
}

void main(void)
{
	vec3 to_light = u_light - v_world_pos.xyz;
	float to_light_dist = length(to_light);

	float dot = max(0.0, dot(v_world_normal, normalize(to_light)));
	float ambient = 0.2;
	float diffuse = dot * attenuation(10.0, 0.0, to_light_dist);

	vec4 tex = texture2D(u_tx0, v_uv.xy);
	gl_FragColor = (tex * ambient) + (tex * diffuse);
}