void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Cartoony starburst
    // Very influenced by https://www.shadertoy.com/view/4dlGRM (by Tomek Augustyn)
	vec2 uv = fragCoord.xy / iResolution.xy;
    
    float period = 10.0;
    float rotation = iGlobalTime * 4.0;
    float rotation1 = rotation + 2.8;
    
    vec2 center = vec2(0.5, 0.5) ;
    
    vec3 bg = vec3(0.1, 0.3, 0.8);
    vec3 fg1 = vec3(0.6, 0.05, 0.0);
    vec3 fg2 = vec3(0.9, 0.7, 0.0);
    
    vec2 shift = uv - center;
    
    float shiftLen = length(shift);
    float shiftAtan = atan(shift.x, shift.y);
    
    float offset = rotation + shiftLen / 10.0;
    float x = sin(offset + shiftAtan * period);
    float val = smoothstep(0.4, 0.6, x);
 	
    vec3 color = mix(bg, fg1, val);
    
    offset = rotation1 + shiftLen / 10.0;
    x = sin(offset + shiftAtan * period);
    val = smoothstep(0.4, 0.6, x);
    
    color = mix(color, fg2, val);
	
    fragColor = vec4(color, 1.0);
}