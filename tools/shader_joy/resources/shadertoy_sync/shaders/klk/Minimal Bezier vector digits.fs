#define float3 vec3
#define float2 vec2
#define float4 vec4

//precision lowp float;

float Draw(float2 p0, float2 p1, float2 uv)
{
    float2 dp=normalize(p1-p0);
    float2 dpp=float2(dp.y, -dp.x);
    float l=abs(dot(dpp,uv-p0));
    if((dot(dp,uv-p0)<0.0))
        l=length(uv-p0);
    if((dot(-dp,uv-p1)<0.0))
        l=length(uv-p1);
    return l;
}

float l=1.0;
float line;
float2 CP0;
float2 CP;
float2 uv;
float size;

float2 Pp0=float2(-0.5,-0.25);
float2 Ppx=float2(0.01,0);
float2 Ppy=float2(0,0.01);

float2 TS(float2 p)
{
    return Pp0+Ppx*p.x+Ppy*p.y;
}
    
void BeginShape()
{
    l=1.0;
}

void MoveTo(float2 p)
{
    p=TS(p);
    CP0=CP=p;
}

void LineTo(float2 p)
{
    p=TS(p);
    l=min(l,Draw(CP,p,uv));
    CP=p;
}

void RLineTo(float2 p)
{
    p=CP+TS(p)-Pp0;
    l=min(l,Draw(CP,p,uv));
    CP=p;
}

void LineToNoTS(float2 p)
{
    l=min(l,Draw(CP,p,uv));
    CP=p;
}
/*
void Bez2To(float2 p1, float2 p2)
{
    p1=TS(p1);
    p2=TS(p2);
    const int NS=3;
    float t=1.0/float(NS);
    float2 p0=CP;
	for(int i=1;i<=NS;i++)
    {
        LineToNoTS(p0*(1.0-t)*(1.0-t)+2.0*p1*t*(1.0-t)+p2*t*t);
        t+=1.0/float(NS);
    }
}
*/
void Bez3To(float2 p1, float2 p2, float2 p3)
{
    p1=TS(p1);
    p2=TS(p2);
    p3=TS(p3);
    const int NS=4;
    float t=1.0/float(NS);
    float2 p0=CP;
	float2 d1=(p1-p0)*3.0;
	float2 d2=(p1-p2)*3.0;
	for(int i=0;i<100;i+=1)
    {
		LineToNoTS((((d2-p0+p3)*t-d1-d2)*t+d1)*t+p0);
        t+=1.0/float(NS);
        if(t>1.0)
            break;
    }
}


void CloseShape()
{
    if(length(CP-CP0)>0.0)
    	LineTo(CP0);
}

void FinishShape()
{
    float l0=sqrt(l*l*size*size)*0.25;
    line=clamp(1.0-l0,0.0,1.0);
}

void Digit(float d);

void Print(float v)
{
    if(v<0.0)
    {
    	Digit(11.5);
	    Pp0+=Ppx*2.3;
        v=-v;
    }
    Digit((fract(v/10.0)*10.0));
    Pp0+=Ppx*2.3;
    Digit(10.5);
    float d=1.0;
    for(int i=0;i<10;i+=1)
    {
        Pp0+=Ppx*2.3;
	    Digit((fract(v*d)*10.0));
    	d*=10.0;
        if(d>100.0)
            break;
    }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    size=min(iResolution.x, iResolution.y);
    float2 mp=iMouse.xy/iResolution.xy-0.5;
    mp.x=mp.x*iResolution.x/iResolution.y;

    Ppx.x=0.06;
    Ppy.y=0.09;
    Ppy.x=0.01;
    
    float t=iGlobalTime*0.25;
	uv = fragCoord.xy/iResolution.xy-0.5;
    uv.x=uv.x*iResolution.x/iResolution.y;
    
    BeginShape();
    if(iMouse.xy==float2(0.0))
        Print(fract(t*0.01)*10.0-5.0);
    else
        Print(mp.x);
    FinishShape();

    float3 col2=float3(0);

    fragColor=float4(0.9,0.8,0.6,1.0);
   	fragColor.rgb=mix(fragColor.rgb,col2,line);
}

void glyph_0();
void glyph_1();
void glyph_2();
void glyph_3();
void glyph_4();
void glyph_5();
void glyph_6();
void glyph_7();
void glyph_8();
void glyph_9();
void glyph_Dot();
void glyph_Minus();

