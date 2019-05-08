// Copyright 2019, University of Colorado Boulder

/**
 * Container for the 'Ideal', 'Explore', and 'Energy' screens, adds a movable/removable lid.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const BaseContainer = require( 'GAS_PROPERTIES/common/model/BaseContainer' );
  const BooleanProperty = require( 'AXON/BooleanProperty' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const NumberProperty = require( 'AXON/NumberProperty' );
  const Util = require( 'DOT/Util' );
  const Vector2 = require( 'DOT/Vector2' );

  class GasPropertiesContainer extends BaseContainer {

    constructor() {
      super();

      // @public whether the lid is on the container
      this.lidIsOnProperty = new BooleanProperty( true );

      // @public (read-only) lid thickness, in pm
      this.lidThickness = 3 * this.wallThickness;

      // @public (read-only) insets of the opening in the top, from the inside edges of the container, in pm
      this.openingLeftInset = 1250;
      this.openingRightInset = 2000;
      assert && assert( this.widthRange.min > this.openingLeftInset + this.openingRightInset,
        'widthRange.min is too small to accommodate insets' );

      // @public (read-only) the right coordinate of the opening in the top of the container, in pm
      // openingLeft is dynamic, see ES5 getter
      this.openingRight = this.location.y - this.openingRightInset;

      // @public width of the lid, in pm
      this.lidWidthProperty = new NumberProperty( this.widthProperty.value - this.openingRightInset + this.wallThickness, {
        units: 'pm'
      } );

      // @public (read-only) minimum width of the lid, overlaps the left wall, in pm.
      // maxLidWidth is dynamic, see ES5 getter.
      this.minLidWidth = this.openingLeftInset + this.wallThickness;

      // @public (read-only) bicycle pump hose is connected to the bottom right side of the container, in pm
      this.hoseLocation = new Vector2( this.location.x + this.wallThickness, this.location.y + this.height / 5 );

      // Validate lidWidth, whose range changes dynamically.
      assert && this.lidWidthProperty.link( lidWidth => {
        assert && assert( lidWidth >= this.minLidWidth && lidWidth <= this.maxLidWidth, `invalid lidWidth: ${lidWidth}` );
      } );
    }

    // @public @override
    reset() {
      super.reset();
      this.lidIsOnProperty.reset();
      this.lidWidthProperty.reset();
    }

    /**
     * Gets the maximum lid width, when the lid is fully closed.
     * @returns {number} in pm
     * @public
     */
    get maxLidWidth() { return this.widthProperty.value - this.openingRightInset + this.wallThickness; }

    /**
     * Gets the left coordinate of the opening in the top of the container.
     * @returns {number} in pm
     * @public
     */
    get openingLeft() {

      let openingLeft = null;
      if ( this.lidIsOnProperty.value ) {
        openingLeft = this.left - this.wallThickness + this.lidWidthProperty.value;

        // Round to the nearest pm to avoid floating-point error, see https://github.com/phetsims/gas-properties/issues/63.
        openingLeft = Util.roundSymmetric( openingLeft );
      }
      else {
        openingLeft = this.left + this.openingLeftInset;
      }
      assert && assert( openingLeft <= this.openingRight,
        `openingLeft ${openingLeft} must be <= openingRight ${this.openingRight}` );
      return openingLeft;
    }

    /**
     * Gets the width of the opening in the top of the container.
     * @returns {number} in pm
     * @public
     */
    get openingWidth() {
      const openingWidth = this.openingRight - this.openingLeft;
      assert && assert( openingWidth >= 0, `invalid openingWidth: ${openingWidth}` );
      return openingWidth;
    }
  }

  return gasProperties.register( 'GasPropertiesContainer', GasPropertiesContainer );
} );