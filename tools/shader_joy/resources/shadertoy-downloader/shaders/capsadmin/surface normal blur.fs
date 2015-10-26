float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 rand_normal(vec2 co)
{
	return vec3(rand(co*2.2052), rand(co*5.634), rand(co*12.22225)) * 2.0 - 1.0;
}
/*
vec3 rand_normal(vec2 co)
{
	return texture2D(iChannel1, co * 1.0).xyz * 2.0 - 1.0;
}*/

vec3 textureBlured(samplerCube tex, vec3 tc, vec2 uv, float amt) {
   vec3 res = vec3(0.0);
   const int steps = 4;   
    
   for (int i = 0; i < steps; i++)
   {
       float nrm = (float(i) / float(steps)) * 2.0 - 1.0;
       vec2 offset = vec2(sin(nrm), cos(nrm))*50.0;
       vec3 noise = rand_normal((uv + offset)*iResolution.xy/800.0) * amt;
       res = res + textureCube(tex,tc - noise).xyz;
   }
    
   return res / float(steps);
}

#define PI 3.1415926535897932384626433832795

vec3 obj_pos = vec3(0.0,0.0,-10.0);
float obj_size = 5.0;

float sphere(vec3 dir, vec3 center, float radius) {
    vec3 rp = -center;
	float b = dot(rp,dir);
	float dist = b * b - (dot(rp,rp) - radius * radius);
	if(dist <= 0.0) return -1.0;
	return -b - sqrt(dist);
}


vec3 getColor(vec3 ray, vec2 uv) {
    float dist = sphere(ray,obj_pos,obj_size);    
    if(dist > 0.0) {
        
        // material
        float roughness = sin(iGlobalTime*5.4) * 0.5 + 0.5;
                
    	vec3 point = ray * dist;
    	vec3 normal = point - obj_pos;
        normal = normalize(normal);
              	
        return textureBlured(iChannel0,reflect(ray,normal), uv, roughness);
        
    } else {      
        
        return textureCube(iChannel0,ray).xyz;
    }
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {   
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;
    vec3 dir = normalize(vec3(uv.xy,-1.0));
   
   	// fish eye
    float fe = length(uv.xy);
    dir.z += fe * 0.3;
    dir = normalize(dir);
    
    // rotation
    float c = cos(iGlobalTime);
    float s = sin(iGlobalTime);
    dir.xz = vec2(dir.x * c - dir.z * s, dir.x * s + dir.z * c);
    obj_pos.xz = vec2(obj_pos.x * c - obj_pos.z * s, obj_pos.x * s + obj_pos.z * c);
    
    // color
	fragColor = vec4(getColor(dir, uv),1.0);
}
