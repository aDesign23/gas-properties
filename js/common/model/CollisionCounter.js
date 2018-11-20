// Copyright 2018, University of Colorado Boulder

/**
 * Model for the collision counter.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const BooleanProperty = require( 'AXON/BooleanProperty' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const NumberProperty = require( 'AXON/NumberProperty' );
  const Property = require( 'AXON/Property' );
  const Vector2 = require( 'DOT/Vector2' );

  class CollisionCounter {

    /**
     * @param {Object} [options]
     */
    constructor( options ) {

      options = _.extend( {
        location: Vector2.ZERO,
        visible: false
      }, options );

      // @public location of the collision counter
      this.locationProperty = new Property( options.location, {
        valueType: Vector2
      } );

      // @public whether the collision counter is visible
      this.visibleProperty = new BooleanProperty( options.visible );

      // @public the number of collisions between the particles and the container walls
      this.numberOfCollisionsProperty = new NumberProperty( 0, {
        numberType: 'Integer',
        isValidValue: value => ( value >= 0 )
      } );

      // @public whether the collision counter is running
      this.isRunningProperty = new BooleanProperty( false );

      // When the collision counter stops running, reset the number of collisions.
      this.isRunningProperty.link( isRunning => {
        if ( !isRunning ) {
          this.numberOfCollisionsProperty.value = 0;
        }
      } );

      // @public (read-only) valid values for averagingTimeProperty, in ps
      this.averagingTimes = [ 10, 25, 50, 100 ];

      // @public collision averaging time, in ps
      this.averagingTimeProperty = new NumberProperty( 10, {
        numberType: 'Integer',
        validValues: this.averagingTimes
      } );

      // When the counter becomes invisible, stop the counter and reset its value.
      this.visibleProperty.link( visible => {
        if ( !visible ) {
          this.isRunningProperty.value = false;
          this.numberOfCollisionsProperty.value = 0;
        }
      } );
    }

    reset() {
      this.locationProperty.reset();
      this.visibleProperty.reset();
      this.numberOfCollisionsProperty.reset();
      this.isRunningProperty.reset();
      this.averagingTimeProperty.reset();
    }
  }

  return gasProperties.register( 'CollisionCounter', CollisionCounter );
} );