void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv.x = abs(uv.x*2.0-1.0);
    uv.y = abs(uv.y*2.0-1.0) ;
    float r = sin(uv.x*2.0+sin(uv.x*10.0)*(2.0*(-1.5 + sin(iGlobalTime)))+(1.0 + sin(iGlobalTime*0.5+10.0)*3.0*uv.x)*2.0);
	float g = sin(uv.y*2.0+sin(uv.y*10.0)*(2.0*(-1.5 + sin(iGlobalTime)))+(1.0 + sin(iGlobalTime*0.5+10.0)*3.0*uv.y)*2.0);
    fragColor = vec4((r/g)*cos(iGlobalTime), g/r*sin(iGlobalTime), 1.2 - g/r ,1.0);

}