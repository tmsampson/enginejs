// Created by Stephane Cuillerdier - Aiekick/2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

//based on my Weird Fractal 4 : https://www.shadertoy.com/view/MtsGzB

// matrix op
mat3 getRotYMat(float a){return mat3(cos(a),0.,sin(a),0.,1.,0.,-sin(a),0.,cos(a));}

float map(in vec3 p, in vec3 q, inout vec3 r, inout float m)
{
	float d = 0.;
    for (int j = 0; j < 3 ; j++)
    	r=max(r*=r*=r*=r=mod(q*m+1.,2.)-1.,r.yzx),
        d=max(d,( 0.29 -length(r)*0.6)/m)*0.8,
        m*=1.08;
    return d;
}

vec4 fractal(vec2 uv)
{
	vec2 s = iResolution.xy;
    float t = iGlobalTime*.3, c,d,m,f=0.;
    vec3 p=vec3(2.*(2.*uv-s)/s.x,1.),r=p-p,q=r;
    p*= mat3(0,-1,0,1,0,0,0,0,1);
    p*=getRotYMat(-t);
    p.y/=2.;
    q.zx += 10.+vec2(sin(t),cos(t))*3.;
    for (float i=1.; i>0.; i-=.002) 
    {
   		c=d=0.,m=1.;
        f+=0.01;
        d = map(p,q,r,m);
        q+=p*d;
        c = i;
        if(d<0.001) break;
    }
    
    vec3 e = vec3( 0.1, 0., 0. );
    vec3 n = normalize(vec3(
    	map(p,q+e.xyy,r,m) - map(p,q-e.xyy,r,m),
        map(p,q+e.yxy,r,m) - map(p,q-e.yxy,r,m),
        map(p,q+e.yyx,r,m) - map(p,q-e.yyx,r,m) ));

    float k = dot(r,r+.15);
    vec3 col= vec3(1.,k,k/c)-vec3(0.86,0.44,0.13);
    return vec4(col/f, 1.);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    
	fragColor = fractal(fragCoord.xy);
}