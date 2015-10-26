// Hashed blur
// David Hoskins.
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// Can go down to 10 or so, and still be usable, probably...
#define ITERATIONS 40

// Set this to 0.0 to stop the pixel movement.
#define TIME iGlobalTime

#define TAU  6.28318530718

//-------------------------------------------------------------------------------------------
// Use last part of hash function to generate new random radius and angle...
vec2 Sample(inout vec2 r)
{
    r = fract(r * vec2(33.3983, 43.4427));
    return r-.5;
    //return sqrt(r.x+.001) * vec2(sin(r.y * TAU), cos(r.y * TAU))*.5; // <<=== circular sampling.
}

//-------------------------------------------------------------------------------------------
vec2 Hash22(vec2 p)
{
	p  = fract(p * vec2(5.3983, 5.4427));
    p += dot(p.yx, p.xy +  vec2(41.5351, 41.3137));
	return fract(vec2(p.x * p.y * 55.4337, p.x * p.y * 57.597));
}

//-------------------------------------------------------------------------------------------
vec3 Blur(vec2 uv, float radius)
{
	radius = radius * .04;
    
    vec2 circle = vec2(radius) * vec2((iResolution.y / iResolution.x), 1.0);
    
	// Remove the time reference to prevent random jittering if you don't like it.
	vec2 random = Hash22(vec2(uv+mod(TIME*382.0231, 21.321)));

    // Do the blur here...
	vec3 acc = vec3(0.0);
	for (int i = 0; i < ITERATIONS; i++)
    {
		acc += texture2D(iChannel0, uv + circle * Sample(random), radius*8.0).xyz;
    }
	return acc / float(ITERATIONS);
}

//-------------------------------------------------------------------------------------------
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    
    float radius = 1.0 + 1.0 * sin(iGlobalTime*.2*TAU+4.3);
    if (iMouse.w >= 1.0)
    {
    	radius = iMouse.x*2.0/iResolution.x;
    }
    radius = pow(radius, 2.0);
 
    if (mod(iGlobalTime, 15.0) < 10.0 || iMouse.w >= 1.0)
    {
		fragColor = vec4(Blur(uv * vec2(1.0, -1.0), radius), 1.0);
    }else
    {
        fragColor = vec4(Blur(uv * vec2(1.0, -1.0), abs(sin(uv.y*.8+2.85))*4.0), 1.0);
    }
}