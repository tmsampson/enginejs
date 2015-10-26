float C,S, t=(iGlobalTime+15.)/5e2;
#define rot(a) mat2(C=cos(a),S=-sin(a),-S,C)

void mainImage( inout vec4 o, in vec2 u )
{
    vec2 R = iResolution.xy, p;
	u = 36.3*(u+u-R)/iResolution.y;
    
// #define B(k) ceil( (p=cos(u*=rot(t))).x * p.y )  * (.5+.5*cos(k)) / 31.
// #define B(k) ceil( (p=cos(u*=rot(t))).x )        * (.5+.5*cos(k)) / 31.
// #define B(k) ceil( (p=cos(u*=rot(t))).x )        *     cos(k)     / 4.
   #define B(k)     ( (p=cos(u=u*rot(t)+k)).x )     *     cos(k)     / 6.
   
    for (float a=0.; a<6.3; a+=.1)
        o += vec4( B(a), B(a+2.1), B(a-2.1), 1) ;

}