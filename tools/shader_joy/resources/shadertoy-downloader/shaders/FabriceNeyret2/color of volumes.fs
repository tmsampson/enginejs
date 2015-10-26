#define N 5.
	void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
	vec3 col = vec3(uv.x,N*mod(uv.x,1./N), N*N*mod(uv.x,1./(N*N)));
	col = pow(col,vec3(exp(3.*uv.y)-1.));
	fragColor = vec4(col,1.0);
}