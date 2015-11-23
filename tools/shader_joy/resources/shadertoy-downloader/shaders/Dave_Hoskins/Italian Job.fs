// "You're only supposed to blow the bloody doors off!"
// From The Italian Job.
// By David Hoskins. Aug.'14.
// Uses sinusoidal speech construction.

// https://www.shadertoy.com/view/4ssSWs

//========================================================================

#define TAU  6.2831
vec2 randValues;
const vec2 INV_SCALE  = 1.0 / vec2(509.0, 509.0*450.0/800.0);
vec3 col = vec3(214, 158, 49)/ 255.0;
vec2 uv;
vec2 fcoord;


//========================================================================
float Hash(float x)
{
	return fract(sin(x * 14093.49483) * 5033113.31541)-.5;
}

//========================================================================
vec2 Hash2( vec2 x )
{
	float n = dot(x,vec2(2.12313,3.94871)) + iGlobalTime;
    return fract(sin(n)*vec2(3758.5233,2578.1459));
}

//========================================================================
vec2 unpackCoord(float f) 
{
    vec2 ret = vec2(mod(f, 512.0),floor(f / 512.0)) * INV_SCALE;
    return ret;
}

//========================================================================
vec2 unpackColour(float f) 
{
    return vec2(mod (f, 256.0),floor(f / 256.0)) / 256.0;
}

//========================================================================
void Tri(float pA, float pB, float pC, float pCol1, float pCol2)
{
	vec2 pos = uv;
	vec2 a = unpackCoord(pA);
	vec2 b = unpackCoord(pB);
	vec2 c = unpackCoord(pC);
	pos += Hash2(fcoord.xy) * randValues.x - randValues.y;

	// Triangle test...
	vec2 as = pos-a;
	vec2 bs = pos-b;
	if  ( (b.x-a.x)*as.y-(b.y-a.y)*as.x > 0.0 &&
		  (a.x-c.x)*as.y-(a.y-c.y)*as.x > 0.0 &&
    	  (c.x-b.x)*bs.y-(c.y-b.y)*bs.x > 0.0)
	{
		vec2 c1 = unpackColour(pCol1);
		vec2 c2 = unpackColour(pCol2);
		col = mix (col, vec3(c1.x, c1.y, c2.x), c2.y); 
	}
}

