#define keyToggle( k)  (texture2D(iChannel1,vec2(.5+k/256.,0.75)).x > 0.)

void mainImage( inout vec4 o, vec2 i )  {
    vec2 R = iResolution.xy,
	     uv = i / R.y - vec2(.8,.5);
	float r = length(uv), a = atan(uv.y,uv.x), t = iGlobalTime;
	
	
	if (r<.01)                                  // --- red dot 
		o.x++; // o = vec4(1,0,0,0);
	else
		if (keyToggle(32.) ||  iMouse.z > 0. )  // --- image
			o = texture2D(iChannel0,1.-i/R);
		else {
			float phase = 200.*r               // --- animated pattern
			            + 7.*( sin(uv.x*15.) + cos(uv.y*15.) + min(1.,r*10.)*sin(a*2.) );
            o += sin(phase-26.*t);
			// o = vec4(max(0.,sin(phase-26.*t))); //+.5*sin(4.*phase-16.*t));
		}


}