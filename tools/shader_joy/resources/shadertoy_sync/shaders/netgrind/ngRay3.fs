//forked from https://www.shadertoy.com/view/llfSzH

void mainImage( out vec4 f, vec2 u )
{
    float s = 1.;
    vec3 r = vec3(s*.5, s*.5,mod(iGlobalTime*s*1.,s)) + s*.5,
         R = iResolution ;
    
    u-= R.xy*.5;
    float d = length(u/R.y)*2.;
    float a = sin(iGlobalTime*.1);
    u*= mat2(d,a,-a,d);
    u+=R.xy*.5;
    
    for( float i = .7; i > .1 ; i-=.01 ) {
        r += vec3( (u+u-R.xy)/R.y, 2 ) * .4
             * ( f.a = length( mod(r,s) - (s*.5) ) - .3 ) ;
        f.bgr=abs(sin(vec3(i)));
        if( f.a < .001 ) break ;
    }
    f.rgb = sin(iGlobalTime+(f.rgb+vec3(0.0,.33,.66))*6.)*.5+.5;

}