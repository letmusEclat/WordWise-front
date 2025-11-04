import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface WordItem {
  id?: number;
  title: string;
  meaning?: string;
  imageUrl?: string; // preview path/base64
  favorite?: boolean; // marca de favorito
  category?: string; // id de categoría
  addCard?: boolean; // special "Agregar" card
}

@Component({
  selector: 'app-word-card',
  templateUrl: './word-card.component.html',
  styleUrls: ['./word-card.component.scss']
})
export class WordCardComponent {
  @Input() word!: WordItem;
  @Output() add = new EventEmitter<void>();
  @Output() delete = new EventEmitter<WordItem>();
  @Output() edit = new EventEmitter<WordItem>();
  @Output() favoriteToggle = new EventEmitter<WordItem>();

  onAddClick() {
    if (this.word?.addCard) {
      this.add.emit();
    }
  }

  onDeleteClick(ev: MouseEvent) {
    ev.stopPropagation();
    this.delete.emit(this.word);
  }

  onFavoriteClick(ev: MouseEvent) {
    ev.stopPropagation();
    this.favoriteToggle.emit(this.word);
  }

  onRootClick() {
    if (!this.word.addCard) {
      this.edit.emit(this.word);
    }
  }
}
