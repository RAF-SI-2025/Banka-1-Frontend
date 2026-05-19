import { AbstractControl } from '@angular/forms';
import {
  emailFormatValidator,
  exactDigitsValidator,
  notFutureDateValidator,
  phoneNumberValidator,
} from './validators';

/** Pravi minimalni AbstractControl stub sa zadatom vrednoscu. */
function ctrl(value: unknown): AbstractControl {
  return { value } as AbstractControl;
}

describe('validators', () => {
  describe('exactDigitsValidator', () => {
    it('prihvata tacan broj cifara', () => {
      expect(exactDigitsValidator(4)(ctrl('1234'))).toBeNull();
    });

    it('odbija pogresan broj cifara', () => {
      expect(exactDigitsValidator(4)(ctrl('123'))).toEqual({
        exactDigits: { requiredLength: 4, actualLength: 3 },
      });
    });

    it('odbija ne-cifarski sadrzaj', () => {
      expect(exactDigitsValidator(4)(ctrl('12a4'))).toEqual({ notDigitsOnly: true });
    });

    it('prazna vrednost je validna', () => {
      expect(exactDigitsValidator(4)(ctrl(''))).toBeNull();
      expect(exactDigitsValidator(4)(ctrl(null))).toBeNull();
    });
  });

  describe('emailFormatValidator', () => {
    it('prihvata validan email', () => {
      expect(emailFormatValidator(ctrl('banka@primer.rs'))).toBeNull();
      expect(emailFormatValidator(ctrl('ime.prezime@banka1.rs'))).toBeNull();
      expect(emailFormatValidator(ctrl('a+tag@sub.domen.co.uk'))).toBeNull();
    });

    it('odbija email bez @', () => {
      expect(emailFormatValidator(ctrl('bankaprimer.rs'))).toEqual({ emailFormat: true });
    });

    it('odbija email bez domena', () => {
      expect(emailFormatValidator(ctrl('banka@'))).toEqual({ emailFormat: true });
    });

    it('odbija email bez TLD-a', () => {
      expect(emailFormatValidator(ctrl('banka@primer'))).toEqual({ emailFormat: true });
    });

    it('odbija email sa razmakom', () => {
      expect(emailFormatValidator(ctrl('ba nka@primer.rs'))).toEqual({ emailFormat: true });
    });

    it('prazna vrednost je validna (required to hvata)', () => {
      expect(emailFormatValidator(ctrl(''))).toBeNull();
      expect(emailFormatValidator(ctrl(null))).toBeNull();
      expect(emailFormatValidator(ctrl(undefined))).toBeNull();
    });
  });

  describe('phoneNumberValidator', () => {
    it('prihvata cifre bez prefiksa', () => {
      expect(phoneNumberValidator(ctrl('0611234567'))).toBeNull();
    });

    it('prihvata cifre sa vodecim +', () => {
      expect(phoneNumberValidator(ctrl('+381611234567'))).toBeNull();
    });

    it('odbija slova', () => {
      expect(phoneNumberValidator(ctrl('06abc1234'))).toEqual({ phoneFormat: true });
    });

    it('odbija + koji nije na pocetku', () => {
      expect(phoneNumberValidator(ctrl('0611+234567'))).toEqual({ phoneFormat: true });
    });

    it('odbija previse kratak broj', () => {
      expect(phoneNumberValidator(ctrl('1234567'))).toEqual({ phoneFormat: true });
    });

    it('odbija previse dug broj', () => {
      expect(phoneNumberValidator(ctrl('+1234567890123456'))).toEqual({ phoneFormat: true });
    });

    it('odbija razmake', () => {
      expect(phoneNumberValidator(ctrl('+381 61 1234567'))).toEqual({ phoneFormat: true });
    });

    it('prazna vrednost je validna (required to hvata)', () => {
      expect(phoneNumberValidator(ctrl(''))).toBeNull();
      expect(phoneNumberValidator(ctrl(null))).toBeNull();
    });
  });

  describe('notFutureDateValidator', () => {
    it('prihvata datum u proslosti', () => {
      expect(notFutureDateValidator(ctrl('1990-01-01'))).toBeNull();
    });

    it('prihvata danasnji datum', () => {
      const today = new Date().toISOString().slice(0, 10);
      expect(notFutureDateValidator(ctrl(today))).toBeNull();
    });

    it('odbija datum u buducnosti', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const futureIso = future.toISOString().slice(0, 10);
      expect(notFutureDateValidator(ctrl(futureIso))).toEqual({ futureDate: true });
    });

    it('odbija neispravan datum-string', () => {
      expect(notFutureDateValidator(ctrl('nije-datum'))).toEqual({ futureDate: true });
    });

    it('prazna vrednost je validna (required to hvata)', () => {
      expect(notFutureDateValidator(ctrl(''))).toBeNull();
      expect(notFutureDateValidator(ctrl(null))).toBeNull();
    });
  });
});
