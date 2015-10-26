void mainImage( out vec4 f, in vec2 w )
{
	vec4 q = vec4(w,0.,1.) / iResolution.xyzx;
    float t = iGlobalTime*0.15;
    for(float i=1.; i<30.; i+=1.)
        q.w += 1. - smoothstep(.0, .15, length(q.xy - vec2(i/30. + sin(i + t), .5 + .3 * sin(q.x * 10. * sin(t) + t))));
    f = vec4(1. - q.w) * 4.*sqrt(q.x*q.y*(1.-q.x)*(1.-q.y));
}