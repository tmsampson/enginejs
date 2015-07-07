precision highp float;

// Input
varying vec2 v_uv;
uniform sampler2D u_tx0;
uniform float u_time;

void main(void)
{
	vec2 uv = v_uv.xy * 0.5;
	uv.x += u_time * 0.1;
	gl_FragColor = texture2D(u_tx0, uv);
}