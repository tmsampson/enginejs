void mainImage( out vec4 fragColor, in vec2 fragCoord )  {
	vec2 uv = fragCoord.xy / iResolution.xy;
	vec3 rgb= texture2D(iChannel0,uv).rgb;
	uv = fragCoord.xy / iResolution.y;
	uv.x -= .5*floor(mod(32.*uv.y+.5,2.))/32.;
	vec2 uv0 = floor(uv*32.+.5)/32.; 
	float d = length(uv-uv0)*32.;
	rgb = smoothstep(rgb, vec3(0.), vec3(d));
	fragColor = vec4(rgb,1.0);
}