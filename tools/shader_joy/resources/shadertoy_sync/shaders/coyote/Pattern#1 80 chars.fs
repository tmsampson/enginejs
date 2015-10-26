void mainImage(inout vec4 o,vec2 i) {
    o.bg=cos(tan(i)+atan(i.x,i.y)*iGlobalTime);
}