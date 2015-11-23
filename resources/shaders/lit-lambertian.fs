precision highp float;

// Input
varying vec3 v_normal;
varying vec2 v_uv;
varying vec4 v_world_pos;
uniform sampler2D u_tx0;
uniform vec3 u_light;
uniform mat3 u_view_inverse;

float attenuation(float r, float f, float d)
{
	return pow(max(0.0, 1.0 - (d / r)), f + 1.0);
}

void main(void)
{
	vec2 uv = v_uv.xy;

	vec3 to_light = normalize(u_light - v_world_pos.xyz);
	to_light = u_view_inverse * to_light; // u_view_inverse * to_light;

	float dot = max(0.0, dot(normalize(v_normal), normalize(to_light))) * attenuation(25.0, 0.5, length(u_light - v_world_pos.xyz));
	vec4 tex = texture2D(u_tx0, uv);
	gl_FragColor = (tex * 0.2) + (tex * (max(0.0, dot) * vec4(1.0, 0.0, 0.0, 1.0)));
	//gl_FragColor = abs(normalize(vec4(dot,dot,dot, 1.0)));
}