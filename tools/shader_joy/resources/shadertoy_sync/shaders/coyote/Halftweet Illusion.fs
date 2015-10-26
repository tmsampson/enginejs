void mainImage(inout vec4 o,vec2 i) {
    o.rg=sin(i-i.yx*iGlobalTime*.3);
}
