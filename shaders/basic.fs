precision mediump float;
uniform float time2;

// Input
varying vec2 vs_out_uv;

void main(void)
{
	gl_FragColor = vec4(vs_out_uv.x, vs_out_uv.y, 0.0, 1.0);
}