import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import RuntimeError from "../Core/RuntimeError.js";

/**
 * An availability bitstream for use in an {@link ImplicitSubtree}. This handles
 * both Uint8Array bitstreams and constant values.
 *
 * @alias ImplicitAvailabilityBitstream
 * @constructor
 *
 * @param {object} options An object with the following properties:
 * @param {number} options.lengthBits The length of the bitstream in bits
 * @param {boolean} [options.constant] A single boolean value indicating the value of all the bits in the bitstream if they are all the same
 * @param {Uint8Array} [options.bitstream] An array of bytes storing the bitstream in binary
 * @param {number} [options.availableCount] A number indicating how many 1 bits are found in the bitstream
 * @param {boolean} [options.computeAvailableCountEnabled=false] If true, and options.availableCount is undefined, the availableCount will be computed from the bitstream.
 * @private
 * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
 */
function ImplicitAvailabilityBitstream(options) {
  const lengthBits = options.lengthBits;
  let availableCount = options.availableCount;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("options.lengthBits", lengthBits);
  //>>includeEnd('debug');

  const constant = options.constant;
  const bitstream = options.bitstream;

  if (defined(constant)) {
    // if defined, constant must be 1 which means all tiles are available
    availableCount = lengthBits;
  } else {
    const expectedLength = Math.ceil(lengthBits / 8);
    if (bitstream.length !== expectedLength) {
      throw new RuntimeError(
        `Availability bitstream must be exactly ${expectedLength} bytes long to store ${lengthBits} bits. Actual bitstream was ${bitstream.length} bytes long.`,
      );
    }

    // Only compute the available count if requested, as this involves looping
    // over the bitstream.
    const computeAvailableCountEnabled =
      options.computeAvailableCountEnabled ?? false;
    if (!defined(availableCount) && computeAvailableCountEnabled) {
      availableCount = count1Bits(bitstream, lengthBits);
    }
  }

  this._lengthBits = lengthBits;
  this._availableCount = availableCount;
  this._constant = constant;
  this._bitstream = bitstream;
}

/**
 * Count the number of bits with value 1 in the bitstream. This is used for
 * computing availableCount if not precomputed
 *
 * @param {Uint8Array} bitstream The bitstream typed array
 * @param {number} lengthBits How many bits are in the bitstream
 * @private
 */
function count1Bits(bitstream, lengthBits) {
  let count = 0;
  for (let i = 0; i < lengthBits; i++) {
    const byteIndex = i >> 3;
    const bitIndex = i % 8;
    count += (bitstream[byteIndex] >> bitIndex) & 1;
  }
  return count;
}

Object.defineProperties(ImplicitAvailabilityBitstream.prototype, {
  /**
   * The length of the bitstream in bits.
   *
   * @memberof ImplicitAvailabilityBitstream.prototype
   *
   * @type {number}
   * @readonly
   * @private
   */
  lengthBits: {
    get: function () {
      return this._lengthBits;
    },
  },
  /**
   * The number of bits in the bitstream with value <code>1</code>.
   *
   * @memberof ImplicitAvailabilityBitstream.prototype
   *
   * @type {number}
   * @readonly
   * @private
   */
  availableCount: {
    get: function () {
      return this._availableCount;
    },
  },
});

/**
 * Get a bit from the availability bitstream as a Boolean. If the bitstream
 * is a constant, the constant value is returned instead.
 *
 * @param {number} index The integer index of the bit.
 * @returns {boolean} The value of the bit
 * @private
 */
ImplicitAvailabilityBitstream.prototype.getBit = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (index < 0 || index >= this._lengthBits) {
    throw new DeveloperError("Bit index out of bounds.");
  }
  //>>includeEnd('debug');

  if (defined(this._constant)) {
    return this._constant;
  }

  // byteIndex is floor(index / 8)
  const byteIndex = index >> 3;
  const bitIndex = index % 8;

  return ((this._bitstream[byteIndex] >> bitIndex) & 1) === 1;
};

export default ImplicitAvailabilityBitstream;
