vec3 lerp(vec3 a, vec3 b, float s)
{
    return (a + (b - a) * s).xyz;
}
vec2 lerp(vec2 a, vec2 b, float s)
{
    return (a + (b - a) * s).xy;
}

float lerp(float a, float b, float s)
{
    return (a + (b - a) * s);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	fragColor = vec4(0.0,0.0,0.0,1.0);

    vec2 uv = fragCoord.xy / iResolution.xy;
    float px=mod(iGlobalTime*(sin(iGlobalTime*0.2)*30.0),iResolution.x);
    float bx=distance(px,fragCoord.x);
    
    float outc=10.0-bx;
	fragColor = vec4(outc,outc,outc,1.0);

}