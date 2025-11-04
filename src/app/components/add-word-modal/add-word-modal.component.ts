import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Category } from '../../services/word-data.service';

export interface NewWordForm {
  id?: number;
  title: string;
  meaning: string;
  imageFile?: File | null;
  imagePreview?: string;
  favorite?: boolean;
  category?: string;
}

@Component({
  selector: 'app-add-word-modal',
  templateUrl: './add-word-modal.component.html',
  styleUrls: ['./add-word-modal.component.scss']
})
export class AddWordModalComponent implements OnChanges {
  @Output() save = new EventEmitter<NewWordForm>();
  @Output() cancel = new EventEmitter<void>();
  @Input() word?: NewWordForm; // if provided, editing mode
  @Input() categories: Category[] = [];
  @Input() defaultCategoryId?: string;

  form: NewWordForm = {
    title: '',
    meaning: '',
    imageFile: null,
    imagePreview: '',
    favorite: false,
    category: undefined
  };

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.form.imageFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.form.imagePreview = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['word']) {
      if (this.word) {
        const w: any = this.word; // allow reading imageUrl if passed from WordItem
        this.form = {
          id: w.id,
          title: w.title || '',
          meaning: w.meaning || '',
          imagePreview: w.imagePreview || w.imageUrl || '',
          imageFile: null,
          favorite: !!w.favorite,
          category: w.category
        };
        this.ensureCategoryDefault();
      } else {
        this.form = { title: '', meaning: '', imageFile: null, imagePreview: '', favorite: false, category: this.defaultCategoryId };
        this.ensureCategoryDefault();
      }
    }
    if (changes['categories'] || changes['defaultCategoryId']) {
      if (!this.word) {
        this.ensureCategoryDefault();
      }
    }
  }

  submit() {
    if (!this.form.title || !this.form.meaning) {
      return;
    }
    if (!this.form.category) {
      this.ensureCategoryDefault();
    }
    // Emit id if editing
    this.save.emit({ ...this.form });
  }

  close() {
    this.cancel.emit();
  }

  private ensureCategoryDefault() {
    if (!this.form.category) {
      this.form.category = this.defaultCategoryId || this.categories[0]?.id;
    }
  }
}
