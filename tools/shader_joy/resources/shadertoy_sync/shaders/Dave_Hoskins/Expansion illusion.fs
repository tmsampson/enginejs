// Dave Hoskins. Feb 2014.
// Butchered Harekiet's code. Thanks Harekiet!

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = abs(2.0 * (fragCoord.xy / iResolution.xy) - vec2( 1 )); 
	p.x *= iResolution.x / iResolution.y;;

	//Get some angle
	float a = atan( p.x, p.y );
	//Get radius
	float r = dot( p, p ) * 1.5;
	
	vec3 c = vec3(sin(6.28318530718 * mod( 4.0 * iGlobalTime + r*iResolution.y / 70.0, 1.0))); 
	
	c = mix(c, vec3(1.0, 0.0, 0.0), smoothstep(.001, .00005, r));
	
	fragColor = vec4( c, 1.0);	
}