void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
   vec2 p = (fragCoord.xy) / vec2(256,256);
   vec2 uv = p  - 0.1 * vec2(iGlobalTime, 0.0);	
	
    //---------------------------------------------	
	// regular texture map filtering
    //---------------------------------------------	
	vec3 colA = texture2D( iChannel0, uv ).xyz;


    fragColor = vec4( colA, 1.0 );
}