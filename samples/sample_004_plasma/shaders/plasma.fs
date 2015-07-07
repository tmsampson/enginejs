precision highp float;

// Helpers
#define PI 3.1415926535897932384626433832795
float normalise(float x) { return (1.0 + x) / 2.0; }

// Input
varying vec2 v_uv;
uniform float u_time;

void main(void)
{
	// Wave 1 *************************************************************************************************
	float wave_1 = normalise(sin(v_uv.x * 10.0 + (u_time * 2.5)));

	// Wave 2 *************************************************************************************************
	float wave_2 = normalise(sin(10.0 * (v_uv.x * sin(u_time / 2.0) + v_uv.y * cos(u_time / 3.0)) + u_time));

	// Wave 3 *************************************************************************************************
	float cx = v_uv.x + 0.5 * sin(u_time / 3.0);
	float cy = v_uv.y + 0.5 * sin(u_time / 2.0);
	float wave_3 = normalise(sin(sqrt(100.0 * (pow(cx, 2.0) + pow(cy, 2.0)) + 1.0 + (u_time * 2.0))));

	// Wave sum
	float sum = wave_1 + wave_2 + wave_3;

	// Fade in

	// Final colour
	float r = 1.0;
	float g = normalise(cos((sum * PI)));
	float b = normalise(sin((sum * PI)));
	vec4 col = vec4(r, g, b, 1.0);

	// Apply fade-in
	float u_fade_in = min(u_time, 4.0) / 4.0;
	gl_FragColor = ((1.0 - u_fade_in) * vec4(0.0)) + (u_fade_in * col);
}