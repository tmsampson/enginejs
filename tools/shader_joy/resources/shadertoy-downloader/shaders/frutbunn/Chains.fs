// http://www.letsdive.in/2014/05/18/glsl---raymarching/
// http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm
// http://www.iquilezles.org/www/articles/smin/smin.htm

#define PI 3.14159265358979323846

#define MAX_DISTANCE 		100.
#define MARCHING_STEP_INC 	.65
#define EPSILON 			0.01

#define MAX_COLOR_BLEED 	.5

#define MAX_STEPS 			70

#define ANIMATION_SPEED		15.

#define LIGHT_BRIGHTNESS	2.

/*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*
 */

// Current pixel color + z buffer depth (probably not a good way to add different colors
// to the depth field, but works)!
float zdepth = 10000.;
vec3 current_color = vec3(0.);

/*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*
 */

// Linear displacement timer - probably a faster way of doing this, but works!
float timer(float seconds, float min_val, float max_val) {
	return ( (mod(iGlobalTime, seconds) * (max_val - min_val)) / seconds ) + min_val;
}

vec3 rot_x(vec3 p, float rad) {
	float c = cos(rad); float s = sin(rad);
	return vec3(p.x, p.y*c+p.z*s, -p.y*s+p.z*c);
}

vec3 rot_y(vec3 p, float rad) {
	float c = cos(rad); float s = sin(rad);
	return vec3(p.x*c+p.z*s, p.y, -p.x*s+p.z*c);
}

vec3 rot_z(vec3 p, float rad) {
	float c = cos(rad); float s = sin(rad);
	return vec3(p.x*c+p.y*s, -p.x*s+p.y*c, p.z);
}

/*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*
 */

float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float smin( float a, float b )
{
	float k =68.7;
    
    float res = exp( -k*a ) + exp( -k*b );
    return -log( res )/k;
}

vec3 opTwist( vec3 p )
{
#	define TWIST 0.11
    
	float c = cos(TWIST*p.z+TWIST);
	float s = sin(TWIST*p.z+TWIST);
	mat2 m = mat2(c,-s,s,c);

    return vec3(m*p.xy,p.z);
}

/*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*
 */

// Current pixel color within the scene - will be blended with texture below.
// Probably a better way of doing this, but it works!
void zcolor(float new, vec3 color) {
	float d = smoothstep(new-MAX_COLOR_BLEED, new+MAX_COLOR_BLEED, zdepth);
	zdepth= new*(d) + zdepth*(1.-d);
    current_color = (1.-d)*current_color + (d)*color;
}

float scene1(vec3 p) {
   	const vec3 c = vec3(2.);
    
	p= opTwist(p);

	p.x-=2.;
    vec3 r = mod(p, c)-.5*c;
	float o1 = sdTorus(r, vec2(.545, .05));
	zcolor(o1, vec3(.6,.7, 0.8));
    
	p.z+=5.;
	p = rot_z(p, PI/2.);
    r = mod(p, c)-.5*c;
	float o2 = sdTorus(r, vec2(.545, .05));
	zcolor(o2, vec3(1.,.7, 0.4));
    
	return smin(o1, o2);
}

float get_distance(vec3 p) {
	return scene1(p);
}

float march(vec3 ray_origin, vec3 ray_direction) {
    float d = 0.0;

	for (int i = 0; i < MAX_STEPS; i++) {
		vec3 np = ray_origin + ray_direction*d;
		float s = get_distance(np);

        if (s < EPSILON)
            return d;

        d += s*MARCHING_STEP_INC;

        if (d > MAX_DISTANCE) return MAX_DISTANCE;
	}
	return MAX_DISTANCE;
}

vec3 calc_normal(vec3 p) {
	float d0 = get_distance(p);
    
	float dX = get_distance(p - vec3(EPSILON, 0.0, 0.0));
	float dY = get_distance(p - vec3(0.0, EPSILON, 0.0));
	float dZ = get_distance(p - vec3(0.0, 0.0, EPSILON));

	return normalize(vec3(dX-d0, dY-d0, dZ-d0));
}

