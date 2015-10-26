void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 flame;
    flame.x=sin(iGlobalTime)*1.0;
    flame.y=sin(iGlobalTime)*1.0;
	

    vec2 position = ( fragCoord.xy / iResolution.xy );
	position = position - 0.5;  //here I minus 0.5 because CCzero point on iPad is left courner.
	position.x *= iResolution.x/iResolution.y;
    position.x *= flame.x;
    position.y *= flame.y;
    float c = sqrt(position.x*position.x+position.y*position.y);
	
    vec2 uv = fragCoord.xy / iResolution.xy;
	
	fragColor = vec4(vec2(1.0 - c*2.0)+0.5*sin(iGlobalTime),uv.x+0.5*sin(iGlobalTime), 1.0 );
    
}