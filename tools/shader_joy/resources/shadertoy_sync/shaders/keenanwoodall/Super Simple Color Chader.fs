void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    fragColor = vec4(sin(iMouse.x / iResolution.x), sin(iMouse.y / iResolution.y), sin(iMouse.z / iResolution.x), 1);
}