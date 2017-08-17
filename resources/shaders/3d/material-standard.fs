precision highp float;

#if PROPERTY_INFO
{
	"albedo_colour"       : { "name" : "Albedo Colour",         "default" : [1, 1, 1, 1]       },
	"albedo_map"          : { "name" : "Albedo Texture"                                        },
	"albedo_map_repeat"   : { "name" : "Albedo Texture Tiling", "default" : [1, 1]             },
	"normal_map"          : { "name" : "Normal Map"                                            },
	"normal_map_repeat"   : { "name" : "Normal Map Tiling",     "default" : [1, 1]             },
	"specular_colour"     : { "name" : "Specular Colour",       "default" : [0.5, 0.5, 0.5, 1] },
	"specular_map"        : { "name" : "Specular Map"                                          },
	"specular_map_repeat" : { "name" : "Specular Map Tiling",   "default" : [1, 1]             },
	"specular_shininess"  : { "name" : "Specular Shininess",    "default" : 0.078125           },
	"fresnel_colour"      : { "name" : "Fresnel Colour",        "default" : [1, 1, 1, 1]       },
	"fresnel_scale"       : { "name" : "Fresnel Scale",         "default" : 0.1                },
	"fresnel_bias"        : { "name" : "Fresnel Bias",          "default" : 0                  },
	"fresnel_power"       : { "name" : "Fresnel Power",         "default" : 2.5                }
}
#endif

// Vertex input
varying vec4 v_world_pos;
varying vec4 v_shadow_pos;
varying vec2 v_uv;
varying vec3 v_world_normal;
varying vec3 v_world_tangent;

// Camera
uniform vec3 u_cam_pos;

// Global lighting
uniform vec3 u_sun_ambient;
uniform vec3 u_sun_colour;
uniform vec3 u_sun_dir; // normalised

// Material properties
uniform vec4 albedo_colour;
uniform vec4 specular_colour;
uniform float specular_shininess;

#if defined(USE_FRESNEL)
uniform vec4 fresnel_colour;
uniform float fresnel_scale;
uniform float fresnel_bias;
uniform float fresnel_power;
#endif

// Material samplers
uniform sampler2D albedo_map;
uniform vec2      albedo_map_repeat;

#if defined(USE_NORMAL_MAP)
uniform sampler2D normal_map;
uniform vec2      normal_map_repeat;
#endif

#if defined(USE_SPECULAR_MAP)
uniform sampler2D specular_map;
uniform vec2      specular_map_repeat;
#endif

#if defined(USE_REFLECTION_MAP)
uniform samplerCube reflection_map;
#endif

// Shadows
#if defined(USE_SHADOWS)
uniform sampler2D u_shadow_map;
uniform vec2 u_shadow_map_size;
uniform int u_shadow_type;
uniform float u_shadow_bias;

float get_shadow_hard(vec2 shadow_map_uv, float fragment_depth)
{
	float shadow_depth = texture2D(u_shadow_map, shadow_map_uv).r;
	return step(shadow_depth + u_shadow_bias, fragment_depth);
}

float get_shadow_bilinear(vec2 shadow_map_uv, float fragment_depth)
{
	vec2 texel_size = vec2(1.0) / u_shadow_map_size;

	vec2 pixel = shadow_map_uv * u_shadow_map_size;
	vec2 pixel_tl = floor(pixel - 0.5) + 0.5;
	vec2 uv_tl = pixel_tl / u_shadow_map_size;

	float tl = get_shadow_hard(uv_tl + (texel_size * vec2(0.0, 0.0)), fragment_depth);
	float tr = get_shadow_hard(uv_tl + (texel_size * vec2(1.0, 0.0)), fragment_depth);
	float bl = get_shadow_hard(uv_tl + (texel_size * vec2(0.0, 1.0)), fragment_depth);
	float br = get_shadow_hard(uv_tl + (texel_size * vec2(1.0, 1.0)), fragment_depth);

	vec2 weight = fract(pixel + 0.5);
	float a = mix(tl, tr, weight.x);
	float b = mix(bl, br, weight.x);
	float c = mix(a, b, weight.y);
	return c;
}

