// compaction of  NinjaKoala's shader https://www.shadertoy.com/view/4lX3zB
// 281 

//  130

void mainImage( inout vec4 o, vec2 i ){
	float f, c = i.y, b = i.x+c;

	for (float i=17.; i>0.; i--)
		f = floor(b/2.),
        o += (b-f-f)/exp2(i),
        b  =  c-f-f,
        c  = -f;
}





    
/*  // 131
void mainImage( inout vec4 o, vec2 i ){
	float f;
    i.x += i.y;

	for (float k=17.; k>0.; k--)
		f = floor(i.x/2.),
        i -= f+f,
        o += i.x/exp2(k),
        i.x = -f, i = i.yx;   // i  = vec2(i.y,-f);
}

*/



/* // 131
void mainImage( inout vec4 o, vec2 i ){
    i.x += i.y;
    vec3 p = i.xxy;

	for (float k=17.; k>0.; k--)
        p = p.yzx -= 2.*(p.x= floor(p.y/2.)),
        o += p.x/exp2(k);
}
*/


/*  // 129 but look change 
void mainImage( inout vec4 o, vec2 i ){
    i += i.y;
	float f;

	for (float k=17.; k>0.; k--)
        i -= f = 2.*floor(i/=2.).x,
        o += i.x/exp2(k),
        i.x = -f, i = i.yx;   // i  = vec2(i.y,-f);
}
*/