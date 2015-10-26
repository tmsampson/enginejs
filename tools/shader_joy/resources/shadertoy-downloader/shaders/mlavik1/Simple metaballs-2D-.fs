uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// influence threshold
const float threshold = 0.95;


struct Metaball
{
	vec3 colour;
	vec2 position;
	float radius;
};

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	Metaball metaballs[4];
	// add metaballs (colour, position, radius)
	metaballs[0] = Metaball(vec3(1,0,0), vec2(100.0,90.0), 60.0);
	metaballs[1] = Metaball(vec3(0,1,0), vec2(120.0,200.0), 50.0);
	metaballs[2] = Metaball(vec3(0,0,1), vec2(200.0,90.0), 45.0);
	metaballs[3] = Metaball(vec3(1,0,0), vec2(400.0,190.0), 45.0);
	// animate(rotate) some of the metaballs
	metaballs[0].position.x = iResolution.x*sin(iGlobalTime*1.2314)/2.0  + iResolution.x/2.0;
	metaballs[0].position.y = iResolution.y*cos(iGlobalTime*1.2314)/2.0  + iResolution.y/2.0;	
	metaballs[1].position.x = iResolution.x*sin(iGlobalTime*1.2314)/2.0  + iResolution.x/2.0;
    	
	
	vec3 col = vec3(0,0,0); // colour = sum(metaball.colour * influence)
	float infl = 0.0;	// total influence
	for(int i = 0; i < 4; i++)
	{
		Metaball mb = metaballs[i];
        // distance from pixel to metaball centre
		float dist = length(fragCoord.xy - mb.position);
        // influence from current metaball
		float currInfl = mb.radius * mb.radius;
		currInfl /= (pow(abs(fragCoord.x-mb.position.x),2.0) + pow(abs(fragCoord.y-mb.position.y),2.0));
		infl += currInfl;
		col += mb.colour*currInfl;
	}
	// normalise, if influence > threshold
	if(infl > threshold)
		col = normalize(col);
	// show outer line
    col = mix(col, vec3(1.0), smoothstep(threshold+0.05, threshold, infl) * smoothstep(threshold-0.05, threshold, infl));
		
	fragColor.xyz = col;

}