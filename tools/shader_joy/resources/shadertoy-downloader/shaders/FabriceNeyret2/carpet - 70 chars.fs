
void mainImage( inout vec4 f, vec2 u ) {
//  f += sin( dot(u+=u,u) - max(u.x,u.y) );             // 70 chars
    f += sin( dot(u+=u,u) - max(u.x,u.y) - 4.*iDate.w); // anim: + 11 chars
}


