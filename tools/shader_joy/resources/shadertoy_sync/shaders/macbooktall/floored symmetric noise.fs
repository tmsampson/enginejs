float hash( float n )
{
    return fract(sin(n)*43758.5453123);
}

float noise( in vec2 x )
{
    vec2 p = floor(x);
    vec2 f = fract(x);

    f = f*f*(3.0-2.0*f);

    float n = p.x + p.y*157.0;

    return mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
               mix( hash(n+157.0), hash(n+158.0),f.x),f.y);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	float a = iResolution.x/iResolution.y;
    
    uv = abs(uv*2.0-1.0);
    mat2 m = mat2( -0.5+0.5*sin(uv.x+iGlobalTime), 0.5+0.5*cos(uv.x+iGlobalTime), 0.5+0.5*cos(uv.x+iGlobalTime), 0.5+0.5*tan(uv.x) );
    uv *= m;
    
    float f = 15.0;
    vec2 v1 = vec2((floor(uv.x*f*a)/f)+iGlobalTime, (floor(uv.y*f)/f)+iGlobalTime);
    vec2 v2 = vec2((floor(uv.x*f*a)/f)+iGlobalTime+2.0, (floor(uv.y*f)/f)+iGlobalTime+2.0);
    vec2 v3 = vec2((floor(uv.x*f*a)/f)+iGlobalTime+4.0, (floor(uv.y*f)/f)+iGlobalTime+4.0);
    
    float r = noise(v1);
    float g = noise(v2);
    float b = noise(v3);
   
    fragColor = vec4(r,g,b,1.0);
}