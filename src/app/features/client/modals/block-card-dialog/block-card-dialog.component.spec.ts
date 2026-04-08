import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockCardDialogComponent } from './block-card-dialog.component';

describe('BlockCardDialogComponent', () => {
  let component: BlockCardDialogComponent;
  let fixture: ComponentFixture<BlockCardDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BlockCardDialogComponent]
    });
    fixture = TestBed.createComponent(BlockCardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
