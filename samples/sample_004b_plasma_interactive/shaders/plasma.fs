precision highp float;

// Helpers
#define PI 3.1415926535897932384626433832795
float normalise(float x) { return (1.0 + x) / 2.0; }

// Input
varying vec2 v_uv;
uniform float u_time;

// Params
uniform float u_wave_1_contribution; // [EDITOR] { group : "Wave 1", label : "Contribution", value: 1,     min: 0,   max: 1,   step: 0.1 }
uniform float u_wave1_thickness;     // [EDITOR] { group : "Wave 1", label : "Thickness",    value: 0.9,   min: 0,   max: 1,   step: 0.1 }
uniform float u_wave1_speed;         // [EDITOR] { group : "Wave 1", label : "Speed",        value: 2.5,   min: 0,   max: 10,  step: 0.5 }
uniform float u_wave_2_contribution; // [EDITOR] { group : "Wave 2", label : "Contribution", value: 1,     min: 0,   max: 1,   step: 0.1 }
uniform float u_wave2_thickness;     // [EDITOR] { group : "Wave 2", label : "Thickness",    value: 10,    min: 0,   max: 100, step: 1   }
uniform float u_wave2_speed;         // [EDITOR] { group : "Wave 2", label : "Speed",        value: 3.0,   min: 0.5, max: 10,  step: 0.5 }
uniform float u_wave2_angle;         // [EDITOR] { group : "Wave 2", label : "Angle",        value: 2.0,   min: 0.5, max: 10,  step: 0.5 }
uniform float u_wave_3_contribution; // [EDITOR] { group : "Wave 3", label : "Contribution", value: 1,     min: 0,   max: 1,   step: 0.1 }
uniform float u_wave3_thickness;     // [EDITOR] { group : "Wave 3", label : "Thickness",    value: 100.0, min: 0,   max: 600, step: 5   }
uniform float u_wave3_speed;         // [EDITOR] { group : "Wave 3", label : "Speed",        value: 0.5,   min: 0,   max: 10,  step: 0.5 }
uniform float u_wave3_angle_1;       // [EDITOR] { group : "Wave 3", label : "Angle 1",      value: 0.5,   min: 0,   max: 10,  step: 0.5 }
uniform float u_wave3_shift_1;       // [EDITOR] { group : "Wave 3", label : "Shift 1",      value: 3.0,   min: 0.5, max: 10,  step: 0.5 }
uniform float u_wave3_shift_2;       // [EDITOR] { group : "Wave 3", label : "Shift 2",      value: 2.0,   min: 0.5, max: 10,  step: 0.5 }
uniform float u_wave3_pulse;         // [EDITOR] { group : "Wave 3", label : "Pulse",        value: 2.0,   min: 0,   max: 10,  step: 0.5 }

void main(void)
{
	// Wave 1 **********************************************************************************************************************
	float wave_1 = normalise(sin(v_uv.x * (1.0 - u_wave1_thickness) * 100.0 + (u_time * u_wave1_speed)));
	wave_1 *= u_wave_1_contribution;

	// Wave 2 **********************************************************************************************************************
	float wave_2 = normalise(sin(u_wave2_thickness * (v_uv.x * sin(u_time / u_wave2_angle) + v_uv.y * cos(u_time / u_wave2_speed)) + u_time));
	wave_2 *= u_wave_2_contribution;

	// Wave 3 **********************************************************************************************************************
	float cx = v_uv.x + u_wave3_angle_1 * sin(u_time / u_wave3_shift_1);
	float cy = v_uv.y + u_wave3_speed * sin(u_time / u_wave3_shift_2);
	float wave_3 = normalise(sin(sqrt(u_wave3_thickness * (pow(cx, 2.0) + pow(cy, 2.0)) + 1.0 + (u_time * u_wave3_pulse))));
	wave_3 *= u_wave_3_contribution;

	// Wave sum **********************************************************************************************************************
	float sum = wave_3 + wave_2 + wave_1;

	// Final colour
	float r = 1.0;
	float g = normalise(cos((sum * PI)));
	float b = normalise(sin((sum * PI)));
	gl_FragColor = vec4(r, g, b, 1.0);
}