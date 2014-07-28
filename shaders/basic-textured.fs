precision mediump float;

// Input
varying vec2 vs_out_uv;
uniform sampler2D tx0;

void main(void)
{
	vec2 uv = vs_out_uv.xy;

#ifdef FLIP_Y
	uv.y = 1.0 - uv.y;
#endif

	gl_FragColor = texture2D(tx0, uv);
}