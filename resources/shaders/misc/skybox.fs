precision highp float;

// -----------------------------------------------------------------------------
// Per-vertex input
varying vec3 v_skybox_uv;

// -----------------------------------------------------------------------------
// Uniforms
uniform samplerCube skybox_texture;

// -----------------------------------------------------------------------------
// Main routine
void main(void)
{
	gl_FragColor = textureCube(skybox_texture, v_skybox_uv);
}