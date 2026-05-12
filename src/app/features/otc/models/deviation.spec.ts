import { deviationLevel, deviationColorClass, deviationLabel } from './deviation';

describe('OTC deviation utility', () => {
  describe('deviationLevel', () => {
    it('vraca GREEN za odstupanje do +/-5%', () => {
      expect(deviationLevel(100, 100)).toBe('GREEN');
      expect(deviationLevel(104, 100)).toBe('GREEN');
      expect(deviationLevel(96, 100)).toBe('GREEN');
      expect(deviationLevel(105, 100)).toBe('GREEN');
    });

    it('vraca YELLOW za odstupanje +/-5% do +/-20%', () => {
      expect(deviationLevel(110, 100)).toBe('YELLOW');
      expect(deviationLevel(85, 100)).toBe('YELLOW');
      expect(deviationLevel(120, 100)).toBe('YELLOW');
    });

    it('vraca RED za odstupanje veca od +/-20%', () => {
      expect(deviationLevel(125, 100)).toBe('RED');
      expect(deviationLevel(75, 100)).toBe('RED');
      expect(deviationLevel(200, 100)).toBe('RED');
    });

    it('vraca YELLOW za nevazeci marketPrice', () => {
      expect(deviationLevel(100, 0)).toBe('YELLOW');
      expect(deviationLevel(100, -1)).toBe('YELLOW');
    });
  });

  describe('deviationColorClass', () => {
    it('mapira level na z-diff design tokene (PR_31 T27)', () => {
      expect(deviationColorClass('GREEN')).toBe('z-diff-low');
      expect(deviationColorClass('YELLOW')).toBe('z-diff-mid');
      expect(deviationColorClass('RED')).toBe('z-diff-high');
    });
  });

  describe('deviationLabel', () => {
    it('formatira sa znakom i 2 decimale', () => {
      expect(deviationLabel(110, 100)).toBe('+10.00%');
      expect(deviationLabel(95, 100)).toBe('-5.00%');
      expect(deviationLabel(100, 100)).toBe('+0.00%');
    });

    it('vraca em-dash za nevazeci marketPrice', () => {
      expect(deviationLabel(100, 0)).toBe('—');
    });
  });
});
