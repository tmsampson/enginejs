void mainImage(inout vec4 o,vec2 i) {
    o.rb=i-i.yx*abs(tan(iDate.w));
}