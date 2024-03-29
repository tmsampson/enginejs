#define PI 3.14159265359
#define PHI 1.61803398875
#define LN_PHI 0.48121182506
#define PI_OVER_FIVE 0.62831853071
#define FREQ1 0.5
#define FREQ2 0.2

// saw
float gen(float x, float o, float s) {
    return fract(log(abs(x))/(LN_PHI + s) - o);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
   	float t = FREQ1 * iGlobalTime;
    float t2 = 1.0 + sin(FREQ2 * iGlobalTime);
    vec2 scale = vec2(1.0, iResolution.y / iResolution.x);
	vec2 uv = scale * ((fragCoord.xy / iResolution.xy) - 0.5);
    float sum = 0.0;
    for (int i = 0; i < 5; i++) {
	    float rot = uv.x * sin(PI_OVER_FIVE * float(i)) + uv.y * cos(PI_OVER_FIVE * float(i));
        sum += gen(rot, t, t2);
    }
    vec3 col;
    if ( mod(floor(sum),2.0) == 0.0 ) {
       col = vec3(fract(sum));     
    } else {
       col = vec3(1.0 - fract(sum));
    }
	fragColor=vec4(col, 1.0);
}