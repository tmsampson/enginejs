precision highp float;

// Vertex input
varying vec2 v_uv;

// Global lighting
uniform vec3 u_sun_ambient;

// Material properties
uniform vec4 u_material_colour;
uniform sampler2D u_material_tx_albedo;

void main(void)
{
	// Ambient term
	vec4 material_albedo = texture2D(u_material_tx_albedo, v_uv.xy) * u_material_colour;
	gl_FragColor = material_albedo * vec4(u_sun_ambient, 1.0);
}