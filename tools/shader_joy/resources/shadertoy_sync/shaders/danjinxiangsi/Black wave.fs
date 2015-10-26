void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 center=vec2(1024.0,768.0);
    
	vec2 p = 5.0 * (fragCoord.xy-center) / iResolution.xy;
	
	float a =abs(atan(p.x,p.y));
	float r = length(p)*1.;

	float w = sin(3.1415927*iGlobalTime);
	float h = 0.5+0.5*cos(1.0*a-w*7.0+r*8.0);
fragColor = vec4(h,h,h,1.0);
}