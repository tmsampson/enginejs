precision highp float;

// Vertex input
varying vec4 v_world_pos;
varying vec2 v_uv;
varying vec3 v_world_normal;

// Camera
uniform vec3 u_cam_pos;

// Global lighting
uniform vec3 u_sun_ambient;
uniform vec3 u_sun_diffuse;
uniform vec3 u_sun_phong;
uniform vec3 u_sun_dir; // normalised

// Material properties
uniform vec4 u_material_colour;
uniform float u_material_shininess;
uniform sampler2D u_material_tx_albedo;

void main(void)
{
	// Ambient term
	vec4 material_albedo = texture2D(u_material_tx_albedo, v_uv.xy) * u_material_colour;
	vec4 ambient = material_albedo * vec4(u_sun_ambient, 1.0);

	// Diffuse term
	vec4 diffuse = material_albedo * vec4(u_sun_diffuse, 1.0) * max(0.0, dot(v_world_normal, -u_sun_dir));

	// Phong term
	vec3 reflected_ray = reflect(u_sun_dir, v_world_normal); // reflect light about surface normal
	vec3 to_cam = u_cam_pos - v_world_pos.xyz;
	float cam_dot = max(dot(normalize(reflected_ray), normalize(to_cam)), 0.0);
	vec4 phong = material_albedo * clamp(vec4(u_sun_phong, 1.0) * pow(cam_dot, 0.3 * u_material_shininess), 0.0, 1.0);
	gl_FragColor = ambient + diffuse + phong;
}