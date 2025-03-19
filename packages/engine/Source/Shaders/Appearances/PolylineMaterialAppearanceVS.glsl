in vec3 position3DHigh;
in vec3 position3DLow;
in vec3 prevPosition3DHigh;
in vec3 prevPosition3DLow;
in vec3 nextPosition3DHigh;
in vec3 nextPosition3DLow;
in vec2 expandAndWidth;
in vec2 st;
in float batchId;

out float v_width;
// @uranus change \u65B0\u589E\u53D8\u91CF\u7528\u6765\u8BA1\u7B97\u8FB9\u7F18\u6297\u952F\u9F7F
out float v_aa_width;
out float v_aa_out;
out vec2 v_st;
out float v_polylineAngle;

void main()
{
    // @uranus change: \u8BA1\u7B97\u5916\u6269\u53D8\u91CF
    v_aa_out = 1.0 / czm_pixelRatio; // \u7EBF\u6BB5\u9876\u70B9\u5916\u6269\u4E24\u4E2A\u50CF\u7D20
    float width_out = v_aa_out * 2.0;
    // @uranus change end
    float expandDir = expandAndWidth.x;
    // @uranus change \u5BBD\u5EA6\u5916\u6269
    float width = abs(expandAndWidth.y) + 0.5 + width_out;
    bool usePrev = expandAndWidth.y < 0.0;

    vec4 p = czm_computePosition();
    vec4 prev = czm_computePrevPosition();
    vec4 next = czm_computeNextPosition();

    float angle;
    vec4 positionWC = getPolylineWindowCoordinates(p, prev, next, expandDir, width, usePrev, angle);
    gl_Position = czm_viewportOrthographic * positionWC;

    // @uranus change: \u8BA1\u7B97\u5916\u6269\u53D8\u91CF
    v_width = width - width_out;
    v_aa_width = width;
    // @uranus change end
    v_st.s = st.s;
    v_st.t = czm_writeNonPerspective(st.t, gl_Position.w);
    v_polylineAngle = angle;
}