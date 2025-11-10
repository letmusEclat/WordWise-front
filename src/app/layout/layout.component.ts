import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
    { label: 'Por repasar', icon: 'assets/icons/flashcards.svg' }
  ];

  public categories: CategoryView[] = [];
  public words: WordItem[] = [];
  public activeCategory?: CategoryView;
  public searchMode: 'all' | 'favorites' | 'review' = 'all';
  public reviewWords: WordItem[] = [];

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

  constructor(private data: WordDataService, private router: Router) {}

  ngOnInit(): void {
    this.categories = this.data.getCategories().map(cat => ({ ...cat }));
    this.highlightDefaultCategory();
    this.words = this.data.getWords();
    this.reviewWords = this.data.getReviewWords();
  }

  get filteredWords(): WordItem[] {
    const categoryId = this.activeCategory?.id;

    if (this.searchMode === 'favorites') {
      return this.words.filter(w => w.favorite && (!categoryId || w.category === categoryId));
    }

    if (this.searchMode === 'review') {
      return this.reviewWords.filter(w => !categoryId || w.category === categoryId);
    }

    if (!categoryId) return this.words;

    return this.words.filter(w => w.category === categoryId);
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
      this.searchMode = 'all';
      this.currentView = 'categories';
      this.clearCategoryFilter(false);
      this.previousView = 'categories';
    } else if (item.label === 'Buscar palabra') {
      this.activateSearchView('all');
    } else {
      this.searchMode = 'all';
      this.currentView = 'sections';
      this.previousView = 'sections';
      this.navigation = this.navigation.map(i => ({ ...i, active: i.label === 'Perfil' }));
    }
  }

  public onSectionSelect(section: SectionItem): void {
    this.sections = this.sections.map(item => ({
      ...item,
      active: item.label === section.label
    }));
    if (section.label === 'Practicar') {
      this.startPracticeSession();
      return;
    }
    if (section.label === 'Favoritos') {
      this.activateSearchView('favorites', { preserveCategory: true });
      return;
    }
    if (section.label === 'Por repasar') {
      this.activateSearchView('review', { preserveCategory: true });
      return;
    }
    this.currentView = 'sections';
    this.previousView = 'sections';
    this.searchMode = 'all';
    this.navigation = this.navigation.map(i => ({ ...i, active: i.label === 'Perfil' }));
  }

  public onCategoryClick(cat: CategoryView): void {
    this.setActiveCategory(cat.id);
    this.searchMode = 'all';
    this.currentView = 'sections';
    this.previousView = 'sections';
    this.sections = this.sections.map(item => ({ ...item, active: item.label === 'Practicar' }));
    this.navigation = this.navigation.map(i => ({ ...i, active: i.label === 'Perfil' }));
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

    this.refreshWords();
    this.showAddModal = false;
  }

  public requestDeleteWord(word: WordItem): void {
    this.wordToDelete = word;
  }

  public confirmDeleteWord(): void {
    if (this.wordToDelete) {
      this.data.deleteWord(this.wordToDelete.id!);
      this.refreshWords();
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
      this.refreshWords();
    }
  }

  public cancelLogout(): void {
    // Volver a la vista previa y reactivar su item
    this.currentView = this.previousView;
    this.navigation = this.navigation.map(i => ({ ...i, active: (i.label === 'Ver categorías' && this.currentView==='categories') || (i.label==='Buscar palabra' && this.currentView==='search') || (i.label!=='Ver categorías' && i.label!=='Buscar palabra' && this.currentView==='sections') }));
  }

  public confirmLogout(): void {
    // Placeholder de lógica real de logout (limpieza de sesión si aplica)
    // Navegar a pantalla de login
    this.router.navigate(['/login']);
  }

  public cancelDeleteAccount(): void {
    this.currentView = this.previousView;
    this.navigation = this.navigation.map(i => ({ ...i, active: (i.label === 'Ver categorías' && this.currentView==='categories') || (i.label==='Buscar palabra' && this.currentView==='search') || (i.label!=='Ver categorías' && i.label!=='Buscar palabra' && this.currentView==='sections') }));
  }

  public confirmDeleteAccount(): void {
    // Placeholder de lógica real de eliminación
    this.router.navigate(['/login']);
  }

  public clearCategoryFilter(removeHighlight = true): void {
    if (removeHighlight) {
      this.setActiveCategory(undefined);
    } else {
      this.activeCategory = undefined;
      this.highlightDefaultCategory();
    }
  }

  private highlightDefaultCategory(): void {
    this.categories = this.categories.map((c, idx) => ({ ...c, active: idx === 0 }));
  }

  private setActiveCategory(categoryId: string | undefined): void {
    this.categories = this.categories.map(c => ({ ...c, active: !!categoryId && c.id === categoryId }));
    this.activeCategory = categoryId ? this.categories.find(c => c.id === categoryId) : undefined;
  }

  private activateSearchView(mode: 'all' | 'favorites' | 'review', options: { preserveCategory?: boolean } = {}): void {
    this.searchMode = mode;
    this.currentView = 'search';
    this.previousView = 'search';
    const categoryId = options.preserveCategory ? this.activeCategory?.id : undefined;
    this.setActiveCategory(categoryId);
    this.navigation = this.navigation.map(i => ({ ...i, active: i.label === 'Buscar palabra' }));
    if (mode === 'review') {
      this.reviewWords = this.data.getReviewWords();
    }
  }

  public clearSearchMode(): void {
    this.activateSearchView('all', { preserveCategory: true });
  }

  private refreshWords(): void {
    this.words = this.data.getWords();
    this.reviewWords = this.data.getReviewWords();
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
    const categoryId = this.activeCategory?.id;
    this.practiceWords = this.data.getRandomWords(this.practiceSessionSize, categoryId);
    this.practiceIndex = 0;
    this.practiceRevealed = false;
    this.practiceLearned = 0;
    this.practiceForgotten = 0;
    this.practiceFinished = this.practiceWords.length === 0;
    this.sections = this.sections.map(item => ({ ...item, active: item.label === 'Practicar' }));
    this.currentView = 'practice';
    this.previousView = 'practice';
    this.navigation = this.navigation.map(item => ({ ...item, active: item.label === 'Perfil' }));
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
    if (this.practiceCurrentWord.id) {
      this.data.clearWordFromReview(this.practiceCurrentWord.id);
      this.reviewWords = this.data.getReviewWords();
    }
    this.practiceLearned++;
    this.advancePracticeQueue();
  }

  public handlePracticeDislike(): void {
    if (this.practiceFinished || !this.practiceCurrentWord) {
      return;
    }
    if (this.practiceCurrentWord.id) {
      this.data.markWordForReview(this.practiceCurrentWord.id);
      this.reviewWords = this.data.getReviewWords();
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
    this.sections = this.sections.map(item => ({ ...item, active: item.label === 'Practicar' }));
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
