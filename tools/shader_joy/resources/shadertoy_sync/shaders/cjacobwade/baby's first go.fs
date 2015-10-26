void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy * sin(fragCoord/10.0);
    uv.x += cos(iGlobalTime * uv.y * (iMouse.x/iResolution.x/10.0));
    uv.y += sin(iGlobalTime * uv.x * (iMouse.y/iResolution.y/10.0));
    
	fragColor = vec4(uv,0.5+0.5*sin(iGlobalTime * pow(0.5 - fragCoord.y/fragCoord.x, 1.0/cos(iGlobalTime))),1.0);
}