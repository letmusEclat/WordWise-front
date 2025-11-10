import { Injectable } from '@angular/core';
import { WordItem } from '../components/word-card/word-card.component';

export interface Category {
  id: string;
  name: string;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class WordDataService {
  private categories: Category[] = [
    { id: 'aleatorias', name: 'Aleatorias', icon: 'assets/icons/flashcards.svg' },
    { id: 'hogar', name: 'Hogar', icon: 'assets/icons/flashcards.svg' },
    { id: 'polite', name: 'Polite', icon: 'assets/icons/flashcards.svg' }
  ];

  private words: WordItem[] = [
    { id: 1, title: 'Gorgeous', meaning: 'Muy hermoso/a', favorite: true, category: 'aleatorias' },
    { id: 2, title: 'Mountain', meaning: 'Montaña', favorite: false, category: 'aleatorias' },
    { id: 3, title: 'Taste', meaning: 'Sabor', favorite: false, category: 'hogar' },
    { id: 4, title: 'Phone', meaning: 'Teléfono', favorite: false, category: 'hogar' },
    { id: 5, title: 'Dog', meaning: 'Perro', favorite: false, category: 'polite' },
    { id: 6, title: 'Rabbit', meaning: 'Pequeño mamífero con largas orejas y patas traseras fuertes.', favorite: false, category: 'aleatorias' },
    { id: 7, title: 'Notebook', meaning: 'Cuaderno usado para tomar notas o estudiar.', favorite: false, category: 'hogar' },
    { id: 8, title: 'Kitchen', meaning: 'Lugar donde se preparan los alimentos.', favorite: false, category: 'hogar' },
    { id: 9, title: 'Smile', meaning: 'Gesto de alegría que se muestra con la boca.', favorite: true, category: 'polite' },
    { id: 10, title: 'River', meaning: 'Corriente natural de agua que fluye hacia el mar.', favorite: false, category: 'aleatorias' }
  ];

  private nextId = 11;
  private reviewWordIds = new Set<number>();

  getCategories(): Category[] {
    return this.categories.map(cat => ({ ...cat }));
  }

  getWords(): WordItem[] {
    return this.words.map(word => ({ ...word }));
  }

  getRandomWords(count: number, categoryId?: string): WordItem[] {
    const pool = categoryId ? this.words.filter(word => word.category === categoryId) : this.words;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, shuffled.length)).map(word => ({ ...word }));
  }

  createWord(payload: Omit<WordItem, 'id'>): WordItem {
    const word: WordItem = { ...payload, favorite: !!payload.favorite, id: this.nextId++ };
    this.words = [word, ...this.words];
    return { ...word };
  }

  updateWord(updated: WordItem) {
    this.words = this.words.map(w => w.id === updated.id ? { ...w, ...updated, favorite: !!updated.favorite } : w);
  }

  deleteWord(id: number) {
    this.words = this.words.filter(w => w.id !== id);
    this.reviewWordIds.delete(id);
  }

  getWordById(id: number): WordItem | undefined {
    const found = this.words.find(w => w.id === id);
    return found ? { ...found } : undefined;
  }

  markWordForReview(id: number): void {
    if (this.words.some(word => word.id === id)) {
      this.reviewWordIds.add(id);
    }
  }

  clearWordFromReview(id: number): void {
    this.reviewWordIds.delete(id);
  }

  getReviewWords(): WordItem[] {
    return Array.from(this.reviewWordIds)
      .map(id => this.getWordById(id))
      .filter((word): word is WordItem => !!word);
  }
}