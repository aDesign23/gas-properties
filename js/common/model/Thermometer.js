// Copyright 2018, University of Colorado Boulder

/**
 * Model for the thermometer
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const DerivedProperty = require( 'AXON/DerivedProperty' );
  const Enumeration = require( 'PHET_CORE/Enumeration' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const Property = require( 'AXON/Property' );
  const Range = require( 'DOT/Range' );

  // constants
  const DEFAULT_RANGE = new Range( 0, 1000 );

  class Thermometer {

    /**
     * @param {Object} [options]
     */
    constructor( options ) {

      options = _.extend( {
        range: DEFAULT_RANGE
      }, options );

      // @public {Range} range of thermometer, in K. temperatureProperty is expected to exceed this.
      this.range = options.range;

      // @public {Property.<number|null>} the temperature in the container, in Kelvin.
      // Value is null when the container is empty.
      this.temperatureKelvinProperty = new Property( null, {
        isValidValue: value => ( value === null || typeof value === 'number' )
      } );

      // @public {Property.<number|null>} temperature in the container, in Celsius.
      // Value is null when the container is empty.
      this.temperatureCelsiusProperty = new DerivedProperty( [ this.temperatureKelvinProperty ],
        temperatureKelvin => ( temperatureKelvin === null ) ? null : temperatureKelvin - 273.15 );

      // @public {Property.<Thermometer.Units>} temperature units displayed by the thermometer
      this.unitsProperty = new Property( Thermometer.Units.KELVIN, {
        isValidValue: value => Thermometer.Units.includes( value )
      } );
    }

    // @public
    reset() {
      this.temperatureKelvinProperty.reset();
      this.unitsProperty.reset();
    }
  }

  // Choice of temperature units that the thermometer can display
  Thermometer.Units = new Enumeration( [ 'KELVIN', 'CELSIUS' ] );

  return gasProperties.register( 'Thermometer', Thermometer );
} );