float get_shadow_bilinear_4x4(vec2 shadow_map_uv, float fragment_depth)
{
	vec2 texel_size = vec2(1.0) / u_shadow_map_size;
	float sum = 0.0;
	for(float x = -1.5; x <= 1.5; x += 1.0)
	{
		for(float y = -1.5; y <= 1.5; y += 1.0)
		{
			vec2 uv = shadow_map_uv + (texel_size * vec2(x, y));
			sum += get_shadow_bilinear(uv, fragment_depth);
		}
	}
	return sum / 16.0;
}
#endif

void main(void)
{
	// *************************************************************************************
	// Normal
	// *************************************************************************************
#if defined(USE_NORMAL_MAP)
	vec4 material_normal = texture2D(normal_map, v_uv.xy * normal_map_repeat);
	vec3 v_world_bitangent = cross(v_world_normal, v_world_tangent);

	// Calculate normal basis matrix
	mat3 normal_basis;
	normal_basis[0] = normalize(v_world_tangent);
	normal_basis[1] = normalize(v_world_bitangent);
	normal_basis[2] = normalize(v_world_normal);

	vec3 normal = normal_basis * normalize((material_normal.xyz * 2.0) - 1.0);
#else
	// Use vertex normals
	vec3 normal = normalize(v_world_normal);
#endif

	// *************************************************************************************
	// Ambient
	// *************************************************************************************
	vec4 material_albedo = texture2D(albedo_map, v_uv.xy * albedo_map_repeat) * albedo_colour;
	vec4 ambient = material_albedo * vec4(u_sun_ambient, 1.0);

	// *************************************************************************************
	// Diffuse
	// *************************************************************************************
#if defined(USE_DIFFUSE)
	float n_dot_l = max(0.0, dot(normal, -u_sun_dir));
	vec4 diffuse = material_albedo * vec4(u_sun_colour, 1.0) * n_dot_l;
#else
	vec4 diffuse = vec4(0.0);
#endif

	// *************************************************************************************
	// Speular
	// *************************************************************************************
	vec4 specular = vec4(0.0); // default

#if defined(USE_SPECULAR) || defined(USE_REFLECTION_MAP)
	vec3 frag_to_cam = normalize(u_cam_pos - v_world_pos.xyz);
#endif

#if defined(USE_SPECULAR)
	vec3 frag_to_light = -u_sun_dir;
	vec3 half_vector = normalize(frag_to_light + frag_to_cam);
	specular = n_dot_l * specular_colour * vec4(u_sun_colour, 1.0) * pow(max(dot(normal, half_vector), 0.0), specular_shininess);

	#if defined(USE_SPECULAR_MAP)
		vec4 specular_map = texture2D(specular_map, v_uv.xy * specular_map_repeat);
		specular *= specular_map;
	#endif
#endif

	// *************************************************************************************
	// Fresnel
	// *************************************************************************************
#if defined(USE_FRESNEL)
	vec3 to_cam = normalize(v_world_pos.xyz - u_cam_pos);
	float fresnel = fresnel_bias + fresnel_scale * pow(1.0 + dot(to_cam, normal), fresnel_power);
	fresnel = clamp(fresnel, 0.0, 1.0);
#else
	vec4 fresnel_colour = vec4(0, 0, 0, 0);
	float fresnel = 0.0;
#endif

	// *************************************************************************************
	// Reflection
	// *************************************************************************************
#if defined(USE_REFLECTION_MAP)
	vec4 reflection_map_sample = textureCube(reflection_map, reflect(-frag_to_cam, normal));
	//gl_FragColor = reflection_map_sample; return;
#endif

	// Composite
	gl_FragColor = mix(ambient + diffuse + specular, fresnel_colour, fresnel);

	// Contribute shadows?
#if defined(USE_SHADOWS)
	vec2 shadow_map_uv = v_shadow_pos.xy;
	float fragment_depth = v_shadow_pos.z;

	float shadow = 0.0;
	if(u_shadow_type == 0)
	{
		shadow = get_shadow_hard(shadow_map_uv, fragment_depth);
	}
	else if(u_shadow_type == 1)
	{
		shadow = get_shadow_bilinear(shadow_map_uv, fragment_depth);
	}
	else if(u_shadow_type == 2)
	{
		shadow = get_shadow_bilinear_4x4(shadow_map_uv, fragment_depth);
	}

	gl_FragColor *= mix(1.0, 0.4, shadow);
#endif
}