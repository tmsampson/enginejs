//More Spirograph by eiffie
//Trying (and failing) to make a better DE for parameterized curves.

#define STEPS 200
#define ITERS 4

float scale;
float Config(float t){
	float sgn=1.0;
	if(mod(t,50.0)>25.0)sgn=-1.0;
	t=floor(mod(t,25.0));
	if(t<10.0)return (2.0+t*0.25)*sgn;
	t-=10.0;
	if(t<10.0)return (2.0+t*0.33333)*sgn;
	t-=10.0;
	if(t<1.0)return 3.44955*sgn;
	if(t<2.0)return 2.7913*sgn;
	if(t<3.0)return 2.5616*sgn;
	if(t<4.0)return 2.4495*sgn;
	return 2.30275*sgn;
}
vec2 F(float t){
	float a=t,r=1.0;
	vec2 q=vec2(0.0);
	for(int j=0;j<ITERS;j++){
		q+=vec2(cos(a),sin(a))*r;
		a*=scale;r/=abs(scale);
	}
	return q;
}
vec2 DF(vec2 p, float t){
    float d1=length(p-F(t)),dt=0.1*d1,d2=length(p-F(t+dt));
	dt/=max(dt,d1-d2);
	return vec2(min(d1,d2),0.4*log(d1*dt+1.0));
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	vec2 p=(2.0*fragCoord.xy-iResolution.xy)/iResolution.y;
	p*=1.75;
	scale=mix(Config(iGlobalTime),Config(iGlobalTime+1.0),smoothstep(0.5,1.0,fract(iGlobalTime)));
	float t=0.0,d=100.0;
	for(int i=0;i<STEPS;i++){
		vec2 v=DF(p,t);
		d=min(d,v.x);
		t+=v.y;
	}
	d=smoothstep(0.0,0.01,d);
	vec3 col=vec3(d*d*d,d*d,d);
	fragColor = vec4(col,1.0);
}
