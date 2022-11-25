// Copyright 2018-2022, University of Colorado Boulder

/**
 * PressureDisplay displays the pressure value, with the ability to switch units via a combo box.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Range from '../../../../dot/js/Range.js';
import { EmptySelfOptions, optionize3 } from '../../../../phet-core/js/optionize.js';
import PickOptional from '../../../../phet-core/js/types/PickOptional.js';
import PickRequired from '../../../../phet-core/js/types/PickRequired.js';
import ComboBoxDisplay, { ComboBoxDisplayItem, ComboBoxDisplayOptions } from '../../../../scenery-phet/js/ComboBoxDisplay.js';
import { Node, NodeTranslationOptions } from '../../../../scenery/js/imports.js';
import gasProperties from '../../gasProperties.js';
import GasPropertiesStrings from '../../GasPropertiesStrings.js';
import GasPropertiesConstants from '../GasPropertiesConstants.js';
import GasPropertiesQueryParameters from '../GasPropertiesQueryParameters.js';
import PressureGauge from '../model/PressureGauge.js';
import PressureUnits from '../model/PressureUnits.js';

// constants
const NUMBER_DISPLAY_RANGE = new Range( 0, GasPropertiesQueryParameters.maxPressure );

type SelfOptions = EmptySelfOptions;

type PressureDisplayOptions = SelfOptions & NodeTranslationOptions &
  PickOptional<ComboBoxDisplayOptions, 'maxWidth'> &
  PickRequired<ComboBoxDisplayOptions, 'tandem'>;

export default class PressureDisplay extends ComboBoxDisplay<PressureUnits> {

  public constructor( pressureGauge: PressureGauge, listboxParent: Node, providedOptions: PressureDisplayOptions ) {

    const options = optionize3<PressureDisplayOptions, SelfOptions, ComboBoxDisplayOptions>()(
      {}, GasPropertiesConstants.COMBO_BOX_DISPLAY_OPTIONS, providedOptions );

    const items: ComboBoxDisplayItem<PressureUnits>[] = [
      {
        choice: PressureUnits.ATMOSPHERES,
        tandemName: `${PressureUnits.ATMOSPHERES.toString().toLowerCase()}Item`,
        numberProperty: pressureGauge.pressureAtmospheresProperty,
        range: NUMBER_DISPLAY_RANGE,
        units: GasPropertiesStrings.atmospheres,
        numberDisplayOptions: {
          decimalPlaces: 1
        }
      },
      {
        choice: PressureUnits.KILOPASCALS,
        tandemName: `${PressureUnits.KILOPASCALS.toString().toLowerCase()}Item`,
        numberProperty: pressureGauge.pressureKilopascalsProperty,
        range: NUMBER_DISPLAY_RANGE,
        units: GasPropertiesStrings.kilopascals,
        numberDisplayOptions: {
          decimalPlaces: 0
        }
      }
    ];

    super( pressureGauge.unitsProperty, items, listboxParent, options );
  }
}

gasProperties.register( 'PressureDisplay', PressureDisplay );