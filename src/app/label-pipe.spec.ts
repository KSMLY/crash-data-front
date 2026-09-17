import { LabelPipe } from './label-pipe';

describe('LabelPipe', () => {
  const pipe = new LabelPipe();

  it('uses the special label when one exists', () => {
    expect(pipe.transform('X_JUNCTION')).toBe('Crossroads');
  });

  it('falls back to spaced, capitalised text', () => {
    expect(pipe.transform('SEVERE_WINDS')).toBe('Severe winds');
  });

  it('returns empty for null', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
