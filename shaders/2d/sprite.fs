precision mediump float;

// Input
varying vec2 v_uv;
uniform sampler2D u_tx0;
uniform vec4 u_tint; // alpha in w

void main(void)
{
	vec2 uv = v_uv.xy;

	#ifdef FLIP_Y
		uv.y = 1.0 - uv.y;
	#endif

	gl_FragColor = texture2D(u_tx0, uv) * u_tint;
}