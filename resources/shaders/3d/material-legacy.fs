precision highp float;

// Vertex input
varying vec4 v_world_pos;
varying vec2 v_uv;
varying vec3 v_world_normal;
varying vec3 v_world_tangent;

// Camera
uniform vec3 u_cam_pos;

// Global lighting
uniform vec3 u_sun_ambient;
uniform vec3 u_sun_diffuse;
uniform vec3 u_sun_specular;
uniform vec3 u_sun_dir; // normalised

// Material properties
uniform vec4 u_material_colour;
uniform vec4 u_material_specular;
uniform float u_material_shininess;
uniform float u_material_normal_strength;

// Material samplers
uniform sampler2D u_material_tx_albedo;

#ifdef USE_NORMAL_MAP
uniform sampler2D u_material_tx_normal;
#endif

void main(void)
{
	// *************************************************************************************
	// Normal
	// *************************************************************************************
#ifdef USE_NORMAL_MAP
	vec4 material_normal = texture2D(u_material_tx_normal, v_uv.xy);
	vec3 v_world_bitangent = cross(v_world_normal, v_world_tangent);

	// Calculate normal basis matrix
	mat3 normal_basis;
	normal_basis[0] = normalize(v_world_tangent);
	normal_basis[1] = normalize(v_world_bitangent);
	normal_basis[2] = normalize(v_world_normal);

	vec3 normal = normal_basis * normalize((material_normal.xyz * 2.0) - 1.0);
	
#else
	// Use vertex normals
	vec3 normal = v_world_normal;
#endif

	// Scale normal
	normal *= u_material_normal_strength;

	// *************************************************************************************
	// Ambient
	// *************************************************************************************
	vec4 material_albedo = texture2D(u_material_tx_albedo, v_uv.xy) * u_material_colour;
	vec4 ambient = material_albedo * vec4(u_sun_ambient, 1.0);

	// *************************************************************************************
	// Diffuse
	// *************************************************************************************
#ifdef USE_DIFFUSE
	vec4 diffuse = material_albedo * vec4(u_sun_diffuse, 1.0) * max(0.0, dot(normal, -u_sun_dir));
#else
	vec4 diffuse = vec4(0.0);
#endif

	// *************************************************************************************
	// Speular
	// *************************************************************************************
	vec4 specular = vec4(0.0);
#ifdef USE_SPECULAR
	if(dot(u_sun_dir, normal) < 0.0)
	{
		vec3 reflected_ray = normalize(reflect(u_sun_dir, normal)); // reflect light about surface normal
		vec3 to_cam = normalize(u_cam_pos - v_world_pos.xyz);
		float cam_dot = max(0.0, dot(reflected_ray, to_cam));
		specular = material_albedo * u_material_specular * clamp(vec4(u_sun_specular, 1.0) * pow(cam_dot, u_material_shininess * 128.0), 0.0, 1.0);
	}
#endif

	// Composite
	gl_FragColor = ambient + diffuse + specular;
}