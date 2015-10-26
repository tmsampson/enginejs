void mainImage(inout vec4 o,vec2 i) {
    o.gr=sin(i*i-i.yx*iGlobalTime);
}