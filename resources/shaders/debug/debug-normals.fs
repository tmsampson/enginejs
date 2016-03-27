precision highp float;

// Input
varying vec3 v_world_normal;

void main(void)
{
	gl_FragColor = vec4(v_world_normal, 1.0);
}