// Created by inigo quilez - iq/2015
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.

// One simple way to avoid texture tile repetition, at the cost of 4 times the amount of
// texture lookups (still much better than https://www.shadertoy.com/view/4tsGzf)

vec4 hash4( vec2 p ) { return fract(sin(vec4( 1.0+dot(p,vec2(37.0,17.0)), 
                                              2.0+dot(p,vec2(11.0,47.0)),
                                              3.0+dot(p,vec2(41.0,29.0)),
                                              4.0+dot(p,vec2(23.0,31.0))))*103.0); }

vec4 texture2DNoTile( sampler2D samp, in vec2 uv )
{
    vec2 iuv = floor( uv );
    vec2 fuv = fract( uv );

    // generate per-tile transform (needs GL_NEAREST_MIPMAP_LINEARto work right)
    vec4 ofa = texture2D( iChannel1, (iuv + vec2(0.5,0.5))/256.0 );
    vec4 ofb = texture2D( iChannel1, (iuv + vec2(1.5,0.5))/256.0 );
    vec4 ofc = texture2D( iChannel1, (iuv + vec2(0.5,1.5))/256.0 );
    vec4 ofd = texture2D( iChannel1, (iuv + vec2(1.5,1.5))/256.0 );

    // transform per-tile uvs
    vec2 uva = uv*sign(ofa.zw-0.5) + ofa.xy;
    vec2 uvb = uv*sign(ofb.zw-0.5) + ofb.xy;
    vec2 uvc = uv*sign(ofc.zw-0.5) + ofc.xy;
    vec2 uvd = uv*sign(ofd.zw-0.5) + ofd.xy;
        
    // fetch and blend
    vec2 b = smoothstep(0.25,0.75,fuv);

    
    return mix( mix( texture2D( samp, uva ), 
                     texture2D( samp, uvb ), b.x ), 
                mix( texture2D( samp, uvc ),
                     texture2D( samp, uvd ), b.x), b.y );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xx;
	
	float f = smoothstep( 0.4, 0.6, sin(iGlobalTime    ) );
    float s = smoothstep( 0.4, 0.6, sin(iGlobalTime*0.5) );
        
    uv = (4.0 + 16.0*s)*uv;
        
	vec3 cola = texture2DNoTile( iChannel0, uv ).xyz;
    vec3 colb = texture2D( iChannel0, uv ).xyz;
    
    vec3 col = mix( cola, colb, f );
    
	fragColor = vec4( col, 1.0 );
}