import Color from "../Core/Color.js";
import Frozen from "../Core/Frozen.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.WHITE;
const defaultGlowPower = 0.25;
const defaultTaperPower = 1.0;

/**
 * A {@link MaterialProperty} that maps to polyline glow {@link Material} uniforms.
 * @alias PolylineGlowMaterialProperty
 * @constructor
 *
 * @param {object} [options] Object with the following properties:
 * @param {Property|Color} [options.color=Color.WHITE] A Property specifying the {@link Color} of the line.
 * @param {Property|number} [options.glowPower=0.25] A numeric Property specifying the strength of the glow, as a percentage of the total line width.
 * @param {Property|number} [options.taperPower=1.0] A numeric Property specifying the strength of the tapering effect, as a percentage of the total line length.  If 1.0 or higher, no taper effect is used.
 */
function PolylineGlowMaterialProperty(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._glowPower = undefined;
  this._glowPowerSubscription = undefined;
  this._taperPower = undefined;
  this._taperPowerSubscription = undefined;

  this.color = options.color;
  this.glowPower = options.glowPower;
  this.taperPower = options.taperPower;
}

Object.defineProperties(PolylineGlowMaterialProperty.prototype, {
  /**
   * Gets a value indicating if this property is constant.  A property is considered
   * constant if getValue always returns the same result for the current definition.
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) && Property.isConstant(this._glow)
      );
    },
  },
  /**
   * Gets the event that is raised whenever the definition of this property changes.
   * The definition is considered to have changed if a call to getValue would return
   * a different result for the same time.
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
  /**
   * Gets or sets the Property specifying the {@link Color} of the line.
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {Property|undefined}
   */
  color: createPropertyDescriptor("color"),

  /**
   * Gets or sets the numeric Property specifying the strength of the glow, as a percentage of the total line width (less than 1.0).
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {Property|undefined}
   */
  glowPower: createPropertyDescriptor("glowPower"),

  /**
   * Gets or sets the numeric Property specifying the strength of the tapering effect, as a percentage of the total line length.  If 1.0 or higher, no taper effect is used.
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {Property|undefined}
   */
  taperPower: createPropertyDescriptor("taperPower"),
});

/**
 * Gets the {@link Material} type at the provided time.
 *
 * @param {JulianDate} time The time for which to retrieve the type.
 * @returns {string} The type of material.
 */
PolylineGlowMaterialProperty.prototype.getType = function (time) {
  return "PolylineGlow";
};

const timeScratch = new JulianDate();

/**
 * Gets the value of the property at the provided time.
 *
 * @param {JulianDate} [time=JulianDate.now()] The time for which to retrieve the value. If omitted, the current system time is used.
 * @param {object} [result] The object to store the value into, if omitted, a new instance is created and returned.
 * @returns {object} The modified result parameter or a new instance if the result parameter was not supplied.
 */
PolylineGlowMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.color = Property.getValueOrClonedDefault(
    this._color,
    time,
    defaultColor,
    result.color,
  );
  result.glowPower = Property.getValueOrDefault(
    this._glowPower,
    time,
    defaultGlowPower,
    result.glowPower,
  );
  result.taperPower = Property.getValueOrDefault(
    this._taperPower,
    time,
    defaultTaperPower,
    result.taperPower,
  );
  return result;
};

/**
 * Compares this property to the provided property and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Property} [other] The other property.
 * @returns {boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
 */
PolylineGlowMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineGlowMaterialProperty &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._glowPower, other._glowPower) &&
      Property.equals(this._taperPower, other._taperPower))
  );
};
export default PolylineGlowMaterialProperty;
