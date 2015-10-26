void mainImage( out vec4 f, in vec2 w )
{
    vec2 s = iResolution.xy;
    
    float 
        z = 25.,
        r = s.x/s.y*z,
        p, c;
        
    s = z * (2.*w -s)/s.y;
   
    p = length(s);
    
    c = .3 / (s.y + z) - .3 / (s.y - z) + .3 / (s.x + r) - .3 / (s.x - r);
    
    s += p * cos( p - vec2(9.4,8.6) * iDate.w ); 
    
    c += 2. / dot(s, s); 

    c = smoothstep(c -2., c +1.2, 1.);

   	f = vec4(c, -2./c + c*3., -4./c + c*5., 1);

}
