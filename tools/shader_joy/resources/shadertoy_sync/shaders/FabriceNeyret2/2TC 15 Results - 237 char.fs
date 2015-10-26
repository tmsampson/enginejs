// compacting  nimitz's shader https://www.shadertoy.com/view/Mtf3Rj    294 chars -> 237

void mainImage(inout vec4 f, vec2 w) {
    w = w/iResolution.xy*6.-3.;	 w.x -= iDate.w*.4;
    for(int i=0; i<27; i++) {      
        vec2 p = sin( vec2(1.6,0) + iDate.w + 11.*texture2D(iChannel0, w/345.).xy );
        f += (2.-abs(w.y)) * vec4(i, 10, 7, 300)/833.,
        f *= .03*(p.x+p.y)+.98,
        w -= p*.02;
    }
}
