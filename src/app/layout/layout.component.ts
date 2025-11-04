import { Component, OnInit } from '@angular/core';
import { WordItem } from '../components/word-card/word-card.component';
import { NewWordForm } from '../components/add-word-modal/add-word-modal.component';
import { WordDataService, Category } from '../services/word-data.service';

interface NavigationItem {
  label: string;
  icon: string;
  variant?: 'danger';
  active?: boolean;
}

interface SectionItem {
  label: string;
  icon: string;
  active?: boolean;
}

type BaseView = 'categories' | 'sections' | 'search' | 'practice';
type CategoryView = Category & { active?: boolean };

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  public user = {
    name: 'Juan Sebastian',
    avatar: 'assets/img/avatar-juan.svg'
  };

  // Vista actual; la app inicia en "Ver categorías"
  public currentView: BaseView | 'logout' | 'deleteAccount' = 'categories';
  private previousView: BaseView = 'categories';

  public navigation: NavigationItem[] = [
    { label: 'Perfil', icon: 'person' },
    { label: 'Ver categorías', icon: 'folder_open', active: true },
    { label: 'Buscar palabra', icon: 'search' },
    { label: 'Cerrar sesión', icon: 'logout' },
    { label: 'Eliminar cuenta', icon: 'delete', variant: 'danger' }
  ];

  public sections: SectionItem[] = [
    { label: 'Avance', icon: 'assets/icons/mountain-flag.svg' },
    { label: 'Favoritos', icon: 'assets/icons/favorite-star.svg' },
    { label: 'Practicar', icon: 'assets/icons/calendar-sun.svg', active: true },
    { label: 'Por repasar', icon: 'assets/icons/flashcards.svg' },
    { label: 'Olvidados', icon: 'assets/icons/brain-spiral.svg' }
  ];

  public categories: CategoryView[] = [];
  public words: WordItem[] = [];
  public activeCategory?: CategoryView;

  public showAddModal = false;
  public editingWord?: NewWordForm;
  public wordToDelete?: WordItem;
  // Practice session state
  public practiceWords: WordItem[] = [];
  public practiceIndex = 0;
  public practiceRevealed = false;
  public practiceLearned = 0;
  public practiceForgotten = 0;
  public practiceFinished = false;
  public practiceSessionSize = 10;

  constructor(private data: WordDataService) {}

  ngOnInit(): void {
    this.categories = this.data.getCategories().map(cat => ({ ...cat }));
    this.highlightDefaultCategory();
    this.words = this.data.getWords();
  }

  get filteredWords(): WordItem[] {
    if (!this.activeCategory) return this.words;
    return this.words.filter(w => w.category === this.activeCategory!.id);
  }
  public onNavClick(item: NavigationItem): void {
    this.navigation = this.navigation.map(i => ({ ...i, active: i.label === item.label }));
    if (item.label === 'Cerrar sesión') {
      // Guardamos la vista base actual (no diálogos) antes de mostrar confirmación
      if (this.currentView === 'categories' || this.currentView === 'sections' || this.currentView === 'search' || this.currentView === 'practice') {
        this.previousView = this.currentView;
      }
      this.currentView = 'logout';
      return;
    }
    if (item.label === 'Eliminar cuenta') {
      if (this.currentView === 'categories' || this.currentView === 'sections' || this.currentView === 'search' || this.currentView === 'practice') {
        this.previousView = this.currentView;
      }
      this.currentView = 'deleteAccount';
      return;
    }
    if (item.label === 'Ver categorías') {
      this.currentView = 'categories';
      this.clearCategoryFilter(false);
    } else if (item.label === 'Buscar palabra') {
      this.currentView = 'search';
      if (!this.activeCategory) {
        this.clearCategoryActiveState();
      }
    } else {
      this.currentView = 'sections';
    }
  }

  public onSectionSelect(section: SectionItem): void {
    this.sections = this.sections.map(item => ({
      ...item,
      active: item.label === section.label
    }));
    if (section.label === 'Practicar') {
      this.startPracticeSession();
    }
  }

  public onCategoryClick(cat: CategoryView): void {
    this.categories = this.categories.map(c => ({ ...c, active: c.id === cat.id }));
    this.activeCategory = this.categories.find(c => c.id === cat.id);
    this.currentView = 'search';
    // sincronizar navegación
    this.navigation = this.navigation.map(i => ({ ...i, active: i.label === 'Buscar palabra' }));
  }

  public openAddWord(): void {
    this.editingWord = undefined;
    this.showAddModal = true;
  }

  public cancelAddWord(): void {
    this.showAddModal = false;
  }

  public saveNewWord(form: NewWordForm): void {
    const categoryId = form.category || this.activeCategory?.id || this.categories[0]?.id;
    const favorite = !!form.favorite;
    const imageUrl = form.imagePreview;

    if (form.id) {
      this.data.updateWord({
        id: form.id,
        title: form.title,
        meaning: form.meaning,
        imageUrl,
        favorite,
        category: categoryId
      });
    } else {
      this.data.createWord({
        title: form.title,
        meaning: form.meaning,
        imageUrl,
        favorite,
        category: categoryId
      });
    }

    this.words = this.data.getWords();
    this.showAddModal = false;
  }

  public requestDeleteWord(word: WordItem): void {
    this.wordToDelete = word;
  }

  public confirmDeleteWord(): void {
    if (this.wordToDelete) {
      this.data.deleteWord(this.wordToDelete.id!);
      this.words = this.data.getWords();
      this.wordToDelete = undefined;
    }
  }

  public cancelDeleteWord(): void {
    this.wordToDelete = undefined;
  }

  public openEditWord(word: WordItem): void {
    this.editingWord = {
      id: word.id,
      title: word.title,
      meaning: word.meaning || '',
      imagePreview: word.imageUrl || '',
      imageFile: null,
      favorite: !!word.favorite,
      category: word.category || this.categories[0]?.id
    };
    this.showAddModal = true;
  }

  public toggleFavorite(word: WordItem): void {
    word.favorite = !word.favorite;
    if (word.id) {
      this.data.updateWord({ ...word });
      this.words = this.data.getWords();
    }
  }

  public cancelLogout(): void {
    // Volver a la vista previa y reactivar su item
    this.currentView = this.previousView;
    this.navigation = this.navigation.map(i => ({ ...i, active: (i.label === 'Ver categorías' && this.currentView==='categories') || (i.label==='Buscar palabra' && this.currentView==='search') || (i.label!=='Ver categorías' && i.label!=='Buscar palabra' && this.currentView==='sections') }));
  }

  public confirmLogout(): void {
    // Placeholder de lógica real de logout
    console.log('Sesión cerrada');
    // Después del logout regresamos a categorías y activamos su item
    this.currentView = 'categories';
    this.navigation = this.navigation.map(i => ({ ...i, active: i.label === 'Ver categorías' }));
  }

  public cancelDeleteAccount(): void {
    this.currentView = this.previousView;
    this.navigation = this.navigation.map(i => ({ ...i, active: (i.label === 'Ver categorías' && this.currentView==='categories') || (i.label==='Buscar palabra' && this.currentView==='search') || (i.label!=='Ver categorías' && i.label!=='Buscar palabra' && this.currentView==='sections') }));
  }

  public confirmDeleteAccount(): void {
    console.log('Cuenta eliminada');
    // Simulamos fin de sesión luego de eliminar cuenta
    this.currentView = 'categories';
    this.navigation = this.navigation.map(i => ({ ...i, active: i.label === 'Ver categorías' }));
  }

  public clearCategoryFilter(removeHighlight = true): void {
    this.activeCategory = undefined;
    if (removeHighlight) {
      this.clearCategoryActiveState();
    } else {
      this.highlightDefaultCategory();
    }
  }

  private clearCategoryActiveState(): void {
    this.categories = this.categories.map(c => ({ ...c, active: false }));
  }

  private highlightDefaultCategory(): void {
    this.categories = this.categories.map((c, idx) => ({ ...c, active: idx === 0 }));
  }

  // Practice helpers
  public get practiceCurrentWord(): WordItem | undefined {
    return this.practiceWords[this.practiceIndex];
  }

  public get practiceProgressCount(): number {
    if (!this.practiceWords.length) {
      return 0;
    }
    return this.practiceFinished ? this.practiceWords.length : this.practiceIndex + 1;
  }

  public startPracticeSession(): void {
    this.practiceWords = this.data.getRandomWords(this.practiceSessionSize);
    this.practiceIndex = 0;
    this.practiceRevealed = false;
    this.practiceLearned = 0;
    this.practiceForgotten = 0;
    this.practiceFinished = this.practiceWords.length === 0;
    this.sections = this.sections.map(item => ({ ...item, active: item.label === 'Practicar' }));
    this.currentView = 'practice';
    this.previousView = 'practice';
  }

  public togglePracticeReveal(): void {
    if (this.practiceFinished || !this.practiceCurrentWord) {
      return;
    }
    this.practiceRevealed = !this.practiceRevealed;
  }

  public handlePracticeLike(): void {
    if (this.practiceFinished || !this.practiceCurrentWord) {
      return;
    }
    this.practiceLearned++;
    this.advancePracticeQueue();
  }

  public handlePracticeDislike(): void {
    if (this.practiceFinished || !this.practiceCurrentWord) {
      return;
    }
    this.practiceForgotten++;
    this.advancePracticeQueue();
  }

  public restartPractice(): void {
    this.startPracticeSession();
  }

  public exitPracticeSession(): void {
    this.practiceWords = [];
    this.practiceIndex = 0;
    this.practiceRevealed = false;
    this.practiceLearned = 0;
    this.practiceForgotten = 0;
    this.practiceFinished = false;
    this.currentView = 'sections';
    this.previousView = 'sections';
    this.navigation = this.navigation.map(item => ({ ...item, active: item.label === 'Perfil' }));
  }

  private advancePracticeQueue(): void {
    if (this.practiceIndex < this.practiceWords.length - 1) {
      this.practiceIndex++;
      this.practiceRevealed = false;
    } else {
      this.practiceFinished = true;
    }
  }
}
