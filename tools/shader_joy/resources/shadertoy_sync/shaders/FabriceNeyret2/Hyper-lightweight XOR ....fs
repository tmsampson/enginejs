#define f(a,b)floor(mod(length(i.xy/iResolution.xy*4.-vec2(cos(a),sin(b))-3.)*16.,2.))
void mainImage(out vec4 o,in vec2 i){float t=iDate.w;o=vec4(f(t,t)!=f(1.4*t,.7*t));}