// [2TC 15] Mystery Mountains.
// David Hoskins.

#define F t+=texture2D(iChannel0,.3+p.xz*s/6e3,-99.)/s;s+=s;
void mainImage( out vec4 c, in vec2 w )
{
    vec4 p=vec4(w,1,1)/iResolution.xyzz-.5,d=p*.5,t;
    p.z = iGlobalTime*20.;d.y-=.2;
    for(float i=1.7;i>=0.;i-=.002)
    {
        float s=1.;t=d-d; F F F F F F
		c = vec4(1,.9,.8,9)+d.x-t*i;
        if(t.x>p.y*.01+1.3)break;
        p += d;
    }
}

