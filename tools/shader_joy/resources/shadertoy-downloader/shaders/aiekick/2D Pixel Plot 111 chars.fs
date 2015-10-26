// shortest code by coyote :

void mainImage( inout vec4 f, vec2 g ) {
    f.xy=floor(20.*(g+g-(f.xy=iResolution.xy))/f.y);
    f.y-=f.x*cos(f.x+iDate.w);
}

/* original
void mainImage( out vec4 f, in vec2 g )
{
    vec2 
        s = iResolution.xy,
        v = floor(20.*(2.*g-s)/s.y);
    v.y-=v.x*cos(v.x+iDate.w);
    f.xy = v;
}
*/