
vec2 rot2D(vec2 p, float a)
{
    return vec2(p.x*cos(a)  -p.y*sin(a),
                p.x*sin(a) + p.y*cos(a));
}

bool on_2d_donut(vec2 p, vec2 c, float r, float e)
{
    float d=distance(p,c);
    float e2=e*.5;
    return d > r - e2 && d < r + e2;
    
}

vec4 earth_flag(vec2 uv)
{
    const vec4 blue=vec4(1./255., 59./255., 166./255., 1.);
    const vec4 white=vec4(1.);
    const float e=0.03;
    const float r=.26;
    const float l=e;
    
    float a=atan(uv.y, uv.x);
    vec4 color=blue;

    if (on_2d_donut(uv,vec2(0.), r,e))
    {
        if (!(a < -.6 && a > -2.4))
        	return white;
        color=white;
    }
    else if (on_2d_donut(uv,vec2(0.), r,e+l))
    {
        if (!(a < -.6 && a > -2.4))
        	return blue;
        color=blue;
    }
    vec2 c=vec2(-r,.0);
    c=rot2D(c, 2.*6.28318530718/6.);
    for (float i=0.; i < 6.; i++)
    {
        if (on_2d_donut(uv,c, r,e))
        	return white;
        else if (on_2d_donut(uv,c, r,e+l))
        	return blue;
        c=rot2D(c, 6.28318530718/6.); 
    }
    
    return color;   
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 v = fragCoord.xy / iResolution.xy;
    vec2 uv=v*2.-vec2(1.);
    uv.x*=iResolution.x/iResolution.y;
	fragColor = earth_flag(uv);
}