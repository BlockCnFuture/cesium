in vec4 v_startPlaneNormalEcAndHalfWidth;
in vec4 v_endPlaneNormalEcAndBatchId;
in vec4 v_rightPlaneEC; // Technically can compute distance for this here
in vec4 v_endEcAndStartEcX;
in vec4 v_texcoordNormalizationAndStartEcYZ;

// @uranus change \u65B0\u589E\u53D8\u91CF\u7528\u6765\u8BA1\u7B97\u8FB9\u7F18\u6297\u952F\u9F7F
in float v_aa_width;
in float v_aa_out;

#ifdef PER_INSTANCE_COLOR
in vec4 v_color;
#endif

void main(void)
{
    float logDepthOrDepth = czm_branchFreeTernary(czm_sceneMode == czm_sceneMode2D, gl_FragCoord.z, czm_unpackDepth(texture(czm_globeDepthTexture, gl_FragCoord.xy / czm_viewport.zw)));
    vec3 ecStart = vec3(v_endEcAndStartEcX.w, v_texcoordNormalizationAndStartEcYZ.zw);

    // Discard for sky
    if (logDepthOrDepth == 0.0) {
#ifdef DEBUG_SHOW_VOLUME
        out_FragColor = vec4(1.0, 0.0, 0.0, 0.5);
        return;
#else // DEBUG_SHOW_VOLUME
        discard;
#endif // DEBUG_SHOW_VOLUME
    }

    vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, logDepthOrDepth);
    eyeCoordinate /= eyeCoordinate.w;

    float halfMaxWidth = v_startPlaneNormalEcAndHalfWidth.w * czm_metersPerPixel(eyeCoordinate);
    // Check distance of the eye coordinate against the right-facing plane
    float widthwiseDistance = czm_planeDistance(v_rightPlaneEC, eyeCoordinate.xyz);

    // Check eye coordinate against the mitering planes
    float distanceFromStart = czm_planeDistance(v_startPlaneNormalEcAndHalfWidth.xyz, -dot(ecStart, v_startPlaneNormalEcAndHalfWidth.xyz), eyeCoordinate.xyz);
    float distanceFromEnd = czm_planeDistance(v_endPlaneNormalEcAndBatchId.xyz, -dot(v_endEcAndStartEcX.xyz, v_endPlaneNormalEcAndBatchId.xyz), eyeCoordinate.xyz);

    if (abs(widthwiseDistance) > halfMaxWidth || distanceFromStart < 0.0 || distanceFromEnd < 0.0) {
#ifdef DEBUG_SHOW_VOLUME
        out_FragColor = vec4(1.0, 0.0, 0.0, 0.5);
        return;
#else // DEBUG_SHOW_VOLUME
        discard;
#endif // DEBUG_SHOW_VOLUME
    }

    // Check distance of the eye coordinate against start and end planes with normals in the right plane.
    // For computing unskewed lengthwise texture coordinate.
    // Can also be used for clipping extremely pointy miters, but in practice unnecessary because of miter breaking.

    // aligned plane: cross the right plane normal with miter plane normal, then cross the result with right again to point it more "forward"
    vec3 alignedPlaneNormal;

    // start aligned plane
    alignedPlaneNormal = cross(v_rightPlaneEC.xyz, v_startPlaneNormalEcAndHalfWidth.xyz);
    alignedPlaneNormal = normalize(cross(alignedPlaneNormal, v_rightPlaneEC.xyz));
    distanceFromStart = czm_planeDistance(alignedPlaneNormal, -dot(alignedPlaneNormal, ecStart), eyeCoordinate.xyz);

    // end aligned plane
    alignedPlaneNormal = cross(v_rightPlaneEC.xyz, v_endPlaneNormalEcAndBatchId.xyz);
    alignedPlaneNormal = normalize(cross(alignedPlaneNormal, v_rightPlaneEC.xyz));
    distanceFromEnd = czm_planeDistance(alignedPlaneNormal, -dot(alignedPlaneNormal, v_endEcAndStartEcX.xyz), eyeCoordinate.xyz);

    // @uranus change start: \u8FB9\u7F18\u6297\u952F\u9F7F\u8BA1\u7B97\uFF0C\u8FB9\u7F18\u586B\u5145
    float t = (widthwiseDistance + halfMaxWidth) / (2.0 * halfMaxWidth); // \u9ED8\u8BA4\u7684 t
    float width_out = v_aa_out * 2.0; // \u8FB9\u7F18\u6297\u952F\u9F7F\u989D\u5916\u589E\u52A0\u7684\u5BBD\u5EA6
    float dist = (abs(t - 0.5)) * v_aa_width * 2.0; // t - 0.5 \u8DDD\u79BB\u4E2D\u5FC3\u70B9\u7684\u4F4D\u7F6E\uFF08\u4E24\u500D\u5316\uFF09
    float alpha = clamp((v_aa_width - dist - (1.0 / czm_pixelRatio)) / width_out, 0.0, 1.0); // \u6297\u952F\u9F7F\u586B\u5145\u900F\u660E\u5EA6
    // @uranus change end

#ifdef PER_INSTANCE_COLOR
    // @uranus change start: \u8FB9\u7F18\u6297\u952F\u9F7F\u900F\u660E\u5EA6\u8BA1\u7B97
    vec4 color = v_color;
    color.a *= alpha;
    out_FragColor = czm_gammaCorrect(color);
    // @uranus change end
#else // PER_INSTANCE_COLOR
    // Clamp - distance to aligned planes may be negative due to mitering,
    // so fragment texture coordinate might be out-of-bounds.
    float s = clamp(distanceFromStart / (distanceFromStart + distanceFromEnd), 0.0, 1.0);
    s = (s * v_texcoordNormalizationAndStartEcYZ.x) + v_texcoordNormalizationAndStartEcYZ.y;
    // @uranus change start: \u8FB9\u7F18\u6297\u952F\u9F7F\u8BA1\u7B97\uFF0C\u9700\u8981\u628A\u7EB9\u7406\u5BBD\u5EA6\u7F29\u5C0F

    float m_width = v_aa_width - width_out; // \u5B9E\u9645\u7EBF\u6BB5\u5BBD\u5EA6
    float tem_t = (t * v_aa_width - v_aa_out) / m_width; // [-1, x - 1]
    t = clamp(tem_t, 0.0, 1.0); // \u5B9E\u9645\u7EB9\u7406\u5BBD\u5EA6
    // @uranus change end

    czm_materialInput materialInput;

    materialInput.s = s;
    materialInput.st = vec2(s, t);
    materialInput.str = vec3(s, t, 0.0);

    czm_material material = czm_getMaterial(materialInput);
    out_FragColor = vec4(material.diffuse + material.emission, material.alpha);
    // @uranus change: \u8FB9\u7F18\u6297\u952F\u9F7F\u900F\u660E\u5EA6\u8BA1\u7B97
    out_FragColor.a *= alpha;
#endif // PER_INSTANCE_COLOR

    // Premultiply alpha. Required for classification primitives on translucent globe.
    out_FragColor.rgb *= out_FragColor.a;

    czm_writeDepthClamp();
}
