import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../models/card.model';

@Component({
  selector: 'app-block-card-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './block-card-dialog.component.html',
  styleUrls: ['./block-card-dialog.component.scss']
})
export class BlockCardDialogComponent {
  @Input() public card: Card | null = null;
  @Input() public maskedCardNumber = '';
  @Input() public cardTypeLabel = '';

  @Output() public cancel = new EventEmitter<void>();
  @Output() public confirm = new EventEmitter<void>();

  public onCancel(): void {
    this.cancel.emit();
  }

  public onConfirm(): void {
    this.confirm.emit();
  }
}
