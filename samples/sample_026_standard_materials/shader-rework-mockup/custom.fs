precision highp float;

#if PROPERTY_INFO
{
	"u_wave_1_contribution" : { "name" : "Wave 1 Contribution", "default" : 1 , "min" : 0, "max" : 1, "step" : 0.1 },
	"u_wave_1_thickness"    : { "name" : "Wave 1 Thickness", "default" : 0.9 , "min" : 0, "max" : 10, "step" : 0.5 },
	"u_wave_1_speed"        : { "name" : "Wave 1 Speed", "default" : 2.5 , "min" : 0, "max" : 10, "step" : 0.5     },

	"u_wave_2_contribution" : { "name" : "Wave 2 Contribution", "default" : 1 , "min" : 0, "max" : 1, "step" : 0.1 },
	"u_wave_2_thickness"    : { "name" : "Wave 2 Thickness", "default" : 10 , "min" : 0, "max" : 100, "step" : 1   },
	"u_wave_2_speed"        : { "name" : "Wave 2 Speed", "default" : 3 , "min" : 0.5, "max" : 10, "step" : 0.5     },
	"u_wave_2_angle"        : { "name" : "Wave 2 Angle", "default" : 2 , "min" : 0.5, "max" : 10, "step" : 0.5     },

	"u_wave_3_contribution" : { "name" : "Wave 3 Contribution", "default" : 1 , "min" : 0, "max" : 1, "step" : 0.1 },
	"u_wave_3_thickness"    : { "name" : "Wave 3 Thickness", "default" : 100 , "min" : 0, "max" : 600, "step" : 5  },
	"u_wave_3_speed"        : { "name" : "Wave 3 Speed", "default" : 0.5 , "min" : 0, "max" : 10, "step" : 0.5     },
	"u_wave_3_angle"        : { "name" : "Wave 3 Angle", "default" : 0.5 , "min" : 0, "max" : 10, "step" : 0.5     },
	"u_wave_3_shift_1"      : { "name" : "Wave 3 Shift 1", "default" : 3 , "min" : 0.5, "max" : 10, "step" : 0.5   },
	"u_wave_3_shift_2"      : { "name" : "Wave 3 Shift 2", "default" : 2 , "min" : 0.5, "max" : 10, "step" : 0.5   },
	"u_wave_3_pulse"        : { "name" : "Wave 3 Pulse", "default" : 2 , "min" : 0, "max" : 10, "step" : 0.5       }
}
#endif

// Helpers
#define PI 3.1415926535897932384626433832795
float normalise(float x) { return (1.0 + x) / 2.0; }

// Input
varying vec2 v_uv;
uniform float u_time;

// Params
uniform float u_wave_1_contribution;
uniform float u_wave_1_thickness;
uniform float u_wave_1_speed;
uniform float u_wave_2_contribution;
uniform float u_wave_2_thickness;
uniform float u_wave_2_speed;
uniform float u_wave_2_angle;
uniform float u_wave_3_contribution;
uniform float u_wave_3_thickness;
uniform float u_wave_3_speed;
uniform float u_wave_3_angle;
uniform float u_wave_3_shift_1;
uniform float u_wave_3_shift_2;
uniform float u_wave_3_pulse;

void main(void)
{
	// Wave 1 **********************************************************************************************************************
	float wave_1 = normalise(sin(v_uv.x * (1.0 - u_wave1_thickness) * 100.0 + (u_time * u_wave_1_speed)));
	wave_1 *= u_wave_1_contribution;

	// Wave 2 **********************************************************************************************************************
	float wave_2 = normalise(sin(u_wave_2_thickness * (v_uv.x * sin(u_time / u_wave_2_angle) + v_uv.y * cos(u_time / u_wave_2_speed)) + u_time));
	wave_2 *= u_wave_2_contribution;

	// Wave 3 **********************************************************************************************************************
	float cx = v_uv.x + u_wave_3_angle * sin(u_time / u_wave_3_shift_1);
	float cy = v_uv.y + u_wave_3_speed * sin(u_time / u_wave_3_shift_2);
	float wave_3 = normalise(sin(sqrt(u_wave_3_thickness * (pow(cx, 2.0) + pow(cy, 2.0)) + 1.0 + (u_time * u_wave_3_pulse))));
	wave_3 *= u_wave_3_contribution;

	// Wave sum **********************************************************************************************************************
	float sum = wave_3 + wave_2 + wave_1;

	// Final colour
	float r = 1.0;
	float g = normalise(cos((sum * PI)));
	float b = normalise(sin((sum * PI)));
	gl_FragColor = vec4(r, g, b, 1.0);
}