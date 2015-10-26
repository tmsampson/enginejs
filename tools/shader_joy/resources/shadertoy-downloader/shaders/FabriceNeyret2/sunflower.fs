#define N 20.
float t = iGlobalTime;
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = 2.*(fragCoord.xy / iResolution.y -vec2(.9,.5));
    float r = length(uv), a = atan(uv.y,uv.x);
    // r *= 1.-.1*(.5+.5*cos(2.*r*t));
    float i = floor(r*N);
    a *= floor(pow(128.,i/N)); 	 a += 10.*t+123.34*i;
    r +=  (.5+.5*cos(a)) / N;    r = floor(N*r)/N;
	fragColor = (1.-r)*vec4(3.,2.,1.,1.);
}