const float e = 2.7182818284590452353602874713527;

vec4 noise(vec2 texCoord)
{
    float G = e + (iGlobalTime * 0.001);
    vec2 r = (G * sin(G * texCoord.xy));
    return vec4(fract(r.x * r.y * (1.0 + texCoord.x)));
}


void mainImage(out vec4 o, vec2 texCoord)
{
    o = noise(texCoord);
}