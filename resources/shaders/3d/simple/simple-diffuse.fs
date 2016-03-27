precision highp float;

// Vertex input
varying vec2 v_uv;
varying vec3 v_world_normal;

// Global lighting
uniform vec3 u_sun_ambient;
uniform vec3 u_sun_diffuse;
uniform vec3 u_sun_dir;

// Material properties
uniform vec4 u_material_colour;
uniform sampler2D u_material_tx_albedo;

void main(void)
{
	// Ambient term
	vec4 material_albedo = texture2D(u_material_tx_albedo, v_uv.xy) * u_material_colour;
	vec4 ambient = material_albedo * vec4(u_sun_ambient, 1.0);

	// Diffuse term
	vec4 diffuse = material_albedo * vec4(u_sun_diffuse, 1.0) * max(0.0, dot(v_world_normal, -normalize(u_sun_dir)));
	gl_FragColor = ambient + diffuse;
}