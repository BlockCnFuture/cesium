import StencilFunction from "./StencilFunction.js";
import StencilOperation from "./StencilOperation.js";

/**
 * The most significant bit is used to identify whether the pixel is 3D Tiles.
 * The next three bits store selection depth for the skip LODs optimization.
 * The last four bits are for increment/decrement shadow volume operations for classification.
 *
 * @private
 */
const StencilConstants = {
  CESIUM_3D_TILE_MASK: 0x80,
  SKIP_LOD_MASK: 0x70,
  SKIP_LOD_BIT_SHIFT: 4,
  CLASSIFICATION_MASK: 0x0f,
  /**
   * All stencil bits except {@link StencilConstants.CESIUM_3D_TILE_MASK}.
   * Used to clear classification / skip-LOD bits while preserving 3D Tiles footprints.
   */
  NON_3D_TILE_MASK: 0x7f,
};

StencilConstants.setCesium3DTileBit = function () {
  return {
    enabled: true,
    frontFunction: StencilFunction.ALWAYS,
    frontOperation: {
      fail: StencilOperation.KEEP,
      zFail: StencilOperation.KEEP,
      zPass: StencilOperation.REPLACE,
    },
    backFunction: StencilFunction.ALWAYS,
    backOperation: {
      fail: StencilOperation.KEEP,
      zFail: StencilOperation.KEEP,
      zPass: StencilOperation.REPLACE,
    },
    reference: StencilConstants.CESIUM_3D_TILE_MASK,
    mask: StencilConstants.CESIUM_3D_TILE_MASK,
  };
};

/**
 * Stencil test that fails where the 3D Tiles bit is set. Used to suppress globe
 * shading in screen regions that 3D Tiles will cover when prefer3dTiles is on.
 *
 * @private
 */
StencilConstants.excludeCesium3DTileBit = function () {
  return {
    enabled: true,
    frontFunction: StencilFunction.NOT_EQUAL,
    frontOperation: {
      fail: StencilOperation.KEEP,
      zFail: StencilOperation.KEEP,
      zPass: StencilOperation.KEEP,
    },
    backFunction: StencilFunction.NOT_EQUAL,
    backOperation: {
      fail: StencilOperation.KEEP,
      zFail: StencilOperation.KEEP,
      zPass: StencilOperation.KEEP,
    },
    reference: StencilConstants.CESIUM_3D_TILE_MASK,
    mask: StencilConstants.CESIUM_3D_TILE_MASK,
  };
};
export default Object.freeze(StencilConstants);
