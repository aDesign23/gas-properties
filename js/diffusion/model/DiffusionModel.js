// Copyright 2018-2019, University of Colorado Boulder

/**
 * Model for the 'Diffusion' screen.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( require => {
  'use strict';

  // modules
  const BaseModel = require( 'GAS_PROPERTIES/common/model/BaseModel' );
  const CollisionDetector = require( 'GAS_PROPERTIES/common/model/CollisionDetector' );
  const DiffusionContainer = require( 'GAS_PROPERTIES/diffusion/model/DiffusionContainer' );
  const DiffusionData = require( 'GAS_PROPERTIES/diffusion/model/DiffusionData' );
  const DiffusionExperiment = require( 'GAS_PROPERTIES/diffusion/model/DiffusionExperiment' );
  const DiffusionParticle1 = require( 'GAS_PROPERTIES/diffusion/model/DiffusionParticle1' );
  const DiffusionParticle2 = require( 'GAS_PROPERTIES/diffusion/model/DiffusionParticle2' );
  const Emitter = require( 'AXON/Emitter' );
  const gasProperties = require( 'GAS_PROPERTIES/gasProperties' );
  const GasPropertiesConstants = require( 'GAS_PROPERTIES/common/GasPropertiesConstants' );
  const ParticleFlowRate = require( 'GAS_PROPERTIES/diffusion/model/ParticleFlowRate' );
  const ParticleUtils = require( 'GAS_PROPERTIES/common/model/ParticleUtils' );
  const Property = require( 'AXON/Property' );
  const Vector2 = require( 'DOT/Vector2' );

  // constants
  const CENTER_OF_MASS_OPTIONS = {
    isValidValue: value => ( value === null || typeof value === 'number' ),
    units: 'pm'
  };

  class DiffusionModel extends BaseModel {

    constructor() {

      super( {
        modelOriginOffset: new Vector2( 645, 525 ), // offset of the model's origin, in view coordinates
        stopwatchLocation: new Vector2( 35, 15 ) // in view coordinates! determined empirically
      } );

      // @public
      this.container = new DiffusionContainer();

      // @public parameters that define the experiment to be run when the container's divider is removed
      this.experiment = new DiffusionExperiment();

      // @public values shown in the Data accordion box
      this.data = new DiffusionData();

      // @public (read-only) particles of each type
      this.particles1 = []; // {DiffusionParticle1[]}
      this.particles2 = []; // {DiffusionParticle2[]}

      // @public emit is called when any of the above Particle arrays are modified
      this.numberOfParticlesChangedEmitter = new Emitter();

      // @public (read-only) centerX of mass for particles of types DiffusionParticle1 and DiffusionParticle2, in pm
      this.centerXOfMass1Property = new Property( null, CENTER_OF_MASS_OPTIONS );
      this.centerXOfMass2Property = new Property( null, CENTER_OF_MASS_OPTIONS );

      // @public flow rate model for particles of types DiffusionParticle1 and DiffusionParticle2, in particles/pm
      this.particleFlowRate1 = new ParticleFlowRate( this.container.dividerX, this.particles1 );
      this.particleFlowRate2 = new ParticleFlowRate( this.container.dividerX, this.particles2 );

      // @public (read-only)
      this.collisionDetector = new CollisionDetector( this.container, [ this.particles1, this.particles2 ] );

      // Add or remove particles
      this.experiment.numberOfParticles1Property.link( numberOfParticles => {
        this.updateNumberOfParticles( numberOfParticles,
          this.container.leftBounds,
          this.experiment.mass1Property.value,
          this.experiment.radius1Property.value,
          this.experiment.initialTemperature1Property.value,
          this.particles1,
          DiffusionParticle1 );
      } );
      this.experiment.numberOfParticles2Property.link( numberOfParticles => {
        this.updateNumberOfParticles( numberOfParticles,
          this.container.rightBounds,
          this.experiment.mass2Property.value,
          this.experiment.radius2Property.value,
          this.experiment.initialTemperature2Property.value,
          this.particles2,
          DiffusionParticle2 );
      } );

      // Update mass and temperature of existing particles. This adjusts speed of the particles.
      Property.multilink( [ this.experiment.mass1Property, this.experiment.initialTemperature1Property ],
        ( mass, initialTemperature ) => { updateMassAndTemperature( mass, initialTemperature, this.particles1 ); }
      );
      Property.multilink( [ this.experiment.mass2Property, this.experiment.initialTemperature2Property ],
        ( mass, initialTemperature ) => { updateMassAndTemperature( mass, initialTemperature, this.particles2 ); }
      );

      Property.multilink( [ this.experiment.initialTemperature1Property, this.experiment.initialTemperature2Property ],
        ( initialTemperature1, initialTemperature2 ) => {
          if ( !this.isPlayingProperty.value ) {
            this.updateAverageTemperatures();
          }
        } );

      // Update radii of existing particles.
      this.experiment.radius1Property.link( radius => {
        updateRadius( radius, this.particles1, this.container.leftBounds, this.isPlayingProperty.value );
      } );
      this.experiment.radius2Property.link( radius => {
        updateRadius( radius, this.particles2, this.container.rightBounds, this.isPlayingProperty.value );
      } );

      // When the divider is restored, create a new initial state with same numbers of particles.
      this.container.hasDividerProperty.link( hasDivider => {
        if ( hasDivider ) {

          // Delete existing DiffusionParticle1 particles, create a new set
          const numberOfParticles1 = this.experiment.numberOfParticles1Property.value;
          this.experiment.numberOfParticles1Property.value = 0;
          this.experiment.numberOfParticles1Property.value = numberOfParticles1;

          // Delete existing DiffusionParticle2 particles, create a new set
          const numberOfParticles2 = this.experiment.numberOfParticles2Property.value;
          this.experiment.numberOfParticles2Property.value = 0;
          this.experiment.numberOfParticles2Property.value = numberOfParticles2;

          // Reset flow rate models
          this.particleFlowRate1.reset();
          this.particleFlowRate2.reset();
        }
      } );
    }

    /**
     * Resets the model.
     * @public
     * @override
     */
    reset() {
      super.reset();

      this.container.reset();
      this.experiment.reset();
      this.data.reset();
      this.centerXOfMass1Property.reset();
      this.centerXOfMass2Property.reset();
      this.particleFlowRate1.reset();
      this.particleFlowRate2.reset();

      assert && assert( this.particles1.length === 0, 'there should be no DiffusionParticle1 particles' );
      assert && assert( this.particles2.length === 0, 'there should be no DiffusionParticle2 particles' );
    }

    /**
     * Steps the model using model time units.
     * @param {number} dt - time delta, in ps
     * @protected
     * @override
     */
    stepModelTime( dt ) {
      super.stepModelTime( dt );

      // Step particles
      ParticleUtils.stepParticles( this.particles1, dt );
      ParticleUtils.stepParticles( this.particles2, dt );

      // Particle Flow Rate model
      if ( !this.container.hasDividerProperty.value ) {
        this.particleFlowRate1.step( dt );
        this.particleFlowRate2.step( dt );
      }

      // Collision detection and response
      this.collisionDetector.step( dt );

      // Update Properties that are based on the current state of the system.
      this.update();
    }

    /**
     * Adjusts an array of particles to have the desired number of elements.
     * @param {number} numberOfParticles - desired number of particles
     * @param {Bounds2} locationBounds - initial location will be inside this bounds
     * @param {number} mass
     * @param {number} radius
     * @param {number} initialTemperature
     * @param {Particle[]} particles - array of particles that corresponds to newValue and oldValue
     * @param {constructor} Constructor - constructor for elements in particles array
     * @private
     */
    updateNumberOfParticles( numberOfParticles, locationBounds, mass, radius, initialTemperature, particles, Constructor ) {
      const delta = numberOfParticles - particles.length;
      if ( delta !== 0 ) {
        if ( delta > 0 ) {
          addParticles( delta, locationBounds, mass, radius, initialTemperature, particles, Constructor );
        }
        else {
          ParticleUtils.removeParticles( -delta, particles );
        }
        this.numberOfParticlesChangedEmitter.emit();

        // If paused, update things that would normally be handled by step.
        if ( !this.isPlayingProperty.value ) {
          this.update();
        }
      }
    }

    /**
     * Updates Properties that are based on the current state of the particle system.
     * @private
     */
    update() {
      this.updateCenterOfMass();
      this.updateParticleCounts();
      this.updateAverageTemperatures(); // do this after updateParticleCounts!
    }

    /**
     * Updates the center of mass, as shown by the center-of-mass indicators.
     * @private
     */
    updateCenterOfMass() {
      this.centerXOfMass1Property.value = ParticleUtils.getCenterXOfMass( this.particles1 );
      this.centerXOfMass2Property.value = ParticleUtils.getCenterXOfMass( this.particles2 );
    }

    /**
     * Updates particle counts for the left and right sides of the container, as displayed in the Data accordion box.
     * @private
     */
    updateParticleCounts() {
      updateLeftRightCounts( this.particles1, this.container.leftBounds,
        this.data.leftNumberOfParticles1Property, this.data.rightNumberOfParticles1Property );
      updateLeftRightCounts( this.particles2, this.container.leftBounds,
        this.data.leftNumberOfParticles2Property, this.data.rightNumberOfParticles2Property );
    }

    /**
     * Updates average temperatures for the left and right sides of the container, as displayed in the Data accordion box.
     * @private
     */
    updateAverageTemperatures() {

      let leftTotalKE = 0;
      let rightTotalKE = 0;

      // add KE contribution for particle1
      for ( let i = 0; i < this.particles1.length; i++ ) {
        const particle = this.particles1[ i ];
        if ( this.container.leftBounds.containsPoint( particle.location ) ) {
          leftTotalKE += particle.kineticEnergy;
        }
        else {
          rightTotalKE += particle.kineticEnergy;
        }
      }

      // add KE contribution for particle2
      for ( let i = 0; i < this.particles2.length; i++ ) {
        const particle = this.particles2[ i ];
        if ( this.container.leftBounds.containsPoint( particle.location ) ) {
          leftTotalKE += particle.kineticEnergy;
        }
        else {
          rightTotalKE += particle.kineticEnergy;
        }
      }

      updateAverageTemperature( this.data.leftAverageTemperatureProperty, leftTotalKE, this.data.leftNumberOfParticles );
      updateAverageTemperature( this.data.rightAverageTemperatureProperty, rightTotalKE, this.data.rightNumberOfParticles );
    }
  }

  /**
   * Adds n particles to the end of the specified array.
   * @param {number} n
   * @param {Bounds2} locationBounds - initial location will be inside this bounds
   * @param {number} mass
   * @param {number} radius
   * @param {number} initialTemperature
   * @param {Particle[]} particles
   * @param {constructor} Constructor - a Particle subclass constructor
   */
  function addParticles( n, locationBounds, mass, radius, initialTemperature, particles, Constructor ) {

    // Create n particles
    for ( let i = 0; i < n; i++ ) {

      const particle = new Constructor( {
        mass: mass,
        radius: radius
      } );

      // Position the particle at a random location within locationBounds, accounting for particle radius.
      const x = phet.joist.random.nextDoubleBetween( locationBounds.minX + particle.radius, locationBounds.maxX - particle.radius );
      const y = phet.joist.random.nextDoubleBetween( locationBounds.minY + particle.radius, locationBounds.maxY - particle.radius );
      particle.setLocationXY( x, y );
      assert && assert( locationBounds.containsPoint( particle.location ), 'particle is outside of locationBounds' );

      // Set the initial velocity, based on initial temperature and mass.
      particle.setVelocityPolar(
        // |v| = sqrt( 3kT / m )
        Math.sqrt( 3 * GasPropertiesConstants.BOLTZMANN * initialTemperature / particle.mass ),

        // Random angle
        phet.joist.random.nextDouble() * 2 * Math.PI
      );

      particles.push( particle );
    }
  }

  /**
   * Updates an average temperature Property.
   * @param {Property.<number|null>} averageTemperatureProperty - null if there are no particles
   * @param {number} totalKE
   * @param {number} numberOfParticles
   */
  function updateAverageTemperature( averageTemperatureProperty, totalKE, numberOfParticles ) {
    if ( numberOfParticles === 0 ) {
      averageTemperatureProperty.value = null;
    }
    else {

      // T = (2/3)KE/k
      const averageKE = totalKE / numberOfParticles;
      averageTemperatureProperty.value = ( 2 / 3 ) * averageKE / GasPropertiesConstants.BOLTZMANN; // K
    }
  }

  /**
   * When mass or initial temperature changes, update particles and adjust their speed accordingly.
   * @param {number} mass
   * @param {number} temperature
   * @param {Particle[]} particles
   */
  function updateMassAndTemperature( mass, temperature, particles ) {
    for ( let i = 0; i < particles.length; i++ ) {
      particles[ i ].mass = mass;

      // |v| = sqrt( 3kT / m )
      particles[ i ].setVelocityMagnitude( Math.sqrt( 3 * GasPropertiesConstants.BOLTZMANN * temperature / mass ) );
    }
  }

  /**
   * Updates the radius for a set of particles.
   * @param {number} radius
   * @param {Particle[]} particles
   * @param {Bounds2} bounds - particles should be inside these bounds
   * @param {boolean} isPlaying
   */
  function updateRadius( radius, particles, bounds, isPlaying ) {
    for ( let i = 0; i < particles.length; i++ ) {

      const particle = particles[ i ];
      particle.radius = radius;

      // If the sim is paused, then adjust the location of any particles are not fully inside the bounds.
      // While the sim is playing, this adjustment will be handled by collision detection.
      if ( !isPlaying ) {

        // constrain horizontally
        if ( particle.left < bounds.minX ) {
          particle.left = bounds.minX;
        }
        else if ( particle.right > bounds.maxX ) {
          particle.right = bounds.maxX;
        }

        // constrain vertically
        if ( particle.bottom < bounds.minY ) {
          particle.bottom = bounds.minY;
        }
        else if ( particle.top > bounds.maxY ) {
          particle.top = bounds.maxY;
        }
      }
    }
  }

  /**
   * Updates particle counts for the left and right sides of the container.
   * @param {Particle[]} particles
   * @param {Bounds2} leftBounds
   * @param {NumberProperty} leftNumberOfParticlesProperty
   * @param {NumberProperty} rightNumberOfParticlesProperty
   */
  function updateLeftRightCounts( particles, leftBounds, leftNumberOfParticlesProperty, rightNumberOfParticlesProperty ) {
    let leftNumberOfParticles = 0;
    let rightNumberOfParticles = 0;
    for ( let i = 0; i < particles.length; i++ ) {
      if ( leftBounds.containsPoint( particles[ i ].location ) ) {
        leftNumberOfParticles++;
      }
      else {
        rightNumberOfParticles++;
      }
    }
    leftNumberOfParticlesProperty.value = leftNumberOfParticles;
    rightNumberOfParticlesProperty.value = rightNumberOfParticles;
  }

  return gasProperties.register( 'DiffusionModel', DiffusionModel );
} );