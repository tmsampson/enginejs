//Julia Explorer by eiffie

//Here are some things to play with, p=top power, Z=Z^P+Z^(P-1)...+Z+C, i=iterations

#define U(p,m) m[0]=2.2*p.xy/iResolution.xy-1.1;m[1]=m[0].yx;m[1].x*=-1.;

void mainImage( out vec4 f, in vec2 w ) {
	mat2 Z,C,H;
	U(w,Z);
	U(iMouse,C);
    if(iMouse.z<.5)C[0].y=sin(iDate.w);
    for(int i=0;i<5;i++){
        H=Z;
        for(int p=1;p<13;p++)H=Z*H+Z;
        Z=H+C;
    }
	vec4 v=vec4(Z);v.z+=v.w;//why can't I take the sin of a mat2??? who are you to judge??
	f = 4.*abs(sin(v/dot(v,v)));
}

