#define f(a,b)sin(50.3*length(fragCoord.xy/iResolution.xy*4.-vec2(cos(a),sin(b))-3.))
void mainImage( out vec4 fragColor, in vec2 fragCoord ){float t=iGlobalTime;fragColor=vec4(f(t,t)*f(1.4*t,.7*t));}