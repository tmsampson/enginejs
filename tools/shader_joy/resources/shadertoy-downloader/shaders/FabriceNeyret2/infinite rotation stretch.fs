void mainImage( inout vec4 o, vec2 p )
{
	p /= iResolution.xy;
    float s = 0.,a,t,S,C;
    for (float i=-3.; i<= 3.; i++) {
        s += a = .5+.5*cos(t= fract(iGlobalTime)-i);  
        t *= smoothstep(0.,1.,length(p-.5));     
	    o += a*texture2D(iChannel0,mat2(C=cos(t),S=sin(t),-S,C)*(p-.5));
    } 
    o /= s;
    o = 2.*o-.5;
}