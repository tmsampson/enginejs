vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
} 

float lum(vec3 c) {
     return dot(c, vec3(0.3, 0.59, 0.11));
 }
 
vec3 clipcolor(lowp vec3 c) {
     float l = lum(c);
     float n = min(min(c.r, c.g), c.b);
     float x = max(max(c.r, c.g), c.b);
     
     if (n < 0.0) {
         c.r = l + ((c.r - l) * l) / (l - n);
         c.g = l + ((c.g - l) * l) / (l - n);
         c.b = l + ((c.b - l) * l) / (l - n);
     }
     if (x > 1.0) {
         c.r = l + ((c.r - l) * (1.0 - l)) / (x - l);
         c.g = l + ((c.g - l) * (1.0 - l)) / (x - l);
         c.b = l + ((c.b - l) * (1.0 - l)) / (x - l);
     }
     
     return c;
 }
 
vec3 setlum(vec3 c, float l) {
	 float d = l - lum(c);
     c = c + vec3(d);
     return clipcolor(c);
 }

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    vec4 textureColor = texture2D(iChannel0, uv);
     
     uv.x = (abs(uv.x*2.0-1.0));
     uv.y = (abs(uv.y*2.0-1.0));
     
    vec2 yoloL = vec2(uv.x - mod(sin(uv.x*uv.y), 1.0), uv.x);
    vec2 yoloR = vec2(uv.x + mod(sin(uv.x*uv.y), 1.0), uv.y);

     vec4 outputColorL = texture2D(iChannel0, yoloL);
     vec4 outputColorR = texture2D(iChannel0, yoloR);
     
     vec4 outputColor = vec4(sin(uv.x ) / sin(uv.y )*outputColorR.g, 0.0,cos(uv.y*uv.x )*outputColorR.r, textureColor.a);;
     outputColor.rgb = rgb2hsv(outputColor.rgb);
     outputColor.r += mod(iGlobalTime*0.1, 1.0);
     outputColor.rgb = hsv2rgb(outputColor.rgb);
     fragColor = outputColor;
}