precision highp float;

#if PROPERTY_INFO
{
	"albedo_colour"       : { "name" : "Albedo Colour",         "default" : [1, 1, 1, 1]       },
	"albedo_map"          : { "name" : "Albedo Texture"                                        },
	"albedo_map_repeat"   : { "name" : "Albedo Texture Tiling", "default" : [1, 1]             },
	"normal_map"          : { "name" : "Normal Map"                                            },
	"normal_map_repeat"   : { "name" : "Normal Map Tiling",     "default" : [1, 1]             },
	"normal_strength"     : { "name" : "Normal Strength",       "default" : 1.0                },
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
uniform vec3 u_sun_colour;
uniform vec3 u_sun_dir; // normalised

// Material properties
uniform vec4 albedo_colour;
uniform vec4 specular_colour;
uniform float specular_shininess;
uniform float normal_strength;

#ifdef USE_FRESNEL
uniform vec4 fresnel_colour;
uniform float fresnel_scale;
uniform float fresnel_bias;
uniform float fresnel_power;
#endif

// Material samplers
uniform sampler2D albedo_map;
uniform vec2      albedo_map_repeat;

#ifdef USE_NORMAL_MAP
uniform sampler2D normal_map;
uniform vec2      normal_map_repeat;
#endif

#ifdef USE_SPECULAR_MAP
uniform sampler2D specular_map;
uniform vec2      specular_map_repeat;
#endif

// Shadows
#ifdef USE_SHADOWS
uniform sampler2D shadow_map;
uniform int shadow_type;

float get_shadow_hard(vec2 shadow_map_uv, float fragment_depth)
{
	float shadow_depth = texture2D(shadow_map, shadow_map_uv).r;
	return step(shadow_depth + 0.009, fragment_depth);
}

float get_shadow_bilinear(vec2 shadow_map_uv, float fragment_depth)
{
	vec2 shadow_map_size = vec2(1024, 1024);
	vec2 texel_size = vec2(1.0) / shadow_map_size;
	vec2 shadow_map_uv_centroid = floor(shadow_map_uv * shadow_map_size + 0.5) / shadow_map_size;

	// Sample centre
	float c = get_shadow_hard(shadow_map_uv, fragment_depth);

	// 4 x 4 sample around pixel
	float l = get_shadow_hard(shadow_map_uv + (texel_size * vec2(-1.0, 0.0)), fragment_depth);
	float r = get_shadow_hard(shadow_map_uv + (texel_size * vec2(1.0, 0.0)), fragment_depth);
	float t = get_shadow_hard(shadow_map_uv + (texel_size * vec2(0.0, 1.0)), fragment_depth);
	float bt = get_shadow_hard(shadow_map_uv + (texel_size * vec2(0.0, -1.0)), fragment_depth);

	// Bilinear blend
	float a = mix(l, r, 0.5);
	float b = mix(t, bt, 0.5);
	return mix(mix(a, b, 0.5), c, 0.5);
}

float get_shadow_pcf(vec2 shadow_map_uv, float fragment_depth)
{
	vec2 shadow_map_size = vec2(1024, 1024);
	float result = 0.0;
	for(int x=-2; x<=2; x++)
	{
		for(int y=-2; y<=2; y++)
		{
			vec2 off = vec2(x,y) / shadow_map_size;
			result += get_shadow_hard(shadow_map_uv + off, fragment_depth);
		}
	}
	return result / 25.0;
}
#endif

void main(void)
{
	// *************************************************************************************
	// Normal
	// *************************************************************************************
#ifdef USE_NORMAL_MAP
	vec4 material_normal = texture2D(normal_map, v_uv.xy * normal_map_repeat);
	vec3 v_world_bitangent = cross(v_world_normal, v_world_tangent);

	// Calculate normal basis matrix
	mat3 normal_basis;
	normal_basis[0] = normalize(v_world_tangent);
	normal_basis[1] = normalize(v_world_bitangent);
	normal_basis[2] = normalize(v_world_normal);

	vec3 normal = normal_basis * normalize((material_normal.xyz * 2.0) - 1.0);

	// Scale normal
	normal *= normal_strength;
#else
	// Use vertex normals
	vec3 normal = v_world_normal;
#endif

	// *************************************************************************************
	// Ambient
	// *************************************************************************************
	vec4 material_albedo = texture2D(albedo_map, v_uv.xy * albedo_map_repeat) * albedo_colour;
	vec4 ambient = material_albedo * vec4(u_sun_colour, 1.0);

	// *************************************************************************************
	// Diffuse
	// *************************************************************************************
#ifdef USE_DIFFUSE
	vec4 diffuse = material_albedo * vec4(u_sun_colour, 1.0) * max(0.0, dot(normal, -u_sun_dir));
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
		specular = specular_colour * clamp(vec4(u_sun_colour, 1.0) * pow(cam_dot, specular_shininess * 128.0), 0.0, 1.0);
	}

	#ifdef USE_SPECULAR_MAP
	vec4 specular_map = texture2D(specular_map, v_uv.xy * specular_map_repeat);
	specular *= specular_map;
	#endif
#endif

	// *************************************************************************************
	// Fresnel
	// *************************************************************************************
#ifdef USE_FRESNEL
	vec3 to_cam = normalize(v_world_pos.xyz - u_cam_pos);
	float fresnel = fresnel_bias + fresnel_scale * pow(1.0 + dot(to_cam, normal), fresnel_power);
	fresnel = clamp(fresnel, 0.0, 1.0);
#else
	vec4 fresnel_colour = vec4(0, 0, 0, 0);
	float fresnel = 0.0;
#endif

	// Composite
	gl_FragColor = mix(ambient + diffuse + specular, fresnel_colour, fresnel);

	#ifdef USE_SHADOWS

	// Calculate projected shadow position (xy = screen space, z = depth)
	vec3 shadow_pos = v_shadow_pos.xyz / v_shadow_pos.w; // perspective divide
	shadow_pos = shadow_pos * 0.5 + 0.5; // [-1..1] --> [0..1]

	// Contribute shadows
	vec2 shadow_map_uv = shadow_pos.xy;
	float fragment_depth = shadow_pos.z;

	float shadow = 0.0;
	if(shadow_type == 0)
	{
		shadow = get_shadow_hard(shadow_map_uv, fragment_depth);
	}
	else if(shadow_type == 1)
	{
		shadow = get_shadow_bilinear(shadow_map_uv, fragment_depth);
	}
	else if(shadow_type == 2)
	{
		shadow = get_shadow_pcf(shadow_map_uv, fragment_depth);
	}

	gl_FragColor *= mix(1.0, 0.4, shadow);
	#endif
}