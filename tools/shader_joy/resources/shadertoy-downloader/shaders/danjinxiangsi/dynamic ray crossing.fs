void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    float time= sin(iGlobalTime)*.5;
	vec2 position = (fragCoord.yx/iResolution.yx) - 0.5;
	
	float px = 0.2 * (position.x+0.8);
	float py = 2.0 / (500.0 * abs(position.y - px)*time);
    py += 2.0 / (500.0 * abs(position.y + px)*time);

    
	py += (1.+time)/length(25.*length(position - vec2(0, position.y)));
	
	py += (1.+time)/length(25.*length(position - vec2(position.x, 0)));


	fragColor = vec4( py,  0.3 * py, 0.3 *py, 1.0);


}