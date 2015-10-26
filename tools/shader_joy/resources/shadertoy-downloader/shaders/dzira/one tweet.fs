void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 u=fragCoord.xy/iResolution.y-.6;
    fragColor=texture2D(iChannel0,u+normalize(u)*vec2(sin(2.*length(u)-iGlobalTime)));
}