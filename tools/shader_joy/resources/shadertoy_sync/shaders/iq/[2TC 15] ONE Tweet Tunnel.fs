// Created by inigo quilez - iq/2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

void mainImage( out vec4 c, in vec2 p )
{
    p = p/iResolution.y - .5;
    c.w = length(p);
    c = texture2D( iChannel0, vec2(atan(p.y,p.x), .2/c.w)+iGlobalTime )*c.w;
}