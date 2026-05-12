import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { AccountCardsPlaceholderComponent } from './account-cards-placeholder.component';
import { CardService } from '../services/card.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('AccountCardsPlaceholderComponent', () => {
  let component: AccountCardsPlaceholderComponent;
  let fixture: ComponentFixture<AccountCardsPlaceholderComponent>;
  let cardServiceSpy: jasmine.SpyObj<CardService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    cardServiceSpy = jasmine.createSpyObj('CardService', [
      'getCardsByAccountNumber',
      'getCardDetails',
      'blockCard',
      'unblockCard',
      'deactivateCard'
    ]);
    // PR_31 follow-up: bez query param-a komponenta postavlja hasError = true i ne zove servis,
    // ali stub mora postojati za slucaj da test prosirimo da gledamo flow sa accountNumber-om.
    cardServiceSpy.getCardsByAccountNumber.and.returnValue(of([]));

    toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);

    // PR_31 follow-up: ActivatedRoute mock — snapshot.queryParamMap je ono sto komponenta cita.
    const activatedRouteStub = {
      snapshot: {
        queryParamMap: convertToParamMap({})
      }
    };

    await TestBed.configureTestingModule({
      declarations: [AccountCardsPlaceholderComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: CardService, useValue: cardServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountCardsPlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark hasError when accountNumber query param is missing', () => {
    expect(component.hasError).toBeTrue();
    expect(component.errorMessage).toContain('Broj računa');
  });
});
