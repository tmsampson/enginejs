void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    vec4 tex = texture2D(iChannel0,uv);
    float distance = tex.g - max( tex.r, tex.b );
    if (distance > 0.05) discard;
	fragColor = tex;
}