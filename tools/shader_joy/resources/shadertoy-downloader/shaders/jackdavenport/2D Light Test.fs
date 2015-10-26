#define LIGHT_RANGE 90.

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 light = vec2(.2,.2);
    
    if(iMouse.z > 0.) {
     
        light = iMouse.xy / iResolution.xy;
        
    } else {
     
        light = vec2(abs(sin(iGlobalTime)),.2);
        
    }
    
    vec3 finalColor = vec3(.8,.8,.8) * pow(max(dot(normalize(light),normalize(uv)),0.),LIGHT_RANGE);
    vec3 bg = texture2D(iChannel0, uv).xyz / 4.;
    
	fragColor = vec4(bg + finalColor.xyz,1.);
}