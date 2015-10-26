// Created by inigo quilez - iq/2014
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// I create a vertical line pattern which is 8 white pixels wide and 8 black pixels wide. 
// The pattern is moving one pixel to the left every second.
//
// Line 19 tries to detect edges in the iamge (the pattern) by taking derivatives/differences
// of the pixel colros by using GLSL's dFdx() derivative operator. However, the operator only
// detects the edges when the pattern is aligned to an odd pxiel (ever other second), but it
// fails to detect it when the edge happens at the tile boundaries (even pixels)

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float off = iGlobalTime;
    
    vec2 ti = floor((fragCoord.xy+off)/8.0);
    
    float f = mod( ti.x, 2.0 );
    
    if( fragCoord.x>(iResolution.x/2.0) )
        f = clamp( 10.0*abs(dFdx(f)), 0.0, 1.0 );
    
	fragColor = vec4(f,f,f,1.0);
}