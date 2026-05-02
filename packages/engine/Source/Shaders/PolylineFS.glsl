#ifdef VECTOR_TILE
uniform vec4 u_highlightColor;
#endif

in vec2 v_st;
// @uranus change \u65B0\u589E\u53D8\u91CF\u7528\u6765\u8BA1\u7B97\u8FB9\u7F18\u6297\u952F\u9F7F
in float v_aa_width;
in float v_aa_out;

void main()
{
    czm_materialInput materialInput;

    vec2 st = v_st;
    st.t = czm_readNonPerspective(st.t, gl_FragCoord.w);

    // @uranus change start: \u8FB9\u7F18\u6297\u952F\u9F7F\u8BA1\u7B97\uFF0C\u9700\u8981\u628A\u7EB9\u7406\u5BBD\u5EA6\u7F29\u5C0F\uFF0C\u8FB9\u7F18\u586B\u5145
    float width_out = v_aa_out * 2.0; // \u8FB9\u7F18\u6297\u952F\u9F7F\u989D\u5916\u589E\u52A0\u7684\u5BBD\u5EA6
    float m_width = v_aa_width - width_out; // \u5B9E\u9645\u7EBF\u6BB5\u5BBD\u5EA6

    float dist = (abs(st.t - 0.5)) * v_aa_width * 2.0; // t - 0.5 \u8DDD\u79BB\u4E2D\u5FC3\u70B9\u7684\u4F4D\u7F6E\uFF08\u4E24\u500D\u5316\uFF09
    float t = (st.t * v_aa_width - v_aa_out) / m_width; // [-1, x - 1]
    st.t = clamp(t, 0.0, 1.0); // \u5B9E\u9645\u7EB9\u7406\u5BBD\u5EA6
    float alpha = clamp((v_aa_width - dist - (1.0 / czm_pixelRatio)) / width_out, 0.0, 1.0); // \u6297\u952F\u9F7F\u586B\u5145\u900F\u660E\u5EA6
    // @uranus change end

    materialInput.s = st.s;
    materialInput.st = st;
    materialInput.str = vec3(st, 0.0);

    czm_material material = czm_getMaterial(materialInput);
    out_FragColor = vec4(material.diffuse + material.emission, material.alpha);
#ifdef VECTOR_TILE
    out_FragColor *= u_highlightColor;
#endif
    // @uranus change: \u8FB9\u7F18\u6297\u952F\u9F7F\u900F\u660E\u5EA6\u8BA1\u7B97
    out_FragColor.a *= alpha;

    czm_writeLogDepth();
}