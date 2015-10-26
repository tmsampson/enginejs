
float snoise(in vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float n = snoise(vec2(fragCoord.x*cos(iGlobalTime),fragCoord.y*sin(iGlobalTime))); 
	fragColor = vec4(n, n, n, 1.0 );
}




