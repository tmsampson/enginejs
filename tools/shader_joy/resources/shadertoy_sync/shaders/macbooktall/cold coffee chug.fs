void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv = abs(2.0*uv - 1.0)+ 0.5;
    float i = iGlobalTime*2.1;
    float d = length(uv);
    float a = pow(atan(uv.y,uv.x), d*i);
   
    vec3 e = vec3(i+a,i*2.5,d*1.4)*0.1;
    e.rgb = abs(mod(e+d,1.0)-0.5)*2.0;
	fragColor = vec4(e.r*uv.x, e.g, 1.0 - e.b, 1.0);
}