import * as Cesium from "cesium";
import Sandcastle from "Sandcastle";

const viewer = new Cesium.Viewer("cesiumContainer", {
  animation: false,
  baseLayerPicker: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  infoBox: false,
  sceneModePicker: false,
  selectionIndicator: false,
  timeline: false,
  navigationHelpButton: false,
  terrain: Cesium.Terrain.fromWorldTerrain({
    requestWaterMask: true,
    requestVertexNormals: true,
  }),
});

const scene = viewer.scene;

// Enable terrain depth testing so depthFailAppearance works against the globe.
scene.globe.depthTestAgainstTerrain = true;
// Prefer 3D Tiles over terrain without losing normal depth tests for other geometry.
scene.prefer3dTiles = true;

Sandcastle.addToggleButton("prefer3dTiles", true, function (checked) {
  scene.prefer3dTiles = checked;
});

/**
 * Translate a tileset down along the local up axis by deltaHeight (meters).
 */
function lowerTileset(tileset, deltaHeight) {
  const cartographic = Cesium.Cartographic.fromCartesian(
    tileset.boundingSphere.center,
  );
  const current = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height,
  );
  const lowered = Cesium.Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height + deltaHeight,
  );
  const translation = Cesium.Cartesian3.subtract(
    lowered,
    current,
    new Cesium.Cartesian3(),
  );
  tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
}

/**
 * Add a translucent polyline that diagonally crosses the tileset, with a dashed
 * depth-fail style where the line is occluded by terrain or 3D Tiles.
 */
function addDiagonalPolyline(tileset) {
  const boundingSphere = tileset.boundingSphere;
  const center = boundingSphere.center;
  const radius = boundingSphere.radius;
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(center);

  // Diagonal through the model volume in local ENU space.
  const startLocal = new Cesium.Cartesian3(
    -radius * 0.9,
    -radius * 0.35,
    -radius * 0.25,
  );
  const endLocal = new Cesium.Cartesian3(
    radius * 0.9,
    radius * 0.35,
    radius * 0.35,
  );
  const start = Cesium.Matrix4.multiplyByPoint(
    enu,
    startLocal,
    new Cesium.Cartesian3(),
  );
  const end = Cesium.Matrix4.multiplyByPoint(
    enu,
    endLocal,
    new Cesium.Cartesian3(),
  );

  const billboards = scene.primitives.add(new Cesium.BillboardCollection());
  billboards.add({
    position: end,
    image:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACvSURBVDhPrZDRDcMgDAU9GqN0lIzijw6SUbJJygUeNQgSqepJTyHG91LVVpwDdfxM3T9TSh1EXZvDwii471fivK73cBFFQNTT/d2KoGpfGOpSIkhUpgUMxq9DFEsWv4IXhlyCnhBFnZcFEEuYqbiUlNwWgMTdrZ3JbQFoEVG53rd8ztG9aPJMnBUQf/VFraBJeWnLS0RfjbKyLJA8FkT5seDYZ1Qwyv8t0B/5C2ZmH2/eTGNNBgMmAAAAAElFTkSuQmCC",
    width: 24,
    height: 24,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  });

  scene.primitives.add(
    new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolylineGeometry({
          positions: [start, end],
          width: 4.0,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.WHITE.withAlpha(0.85),
          ),
        },
      }),
      appearance: new Cesium.PolylineColorAppearance({
        translucent: true,
      }),
      depthFailAppearance: new Cesium.PolylineMaterialAppearance({
        material: Cesium.Material.fromType("PolylineDash", {
          color: Cesium.Color.BLACK,
          dashLength: 16.0,
        }),
      }),
      asynchronous: false,
    }),
  );
}

try {
  // Same Gaussian splat tileset as the right side of
  // 3d-tiles-gaussian-splatting-comparison; lower it slightly into terrain.
  const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(3443919);
  lowerTileset(tileset, -20.0);
  scene.primitives.add(tileset);

  addDiagonalPolyline(tileset);

  viewer.zoomTo(
    tileset,
    new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(-50),
      Cesium.Math.toRadians(-20),
      100.0,
    ),
  );
} catch (error) {
  console.log(`Error loading tileset: ${error}`);
}
