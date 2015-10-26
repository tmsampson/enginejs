void mainImage(inout vec4 o, vec2 i) { o += fract(length(sin(i)) - iDate.w); }

// void mainImage(inout vec4 o, vec2 i) { o += fract(length(i)/1e2 - iDate.w); }