vec4 texture_pixel (sampler2D t, vec3 p, vec3 n, float scale) {
	return texture2D(t, p.yz * scale) * abs (n.x)
	 + texture2D(t, p.xz * scale) * abs (n.y)
	 + texture2D(t, p.xy * scale) * abs (n.z);
}

vec2 correct_aspect_ratio(in vec2 fragCoord) {
	vec2 uv = (fragCoord.xy / iResolution.xy) - vec2(.5);
    uv.x *= iResolution.x/iResolution.y;
    
    return uv;
}

/*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*	*
 */

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	float eye_z=sin(mod(iGlobalTime, 100.))*4.;
    
    // Eye position and light position:
	vec3 eye_pos = vec3(0.0, 0.0, -3.+eye_z);
    vec3 light = vec3(1., 1., -3.+eye_z);
    
    // For calc'n the surface normal:
    vec3 forward = 	vec3(.0, .0, 1.);
	vec3 up = 		vec3(.0, 1., .0);
    
    // Timers for animation/rotation etc:
    float rx = timer(ANIMATION_SPEED ,0., PI*2.);    
    float ry = timer(ANIMATION_SPEED ,0., PI*2.);
    
	float rz = timer(20. ,0., PI*2.);

	float wait = timer(ANIMATION_SPEED*2., 0., 2.);

    // Spin off into the scene for half the animation cycle:
	if (floor(wait)==1.) {
		eye_pos = rot_x(eye_pos, rx);
		forward = rot_x(forward, rx);
		up = rot_x(up, rx);
		light = rot_x(light, rx);

        eye_pos = rot_y(eye_pos, ry);
		forward = rot_y(forward, ry);
		up = rot_y(up, ry);
		light = rot_y(light, ry);       
	}

    // Rotate:
	eye_pos = rot_z(eye_pos, rz);
	forward = rot_z(forward, rz);
	up = rot_z(up, rz);

    // Rotate light:
    light = rot_z(light, rz);
    light = rot_x(light, rz);

    // Ray march:
    vec2 uv = correct_aspect_ratio(fragCoord);
    
	vec3 right = cross(up, forward);
	vec3 ray_dir = normalize(up * uv.y + right*uv.x + forward);
    
	float d = march(eye_pos, ray_dir);
    
	// Store final color after marching as calc_normal for lighting below will ruin final pixel
	// color calc'd:
	vec3 finalcolor = current_color;    
    
    // Calc lighting if pixel falls within scene:
    if (d < MAX_DISTANCE) {
   		// Light direction:     
  		vec3 p = (eye_pos+ray_dir*d);
  		vec3 p_normal = calc_normal(p);
  		vec3 light_dir = -normalize(light-p);

        // Calc attenuation:
        //
        // Mental note to self:
        // The biger K is the quicker light weakens with distance - don't forget location of 
        // light source - I won't fall for that one again!
#		define K .155
        float attenuation = 1. / (1. + K*pow( length(light -(p)), 2.0));
        
        // Calc ambient light:
        const float ambient_component = .1;
        float ambient = 1.;
  
        // Calc diffuse light:
        const float diffuse_component = .5;
		float diffuse = max(0.,  dot(light_dir, p_normal));
        
        // Calc specular light:
        const float specular_component = .4;
        const float material = 15.;
        vec3 reflected_light_dir = reflect(-light_dir, p_normal);
        float specular = min(1., pow( max(dot(reflected_light_dir, light_dir), 0.0), material) );
        
        // Calc final light density (the min allows components to be cranked up a bit):
		float light_density = min(1., 
         (diffuse*diffuse_component + ambient*ambient_component + specular*specular_component) );
        light_density*= attenuation;
        
		// Calc final color:        
        finalcolor *= vec3(light_density);
        
        // Add texture:
        const float texture_component = 1.3;
        const float texture_scale = .5;
        vec4 tex_col = texture_pixel(iChannel0, p, (p_normal), texture_scale);
        const float color_component = 1.7;

        // Final color within the scene:
        finalcolor = finalcolor*color_component + tex_col.rgb*texture_component*(light_density*LIGHT_BRIGHTNESS);
 	} else {
        // Final color outside the scene:
        finalcolor = vec3(0.01);
    }

	fragColor = vec4(finalcolor, 1.);
}