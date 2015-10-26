void mainImage( inout vec4 f, vec2 c )
{
    c.y/=.26;
    f.brg=cross(mod(c.xxy,.3),c.yxx*sin(iDate.w));
}