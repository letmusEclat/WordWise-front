import { Component, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-section-card',
  templateUrl: './section-card.component.html',
  styleUrls: ['./section-card.component.scss']
})
export class SectionCardComponent {
  @Input() icon = '';
  @Input() label = '';
  @Input() subtitle = '';
  @Input() active = false;

  @Output() select = new EventEmitter<void>();

  @HostBinding('attr.tabindex') tabIndex = 0;
  @HostBinding('attr.role') role = 'button';
  @HostBinding('class.active') get isActive(): boolean {
    return this.active;
  }

  @HostListener('click') onClick(): void {
    this.select.emit();
  }

  @HostListener('keyup.enter') onEnter(): void {
    this.select.emit();
  }
}
