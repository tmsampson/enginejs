void mainImage(inout vec4 f, vec2 u) {
    u /= iResolution.xy; 
    float x,c;
    for (float i = 1.; i < 20.; i++)   
		f = u.y+.04*i < sin(c=floor(x= 2e2*u.x/i + 9.*i + iDate.w)) ? 
                             f + min(15.*((x-=c)-x*x),1.) *(i/20.-f)  : f; 

}