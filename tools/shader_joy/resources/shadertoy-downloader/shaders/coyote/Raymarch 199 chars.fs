//199 chars, additional size optimizations by Nrx and aiekick

void mainImage (out vec4 f, vec2 u)
{
    vec3 r = vec3 (cos (f=iDate).w, 1, sin (f.w)), R = iResolution;
    for (float i = .6 ; i > .1 ; i -= .002)
        if ((f.a = length (fract (r) - .5) - .3) > .001)
	        f.bgr = i + i * (r += vec3 ((u + u - R.xy) / R.y, 2) * .06 * f.a);
}

//210, my original (with a little help by FabriceNeyert2 ;)
/*
void mainImage( out vec4 f, vec2 u )
{
    vec3 r = vec3(cos(iDate.w), 1, sin(iDate.w)) + 1.,
         R = iResolution ;

    for( float i = .6 ; i > .1 ; i-=.002 ) {
        r += vec3( (u+u-R.xy)/R.y, 2 ) * .06
             * ( f.a = length( fract(r) - .5 ) - .3 ) ;
        f.bgr=i*r;
        if( f.a < .001 ) break ;
    }

}
*/