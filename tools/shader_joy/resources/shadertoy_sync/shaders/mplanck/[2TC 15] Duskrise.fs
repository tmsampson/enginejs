// 2 Tweet Challenge 2015! Thanks to nimitz - https://www.shadertoy.com/view/4tl3W8
// tested on: 
// - 13.3-inch Macbook Pro Intel Iris 1536 MB
// ...

void mainImage( out vec4 f, in vec2 w )
{
	float t = iGlobalTime + 10.;
	vec2 p = w / iResolution.x;
    
    vec3 c = mix(vec3(1., 1., .6 + p.y),
                 vec3(.8, .5, .3 + p.y*p.y),
                 step(.5 * sin(.1 * t + .4 * p.y) + .5, 
                      fract(floor(200. * (.5 * sin(.04 * t) + .6) * p.y + t) * (p.x + 4e-06 * t))));
    f.rgb = c;    
}