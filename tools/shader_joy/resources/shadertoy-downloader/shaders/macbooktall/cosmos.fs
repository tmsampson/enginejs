void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	//init to middle of screen
    vec2 p = fragCoord.xy / iResolution.xy;
    //alias time
    float time = iGlobalTime*0.2;
    //init c
	vec3 c=vec3(0);
    for(float r=1.0;r<4.0;r+=0.5){
    	for(int i=0;i<20;i++){
            //create a position for each point
            float t = 2.0*3.14*float(i)/20.0 * time * r;
            //sohcahtoa
            float x = cos(t)+1.25*r;
            float y = sin(t)+1.25*r;
            //radius
            vec2 o = .4/r*vec2(x,y);
            //from middle to radius
            c.x += 0.001/(length(p-o))*0.25*r;
            c.z += 0.002/(length(p-o))*0.235*r;
        }
    }
    fragColor = vec4(c,1);
}