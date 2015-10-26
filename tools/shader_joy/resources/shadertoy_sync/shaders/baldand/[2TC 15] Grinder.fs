// [2TC 15] Grinder
// 139 chars (without white space and comments)
// by Andrew Baldwin.
// This work is licensed under a Creative Commons Attribution 4.0 International License.

void mainImage( out vec4 f, in vec2 w )
{ 
	vec4 c = mod(vec4(w,0.,1.)/8.,8.)-4.;
	float a=atan(c.x,c.y)+iDate.w;
	f.x = step(3.,cos(floor(.9+a/.9)*.9-a)*length(c.xy));
}