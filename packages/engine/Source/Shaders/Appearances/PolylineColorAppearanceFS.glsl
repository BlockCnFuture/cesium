#ifdef VECTOR_TILE
uniform vec4 u_highlightColor;
#endif

in vec2 v_st;
in vec4 v_color;
in float v_aa_width;
in float v_aa_out;

// @uranus change: \u65B0\u589E PolylineColorAppearanceFS \u7528\u6765\u5B9E\u73B0\u7EBF\u6BB5\u8FB9\u7F18\u6297\u952F\u9F7F
void main()
{
    vec2 st = v_st;
    st.t = czm_readNonPerspective(st.t, gl_FragCoord.w);

    float width_out = v_aa_out * 2.0; // \u8FB9\u7F18\u6297\u952F\u9F7F\u989D\u5916\u589E\u52A0\u7684\u5BBD\u5EA6
    float dist = (abs(st.t - 0.5)) * v_aa_width * 2.0; // t - 0.5 \u8DDD\u79BB\u4E2D\u5FC3\u70B9\u7684\u4F4D\u7F6E\uFF08\u4E24\u500D\u5316\uFF09
    float alpha = clamp((v_aa_width - dist - (1.0 / czm_pixelRatio)) / width_out, 0.0, 1.0); // \u6297\u952F\u9F7F\u586B\u5145\u900F\u660E\u5EA6

    vec4 color = v_color;
    color.a *= alpha;

    out_FragColor = czm_gammaCorrect(color);
}