//========================================================================
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    fcoord = fragCoord;
	uv = fragCoord.xy / iResolution.xy;
    vec2 aspect = vec2(1.0, iResolution.y / iResolution.x);
    float t = mod(iGlobalTime, 11.1);
    randValues = vec2(0.01, 0.005) * (1.0 + pow(smoothstep(4.5, 0.0, t), 2.0) * 50.0 * smoothstep(60.0, 58.0, iGlobalTime));
	
	// Packed data parameters:
	// Tri( X1/Y1, X2/Y2, X3/y3, RG, BA)
	Tri(2237., 59215.,68947., 35309., 11619.);
	Tri(69643., 139496.,145145., 33951., 8279.);
	Tri(127627., 82707.,108333., 65021., 15099.);
	Tri(112694., 87191.,115349., 6., 14963.);
	Tri(97154., 98724.,86578., 28258., 9218.);
	Tri(99189., 69728.,70246., 11189., 8680.);
	Tri(111289., 102480.,17136., 1987., 15221.);
	Tri(118262., 139172.,139801., 38110., 11311.);
	Tri(38703., 80625.,2304., 65275., 15090.);
	Tri(65180., 76521.,123660., 28654., 12663.);
	Tri(126977., 126984.,126984., 44638., 9026.);
	Tri(-72., 29968.,-272., 64236., 15101.);
	Tri(49332., 72069.,53391., 57423., 5278.);
	Tri(12517., 85798.,109812., 63486., 14037.);
	Tri(23695., 13130.,65135., 5787., 13133.);
	Tri(97460., 99073.,109295., 258., 15114.);
	Tri(72871., 81200.,89912., 3644., 14337.);
	Tri(2986., 11660.,14693., 62700., 11459.);
	Tri(82572., 78986.,110443., 3104., 11918.);
	Tri(139044., 110102.,128827., 60406., 15174.);
	Tri(108818., 81047.,41580., 821., 12149.);
	Tri(78122., 89852.,7422., 1802., 14855.);
	Tri(112501., 90990.,127873., 42161., 12823.);
	Tri(12959., 122440.,116267., 26., 15108.);
	Tri(89895., 33023.,29491., 3945., 14599.);
	Tri(-115., 4520.,5815., 65013., 15002.);
	Tri(41078., 110731.,116803., 3., 15154.);
	Tri(-288., 4857.,53553., 512., 15106.);
	Tri(44700., 25257.,53029., 10770., 14958.);
	Tri(83756., 36623.,86341., 65021., 15288.);
	Tri(97986., 100518.,51350., 62973., 15161.);
	Tri(76832., 138964.,142538., 62173., 9656.);
	Tri(45970., 45970.,146811., 25870., 10999.);
	Tri(127558., 22695.,33998., 783., 15167.);
	Tri(114817., 135936.,113195., 62974., 14016.);
	Tri(366., 141970.,278., 64500., 15325.);
	Tri(78410., 64731.,123980., 11., 15187.);
	Tri(95950., 43160.,92388., 64763., 15274.);
	Tri(46435., 142376.,86224., 23773., 13366.);
	Tri(86667., 65218.,68328., 518., 15157.);
	Tri(115878., 104621.,76574., 10438., 15107.);
	Tri(62698., 89228.,70315., 2049., 15268.);
	Tri(115890., 129756.,123555., 774., 15110.);
	Tri(108085., -335.,-262., 264., 14940.);
	Tri(89623., 136850.,133245., 65015., 15333.);
	Tri(32158., 39319.,44945., 50586., 14871.);
	Tri(107008., 68818.,107008., 10543., 13516.);
	Tri(114379., 89849.,103168., 1283., 15156.);
	Tri(102578., 82531.,68263., 35321., 15180.);
	Tri(142518., 55625.,137976., 52946., 14704.);
	Tri(101602., 93003.,102171., 1557., 13846.);
	Tri(87701., 95394.,28167., 49390., 12037.);
	Tri(116265., 107277.,145617., 61670., 13493.);
	Tri(137839., 13634.,141603., 65022., 7879.);
	Tri(107173., 125618.,96333., 2561., 15184.);
	Tri(79215., 84835.,134297., 19582., 8242.);
	Tri(34471., 36047.,102527., 55037., 15182.);
	Tri(130726., 96046.,98640., 33448., 8229.);
	Tri(89021., 23762.,96214., 42743., 13614.);
	Tri(189., 18609.,12956., 3331., 14429.);
	Tri(-439., -439.,84330., 29127., 10137.);
	Tri(31831., 146573.,142974., 31172., 10562.);
	Tri(53503., 77073.,47259., 4., 15116.);
	Tri(35800., 39935.,28051., 26892., 15211.);
	Tri(123997., 127315.,136999., 11091., 12351.);
	Tri(84356., 69667.,69157., 35810., 10065.);
	Tri(4775., 130697.,96831., 513., 14962.);
	Tri(113717., 63692.,82615., 259., 11660.);
	Tri(142604., 127228.,22314., 48330., 12131.);
	Tri(2269., 47408.,72266., 27390., 14920.);
	Tri(86768., 49527.,90356., 7071., 13116.);
	Tri(52342., 28438.,82149., 16894., 12292.);
	Tri(40598., 84382.,85875., 30914., 8971.);
	Tri(38211., 47374.,73844., 47742., 7944.);
	Tri(90837., 67170.,45132., 40927., 14409.);
	Tri(99396., 109109.,70225., 63228., 15342.);
	Tri(37498., 135729.,34421., 39663., 15217.);
	Tri(41179., 31975.,97254., 46787., 7725.);
	Tri(44711., 93361.,40099., 45538., 9886.);
	Tri(10406., 10971.,61808., 42491., 15133.);
	Tri(21139., 61161.,88289., 26105., 15152.);
	Tri(70815., 109637.,41080., 518., 15174.);
	Tri(117318., 124928.,52803., 40667., 14893.);
	Tri(137899., 135846.,51032., 3870., 11016.);
	Tri(334., 110897.,57501., 65276., 11937.);
	Tri(53029., 86314.,93759., 14023., 7963.);
	Tri(108789., 60768.,127406., 36813., 13358.);
	Tri(38125., 73590.,88961., 44493., 10801.);
	Tri(66984., 20420.,20420., 24246., 7876.);
	Tri(117061., 68352.,53499., 357., 15112.);
	Tri(78562., 84194.,86611., 3334., 15188.);
	Tri(82611., 29374.,109248., 5403., 7763.);
	Tri(85733., 77896.,80173., 1571., 14643.);
	Tri(64933., 90960.,-210., 37824., 13613.);
	Tri(86183., 44748.,84690., 1025., 12666.);
	Tri(62049., 52888.,127652., 1829., 14934.);
	Tri(63747., 66318.,133330., 2., 14629.);
	Tri(90229., 38964.,87160., 37869., 7990.);
	Tri(64026., 52250.,69546., 39375., 8229.);
	Tri(104675., 34588.,125154., 2805., 10597.);
	Tri(95341., 114853.,115830., 512., 14899.);
	Tri(126097., 127605.,106677., 9., 13831.);
	Tri(112456., 140440.,109220., 64254., 15295.);
	Tri(-324., 62148.,16534., 1., 15195.);
	Tri(127915., 2537.,2537., 52436., 13437.);
	Tri(72522., 83223.,63316., 54335., 10032.);
	Tri(29827., 103553.,90720., 23283., 9831.);
	Tri(118090., 63009.,63024., 44791., 8069.);
	Tri(138845., 78166.,136314., 817., 9216.);
	Tri(99623., 130757.,59214., 57597., 12856.);
	Tri(-243., 20769.,166., 9985., 15167.);
	Tri(146435., 145897.,146435., 7936., 7735.);
	Tri(12471., 11389.,11391., 64323., 14616.);
	Tri(139495., 130138.,124690., 65003., 14774.);
	Tri(135922., 107008.,127753., 55037., 15234.);
	Tri(48917., 63797.,58133., 2882., 14592.);
	Tri(125150., 98479.,95973., 36852., 15109.);
	Tri(70757., 55409.,111903., 17921., 8811.);
	Tri(141349., 142371.,65718., 4552., 12515.);
	Tri(141412., 137752.,53284., 37848., 15167.);
	Tri(64648., 67711.,62591., 63486., 15248.);
	Tri(133911., 139688.,130238., 57686., 11393.);
	Tri(53936., 48294.,48832., 512., 15137.);
	Tri(95391., 127608.,119403., 812., 14870.);
	Tri(37888., 124617.,118953., 34298., 8758.);
	Tri(88917., 109752.,99997., 2171., 9486.);
	Tri(84576., 127640.,124017., 517., 15145.);
	Tri(4373., 38188.,27927., 37706., 10553.);
	Tri(21232., 53569.,55517., 64764., 14670.);
	Tri(103136., 103667.,114400., 2557., 15346.);
	Tri(131117., 141179.,142345., 40907., 12083.);
	Tri(100004., 129248.,128710., 63972., 13238.);
	Tri(124930., 119506.,121578., 14200., 10003.);
	Tri(8300., 110169.,1133., 45673., 14415.);
	Tri(66821., 45224.,33015., 56044., 15129.);
	Tri(67877., 100117.,51987., 1026., 15105.);
	Tri(60172., 100972.,48423., 54238., 8307.);
	Tri(21922., 21922.,75972., 63031., 10816.);
	Tri(37650., 95583.,85322., 51916., 8579.);
	Tri(56231., 57270.,61419., 47100., 11065.);
	Tri(142964., 128629.,127627., 65016., 12569.);
	Tri(94277., 72787.,130696., 1281., 15150.);
	Tri(105027., 10909.,51382., 516., 15204.);
	Tri(56592., 112880.,96488., 15., 15195.);
	Tri(268., 115850.,180., 846., 10614.);
	Tri(85163., 132962.,65562., 39422., 11336.);
	Tri(110101., 110101.,33789., 43700., 8234.);
	Tri(54604., 130877.,143162., 4591., 9351.);
	Tri(31507., 77139.,133883., 57598., 8856.);
	Tri(125783., 125195.,104554., 62688., 10162.);
	Tri(136023., 125244.,95515., 59837., 7749.);
	Tri(146658., 56131.,101681., 65019., 13208.);
	Tri(119885., 117721.,118230., 65217., 8524.);
	Tri(74474., 85261.,131167., 40441., 12365.);
	Tri(71957., 93380.,66164., 261., 13897.);
	Tri(126756., 119456.,103133., 65018., 15019.);
	Tri(117844., 109637.,91713., 65277., 15351.);
	Tri(70361., 80582.,18110., 609., 11886.);
	Tri(125696., 109814.,18747., 65020., 15235.);
	Tri(118134., 59034.,49317., 51453., 15194.);
	Tri(44852., 9253.,35635., 45802., 9534.);
	Tri(661., 661.,90914., 59132., 10193.);
	Tri(59213., 139068.,144123., 37581., 13845.);
	Tri(125093., 120487.,79780., 2414., 11013.);
	Tri(77946., 80093.,84705., 260., 15217.);
	Tri(76097., 77603.,26394., 63208., 3567.);
	Tri(101747., 127725.,44867., 46286., 11332.);
	Tri(60740., 37661.,57158., 38333., 12597.);
	Tri(69424., 52873.,58663., 65271., 11712.);
	Tri(38104., 73472.,28820., 41213., 15187.);
	Tri(35615., 105048.,17148., 20675., 11586.);
	Tri(66984., 96907.,94340., 613., 8466.);
	Tri(142696., 33642.,142696., 29354., 13923.);
	Tri(201., 26315.,23181., 1216., 11862.);
	Tri(94434., 63209.,63239., 64493., 14912.);
	Tri(63146., 43579.,72108., 40422., 8261.);
	Tri(22938., 30014.,22427., 37584., 8534.);
	Tri(127518., -451.,8342., 41935., 12597.);
	Tri(20713., -131.,9637., 64753., 15248.);
	Tri(4096., 6152.,22081., 21428., 11449.);
	Tri(74496., 141425.,78064., 57085., 9924.);
	Tri(23060., 132187.,132187., 8235., 9200.);
	Tri(141477., 5937.,124222., 65274., 8381.);
	Tri(118469., 267.,348., 64222., 15240.);
	Tri(68364., 14674.,14707., 35538., 13357.);
	Tri(144231., 140546.,51053., 37328., 13860.);
	Tri(126755., 144103.,145085., 28375., 14850.);
	Tri(47679., 146205.,144153., 38398., 10240.);
	Tri(47923., 52007.,46892., 1548., 15110.);
	Tri(45380., 106725.,107739., 824., 10846.);
	Tri(136925., 136413.,136504., 37769., 11920.);
	Tri(119525., 34991.,37650., 33533., 13069.);
	Tri(135612., 135313.,135620., 14731., 10331.);
	Tri(136011., 97026.,126294., 38370., 8534.);
	Tri(19083., 36577.,36027., 3072., 15196.);
	Tri(118500., 65283.,68901., 10., 13384.);
	Tri(112588., 144192.,45873., 41949., 14649.);
	Tri(142453., 40045.,88776., 842., 7763.);
	Tri(6056., 16331.,14609., 41681., 9529.);
	Tri(104328., 145178.,14679., 42460., 14890.);
	Tri(56725., 69025.,89763., 39415., 12110.);
	Tri(87831., 132515.,88341., 25039., 10496.);
	Tri(88330., 119521.,120014., 801., 15104.);
	Tri(70755., 83012.,71768., 63997., 15061.);
	Tri(146723., 146609.,78239., 38095., 10029.);
	Tri(4915., 52635.,92095., 42710., 11062.);
	Tri(37872., 51765.,37872., 15785., 14064.);
	Tri(94351., 142049.,108704., 11636., 8495.);
	Tri(55444., 64838.,67227., 39151., 14379.);
	Tri(112386., 131142.,133157., 22869., 7709.);
	Tri(59002., 47224.,43718., 14266., 10289.);
	Tri(76435., 75577.,87542., 48884., 13144.);
	Tri(35825., 83684.,35825., 64592., 10922.);
	Tri(779., 22814.,-262., 513., 15110.);
	Tri(48749., 41068.,35464., 50928., 14879.);
	Tri(129903., 130004.,130006., 27229., 8727.);
	Tri(145147., 1825.,9519., 58344., 14724.);
	Tri(87329., 95506.,11513., 64766., 15285.);
	Tri(128781., 56664.,125240., 33489., 14873.);
	Tri(78085., 80656.,115925., 531., 15162.);
	Tri(105351., 38400.,38400., 15717., 14677.);
	Tri(56322., 56321.,28264., 30564., 10027.);
	Tri(8150., 97655.,121136., 40145., 12588.);
	Tri(81209., 86867.,79086., 11182., 7689.);
	Tri(54536., 104517.,88141., 18060., 7782.);
	Tri(108085., 138055.,110632., 63229., 12928.);
	Tri(61758., 30011.,24903., 35276., 14879.);
	Tri(65430., 72056.,74562., 41947., 13348.);
	Tri(146352., 146626.,88482., 41687., 15155.);
	Tri(67202., 64637.,62598., 61437., 15080.);
	Tri(112610., 122487.,112608., 42719., 8240.);
	Tri(65083., 128304.,64566., 22950., 15290.);
	Tri(146709., 13141.,98280., 40669., 14644.);
	Tri(56519., 61104.,54971., 23587., 9577.);
	Tri(79002., 48278.,35541., 51195., 15170.);
	Tri(134770., 91960.,143078., 63734., 14511.);
	Tri(123097., 145971.,86370., 56316., 8515.);
	Tri(140832., 73277.,136788., 44507., 14640.);
	Tri(115240., 102461.,146077., 44284., 15136.);
	Tri(51816., 90200.,76375., 62202., 15193.);
	Tri(128695., 135360.,95258., 63734., 14972.);
	Tri(45334., 113229.,18183., 25268., 10271.);
	Tri(67158., 133969.,143134., 39154., 9012.);
	Tri(18824., 129494.,146656., 41941., 14892.);
	Tri(43647., 26250.,11933., 58834., 15007.);
	Tri(20424., 136192.,20424., 27300., 13109.);
	Tri(59112., 41185.,23797., 65014., 14505.);
	Tri(140397., 136714.,67108., 42460., 15141.);
	Tri(79436., 116899.,110154., 6656., 15203.);


    vec3 wh =  clamp(abs(fract(t + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) -1.0, 0.0, 1.0);
    col = mix(col, wh*col, smoothstep(6.0, 0.0, t));

    fragColor = vec4(min(col*1.15, 1.0), 1.0 );
}