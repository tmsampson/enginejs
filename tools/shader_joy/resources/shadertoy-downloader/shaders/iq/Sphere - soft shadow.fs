// Created by inigo quilez - iq/2014
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.


// Compute fake soft shadows for sphere objects. You can see this in action here: 
//
// https://www.shadertoy.com/view/lsSSWV
//
// and
//
// https://www.shadertoy.com/view/XdjXWK
//
//
// Related info: http://iquilezles.org/www/articles/spherefunctions/spherefunctions.htm


//-------------------------------------------------------------------------------------------
// sphere related functions
//-------------------------------------------------------------------------------------------

float sphIntersect( in vec3 ro, in vec3 rd, in vec4 sph )
{
	vec3 oc = ro - sph.xyz;
	float b = dot( oc, rd );
	float c = dot( oc, oc ) - sph.w*sph.w;
	float h = b*b - c;
	if( h<0.0 ) return -1.0;
	return -b - sqrt( h );
}


float sphSoftShadow( in vec3 ro, in vec3 rd, in vec4 sph, in float k )
{
    vec3 oc = ro - sph.xyz;
    float b = dot( oc, rd );
    float c = dot( oc, oc ) - sph.w*sph.w;
    float h = b*b - c;
    
#if 0
    // physically plausible shadow
    float d = sqrt( max(0.0,sph.w*sph.w-h)) - sph.w;
    float t = -b - sqrt( max(h,0.0) );
    return (t<0.0) ? 1.0 : smoothstep(0.0, 1.0, 2.5*k*d/t );
#else
    // cheap but not plausible alternative
    return (b>0.0) ? step(-0.0001,c) : smoothstep( 0.0, 1.0, h*k/b );
#endif    
}    
            
float sphOcclusion( in vec3 pos, in vec3 nor, in vec4 sph )
{
    vec3  r = sph.xyz - pos;
    float l = length(r);
    return dot(nor,r)*(sph.w*sph.w)/(l*l*l);
}

vec3 sphNormal( in vec3 pos, in vec4 sph )
{
    return normalize(pos-sph.xyz);
}

//=====================================================

vec2 hash2( float n ) { return fract(sin(vec2(n,n+1.0))*vec2(43758.5453123,22578.1459123)); }

float iPlane( in vec3 ro, in vec3 rd )
{
    return (-1.0 - ro.y)/rd.y;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = (2.0*fragCoord.xy-iResolution.xy) / iResolution.y;
    
	vec3 ro = vec3(0.0, 0.0, 4.0 );
	vec3 rd = normalize( vec3(p,-2.0) );
	
    // sphere animation
    vec4 sph = vec4( cos( iGlobalTime + vec3(2.0,1.0,1.0) + 0.0 )*vec3(1.5,0.0,1.0), 1.0 );
sph.x = 1.0;    
    vec3 lig = normalize( vec3(0.6,0.3,0.4) );
    vec3 col = vec3(0.0);

    float tmin = 1e10;
    vec3 nor;
    float occ = 1.0;
    
    float t1 = iPlane( ro, rd );
    if( t1>0.0 )
    {
        tmin = t1;
        vec3 pos = ro + t1*rd;
        nor = vec3(0.0,1.0,0.0);
        occ = 1.0-sphOcclusion( pos, nor, sph );
    }
#if 1
    float t2 = sphIntersect( ro, rd, sph );
    if( t2>0.0 && t2<tmin )
    {
        tmin = t2;
        vec3 pos = ro + t2*rd;
        nor = sphNormal( pos, sph );
        occ = 0.5 + 0.5*nor.y;
	}
#endif 
    if( tmin<1000.0 )
    {
        vec3 pos = ro + tmin*rd;
        
		col = vec3(1.0);
        col *= clamp( dot(nor,lig), 0.0, 1.0 );
        col *= sphSoftShadow( pos, lig, sph, 2.0 );
        col += 0.05*occ;
	    col *= exp( -0.05*tmin );
    }

    col = sqrt(col);
    fragColor = vec4( col, 1.0 );
}