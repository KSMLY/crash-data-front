import { Pipe, PipeTransform } from '@angular/core';

// Codes whose default "spaces + capital" rendering reads badly.
const SPECIAL: Record<string, string> = {
  NOT_AT_JUNCTION: 'Not at a junction',
  X_JUNCTION: 'Crossroads',
  URBAN_TWO_WAY: 'Urban two-way',
  RURAL_TWO_WAY: 'Rural two-way',
  DARK_LIT: 'Dark, street lights on',
  DARK_UNLIT: 'Dark, no street lights',
  DAWN_DUSK: 'Dawn or dusk',
  SERIOUS: 'Serious injury',
  SLIGHT: 'Slight injury',
};

@Pipe({ name: 'label' })
export class LabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    if (SPECIAL[value]) return SPECIAL[value];
    const words = value.toLowerCase().replace(/_/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
}