void Digit(float d)
{
    /* */if(d< 1.0)glyph_0();
    else if(d< 2.0)glyph_1();
    else if(d< 3.0)glyph_2();
    else if(d< 4.0)glyph_3();
    else if(d< 5.0)glyph_4();
    else if(d< 6.0)glyph_5();
    else if(d< 7.0)glyph_6();
    else if(d< 8.0)glyph_7();
    else if(d< 9.0)glyph_8();
    else if(d<10.0)glyph_9();
    else if(d<11.0)glyph_Dot();
    else if(d<12.0)glyph_Minus();
}

float2 x=float2(1.0,0.0);
float2 y=float2(0.0,1.0);

void glyph_0()
{
  MoveTo(x);
  Bez3To(-0.2*x,2.0*y-x*0.2,float2(1.0,2.0));
  Bez3To(2.0*y+x*2.2,2.2*x,x);
  MoveTo(x*0.85+y*0.7);
  LineTo(x*1.15+y*1.3);
}
void glyph_1()
{
  MoveTo(0.5*x+1.7*y);
  LineTo(x+2.0*y);
  LineTo(x);
  MoveTo(0.5*x);
  LineTo(1.5*x);
}
void glyph_2()
{
  MoveTo(1.8*x+y*0.2);
  LineTo(1.8*x);
  LineTo(0.2*x);    
  Bez3To(float2(0.9,0.625),x*1.8+y*1.1,x*1.8+y*1.5);
  Bez3To(x*1.8+y*2.2,x*0.2+y*2.2,x*0.2+y*1.5);
}
void glyph_3()
{
  MoveTo(x*0.2+y*1.7);
  Bez3To(x*0.4+y*2.15,x*1.7+y*2.15,x*1.7+y*1.55);
  Bez3To(x*1.7+y*1.3,x*1.4+y*1.1,x*0.8+y*1.1);
  Bez3To(x*1.4+y*1.1,x*1.8+y*0.9,x*1.8+y*0.55);
  Bez3To(x*1.8-y*0.2,x*0.4-y*0.2,x*0.2+y*0.3);
}
void glyph_4()
{
  MoveTo(0.1*x+0.6*y);    
  LineTo(x*1.6+2.0*y);
  RLineTo(-y*2.0);
  RLineTo(-0.3*x);
  RLineTo(0.6*x);
  MoveTo(0.1*x+0.6*y);    
  RLineTo(1.8*x);
}
void glyph_5()
{
  MoveTo(x*0.2+y*1.1);
  Bez3To(x*0.7+y*1.5,x*1.8+y*1.4,x*1.8+y*0.65);
  Bez3To(x*1.8-y*0.2,x*0.4-y*0.2,x*0.1+y*0.3);
  MoveTo(x*0.2+y*1.1);
  RLineTo(y*0.9);
  RLineTo(x*1.5);
}
void glyph_6()
{
  MoveTo(x*0.2+y*0.6);
  Bez3To(x*0.2-0.2*y,1.8*x-y*0.2,float2(1.8,0.6));
  Bez3To(1.8*x+y*1.4,x*0.2+1.4*y,x*0.2+y*0.6);
  Bez3To(x*0.0+1.6*y,0.7*x+y*2.3,float2(1.6,1.9));
}
void glyph_7()
{
  MoveTo(x*0.1+y*1.8);
  RLineTo(y*0.2);
  RLineTo(x*1.8);
  Bez3To(x+y*1.3,x+y*0.5,x);
}
void glyph_8()
{
  MoveTo(x+y*1.1);
  Bez3To(y*1.1-x*0.2,-x*0.2-y*0.05,x-y*0.05);
  Bez3To(2.2*x-y*0.05,y*1.1+2.2*x,x+y*1.1);
  Bez3To(y*1.1,y*2.05,x+y*2.05);
  Bez3To(y*2.05+2.0*x,2.0*x+y*1.1,x+y*1.1);
}
void glyph_9()
{
  MoveTo(float2(1.8,1.4));
  Bez3To(1.8*x+y*0.6,x*0.2+0.6*y,x*0.2+y*1.4);
  Bez3To(x*0.2+2.2*y,1.8*x+y*2.2,float2(1.8,1.4));
  Bez3To(float2(1.9,0.0),float2(1.0,-0.2),float2(0.4,0.2));
}
void glyph_Dot()
{
  MoveTo(x);
  Bez3To(x*1.2,x*1.2+y*0.2,x+y*0.2);
  Bez3To(x*0.8+y*0.2,x*0.8,x);
}
void glyph_Minus()
{
  MoveTo(x*0.5+y);
  RLineTo(x);
}

