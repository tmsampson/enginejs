#define N 10.
float t = iGlobalTime;
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = 2.*(fragCoord.xy / iResolution.y -vec2(.9,.5));
    float r = length(uv), a = atan(uv.y,uv.x);
    float i = floor(r*N);
    a *= floor(pow(128.,i/N)); 	 a += 20.*sin(.5*t)+123.34*i-100.*(r-0.*i/N)*cos(.5*t);
    r +=  (.5+.5*cos(a)) / N;    r = floor(N*r)/N;
	fragColor = (1.-r)*vec4(.5,1.,1.5,1.);
}