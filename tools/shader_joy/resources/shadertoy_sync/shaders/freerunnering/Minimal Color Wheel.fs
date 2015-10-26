const float M_PI = 3.14159265359;

vec3 hsl2rgb( in vec3 c ){
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0,1.0);
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Position normalised into (0, 1)
    vec2 position = fragCoord.xy/iResolution.xy;
    // Position normalised into (-1, 0, 1)
    vec2 d = 1.0 - (position * 2.0);
    
    // Distance from screen center
    float dist = sqrt((d.x*d.x) + (d.y*d.y));
    
    // Rotation
    float r = acos(d.x / dist);
    if (d.y < 0.0) { r = M_PI-(r + M_PI); } // Sort out the bottom half (y=-1)
    
    r += (M_PI * 0.5); // Rotate by 90 degrees (red on top, not left)
    
    // From radians (0 - 2_PI) to hue (0 - 1)
    float hue = ((r / M_PI) / 2.0);
    
    // Into color
    fragColor = vec4(hsl2rgb( vec3(hue, 1.0, 0.5)), 1.0);
}
