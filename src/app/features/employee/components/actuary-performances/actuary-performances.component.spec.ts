import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActuaryPerformancesComponent } from './actuary-performances.component';

describe('ActuaryPerformancesComponent', () => {
  let component: ActuaryPerformancesComponent;
  let fixture: ComponentFixture<ActuaryPerformancesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActuaryPerformancesComponent]
    });
    fixture = TestBed.createComponent(ActuaryPerformancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
