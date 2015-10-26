// [2TC 15] Pixelfire
// 140 chars (without white space and comments)
// by Andrew Baldwin.
// This work is licensed under a Creative Commons Attribution 4.0 International License.

void mainImage( out vec4 f, in vec2 p )
{
	vec4 c = vec4(p,0.,1.),d=c*.0,e;
    for (int i=9;i>0;i--) {
        e=floor(c);
        d+=abs(sin(e*e.yxyx+e*iDate.w))/9.;
       	c*=.5;
    }
    d.x+=d.y;
	f = d;
}