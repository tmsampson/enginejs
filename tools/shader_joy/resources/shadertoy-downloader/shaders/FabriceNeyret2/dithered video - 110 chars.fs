// inspired by https://www.shadertoy.com/view/lllSRj


void mainImage( inout vec4 o, vec2 i ) { 

// --- color version (base = 110 chars)
    o += step(texture2D(iChannel0, i/8.), texture2D(iChannel1,i/iResolution.xy));

    
    
// --- color version + gamma correction ( + 15 chars):     
//   o += step(pow(texture2D(iChannel0, i/8.),vec4(.45)), texture2D(iChannel1,i/iResolution.xy));

    
    
// --- B&W version ( base + 1 chars): 
// texture2D(iChannel0, i/8.).r < texture2D(iChannel1,i/iResolution.xy).r  ? o++ : o;
    

    
// --- B&W version + gamma correction ( + 9 chars): 
// pow(texture2D(iChannel0, i/8.).r, .45) < texture2D(iChannel1,i/iResolution.xy).r  ? o++ : o;
}