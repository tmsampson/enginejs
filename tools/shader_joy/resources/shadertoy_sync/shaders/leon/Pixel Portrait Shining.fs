#define PI 3.1416
#define POSTERIZE_THRESHOLD 1.1
#define NOISE_LENGTH 0.5

vec2 pixelate ( vec2 pixel, vec2 details ) { return floor(pixel * details) / details; }
vec3 posterize ( vec3 color, float details ) { return floor(color * details) / details; }
float luminance ( vec3 color ) { return (color.r + color.g + color.b) / 3.0; }

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Work in progress on aspect ratio and responsive dimension
    vec2 screenResolution = max(iResolution.xy, 512.0);
    vec2 imageResolution = vec2(pow(2.0, 9.0));
    vec2 pixelResolution = vec2(pow(2.0, 7.0));
    
    // Center & Scale UV
    vec2 uv = fragCoord.xy - (screenResolution - imageResolution) / 2.0;
    uv /= imageResolution;
    
    // Pixelate
   	uv = pixelate(uv, pixelResolution);
    
    // Maths infos about the current pixel position
    vec2 center = uv - vec2(0.5);
    float angle = atan(center.y, center.x);
    float radius = length(center);
    float ratioAngle = (angle / PI) * 0.5 + 0.5;
    
    // Displacement from noise
    vec2 angleUV = mod(abs(vec2(0, angle / PI)), 1.0);
    //angleUV = pixelate(angleUV, vec2(64.0));
    float offset = texture2D(iChannel1, angleUV).r * NOISE_LENGTH;
    
    // Displaced pixel color
    vec2 p = vec2(cos(angle), sin(angle)) * offset + vec2(0.5);
    
    // Apply displacement
    uv = mix(uv, p, step(offset, radius));
    
    // Get color from texture
    vec3 color = texture2D(iChannel0, uv).rgb;
    
    // Retro effect
    color = posterize(color, POSTERIZE_THRESHOLD);
    
    // Just Yellow and Red
    float lum = luminance(color);
    color = mix(vec3(0), vec3(1,0,0), step(0.2, lum));
    color = mix(color, vec3(1,1,0), step(0.5, lum));
    
    
    // Work in progress on colors
    //color = vec3(1.0, 0.64, 0.1) * luminance(color);
    //color = vec3(1.0) * luminance(color);
    
    // Hop
	fragColor = vec4(color,1.0);
}