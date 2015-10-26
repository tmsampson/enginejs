float DX = 1.;
float V = 0.;
#define A .05

float t = iGlobalTime;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	vec2 mouse = iMouse.xy / iResolution.xy;
	vec3 col = vec3(0);
	if (iMouse.z<=0.) {
		mouse.x = sin(t);
		mouse.y = (1.+sin(.3*t))/2.;
	}
	
	DX += floor(exp(5.*mouse.y));
	t = 30.*mouse.x;
	
	if (mod((fragCoord.x+.5)/DX-t,2.)>=1.)
		col = 1.-A + A*texture2D(iChannel0,vec2(uv.x,1.-uv.y)).rgb;
	
	fragColor = vec4(col,1.0);
	
}