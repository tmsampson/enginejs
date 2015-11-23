precision highp float;

// Input
varying vec2 v_uv;
uniform sampler2D u_tx0;

void main(void)
{
	gl_FragColor = texture2D(u_tx0, v_uv.xy);
}