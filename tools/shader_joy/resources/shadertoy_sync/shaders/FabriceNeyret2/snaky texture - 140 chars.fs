void mainImage(inout vec4 f, vec2 u) {
 
    for (float i=0.; i<=1.; i+=.07)
        f += .1*texture2D(iChannel0,u/iResolution.y+cos(i+iDate.w+vec2(0,1.6)) );  

    f*=f;
} 
