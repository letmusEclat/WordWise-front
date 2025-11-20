import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WordItem } from '../components/word-card/word-card.component';
import { NewWordForm } from '../components/add-word-modal/add-word-modal.component';
import { WordDataService, Category } from '../services/word-data.service';
import { AuthService, AuthUser } from '../services/auth.service';

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
  public user: AuthUser | null = null;

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
    { label: 'Olvidadas', icon: 'assets/icons/flashcards.svg' },
    { label: 'Por repasar', icon: 'psychology' }
  ];

  public categories: CategoryView[] = [];
  public words: WordItem[] = [];
  public activeCategory?: CategoryView;
  private currentPage = 0; // índice de página
  private pageSize = 10;
  public totalPages = 1;
  private selectedEstado?: string; // estado actual si se usa filtro estado
  private favoritesMode = false; // modo favoritos
  public searchMode: 'all' | 'favorites' | 'review' | 'forgotten' = 'all';
  public reviewWords: WordItem[] = [];

  public showAddModal = false;
  public editingWord?: NewWordForm;
  public pendingDelete?: WordItem; // palabra pendiente de confirmación de eliminación
  public deletingWord = false; // estado de carga para eliminación
  public savingWord = false; // estado de carga para creación/actualización
  // Practice session state
  public practiceWords: WordItem[] = [];
  public practiceIndex = 0;
  public practiceRevealed = false;
  public practiceLearned = 0;
  public practiceForgotten = 0;
  public practiceFinished = false;
  public practiceSessionSize = 10;

  constructor(private data: WordDataService, private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.user$.subscribe(u => {
      this.user = u;
    });
    // Cargar categorías desde servidor (Page) sin fallback local.
    this.data.fetchCategories().subscribe({
      next: cats => {
        this.categories = cats.map(cat => ({ ...cat }));
        this.highlightDefaultCategory();
        const first = this.categories[0];
        if (first) this.loadCategory(first.id);
      },
      error: () => {
        // En caso de error se deja lista vacía; se podría mostrar mensaje en UI.
        this.categories = [];
      }
    });
  }

  get filteredWords(): WordItem[] {
    const categoryId = this.activeCategory?.id;

    if (this.searchMode === 'favorites') {
      return this.words.filter(w => w.favorite && (!categoryId || w.category === categoryId));
    }

    if (this.searchMode === 'review') {
      return this.reviewWords.filter(w => !categoryId || w.category === categoryId);
    }

    if (this.searchMode === 'forgotten') {
      return this.words.filter(w => !categoryId || w.category === categoryId);
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
    if (section.label === 'Olvidadas') {
      this.activateSearchView('review', { preserveCategory: true });
      return;
    }
    if (section.label === 'Por repasar') {
      this.activateSearchView('forgotten', { preserveCategory: true });
      return;
    }
    this.currentView = 'sections';
    this.previousView = 'sections';
    this.searchMode = 'all';
    this.navigation = this.navigation.map(i => ({ ...i, active: i.label === 'Perfil' }));
  }

  public onCategoryClick(cat: CategoryView): void {
    this.loadCategory(cat.id, true);
    this.searchMode = 'all';
    this.currentView = 'sections';
    this.previousView = 'sections';
    this.sections = this.sections.map(item => ({ ...item, active: item.label === 'Practicar' }));
    this.navigation = this.navigation.map(i => ({ ...i, active: i.label === 'Perfil' }));
  }

  /** Carga inicial o cambio de categoría, reinicia filtros y página si corresponde */
  private loadCategory(categoryId: string, resetFilters: boolean = false): void {
    this.setActiveCategory(categoryId);
    if (resetFilters) {
      this.currentPage = 0;
      this.selectedEstado = undefined;
      this.favoritesMode = false;
    }
    this.fetchWords();
  }

  /** Selecciona estado y recarga */
  public selectEstado(estado: string): void {
    this.selectedEstado = estado;
    this.favoritesMode = false;
    this.currentPage = 0;
    this.fetchWords();
  }

  /** Activa modo favoritos para categoría actual */
  public showFavorites(): void {
    this.favoritesMode = true;
    this.selectedEstado = undefined;
    this.currentPage = 0;
    this.fetchWords();
  }

  /** Página siguiente (size=1) */
  public nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.fetchWords();
    }
  }

  /** Página anterior */
  public prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.fetchWords();
    }
  }

  /** Orquesta llamado correcto al servicio según filtros activos */
  private fetchWords(): void {
    const categoryId = this.activeCategory?.id;
    if (!categoryId) {
      this.words = [];
      return;
    }
    if (this.favoritesMode) {
      this.data.fetchFavoriteWords(categoryId, undefined, this.currentPage, this.pageSize).subscribe(res => {
        this.words = res.items;
        this.totalPages = res.totalPages;
      });
      return;
    }
    if (this.selectedEstado) {
      this.data.fetchWordsByCategoryAndEstado(categoryId, this.selectedEstado, undefined, this.currentPage, this.pageSize).subscribe(res => {
        this.words = res.items;
        this.totalPages = res.totalPages;
      });
      return;
    }
    this.data.fetchWordsByCategory(categoryId, this.currentPage, this.pageSize).subscribe(res => {
      this.words = res.items;
      this.totalPages = res.totalPages;
    });
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
      // Actualización optimista de edición
      this.savingWord = true;
      const snapshot = [...this.words];
      this.words = this.words.map(w => w.id === form.id ? { ...w, title: form.title, meaning: form.meaning, favorite, imageUrl, category: categoryId } : w);
      this.data.updateWordRemote({
        id: form.id,
        title: form.title,
        meaning: form.meaning,
        category: categoryId!,
        favorite,
        imageFile: form.imageFile || null
      }).subscribe({
        next: updated => {
          // Reconciliar con respuesta (puede cambiar imagen real)
          this.words = this.words.map(w => w.id === updated.id ? { ...updated } : w);
          // Si cambió de categoría y estamos filtrando por categoría, recargar
          const changedCategory = this.activeCategory && updated.category !== this.activeCategory.id;
          if (changedCategory && this.searchMode === 'all') {
            this.fetchWords();
          }
        },
        error: () => {
          this.words = snapshot; // revertir
        },
        complete: () => { this.savingWord = false; this.showAddModal = false; }
      });
    } else {
      // Creación optimista
      this.savingWord = true;
      const provisional = this.data.insertProvisionalWord({
        title: form.title,
        meaning: form.meaning,
        category: categoryId!,
        favorite,
        imageUrl
      });
      // Actualizar vista local inmediatamente
      this.words = [provisional, ...this.words];
      this.data.createWordRemote({
        title: form.title,
        meaning: form.meaning,
        category: categoryId!,
        favorite,
        imageFile: form.imageFile || null
      }).subscribe({
        next: created => {
          this.data.replaceWord(provisional.id!, created);
          // Actualizar vista con la palabra real del backend
          this.words = this.words.map(w => w.id === provisional.id ? created : w);
        },
        error: () => {
          // Revertir creación optimista
          this.words = this.words.filter(w => w.id !== provisional.id);
        },
        complete: () => { this.savingWord = false; this.showAddModal = false; }
      });
    }
  }

  public requestDeleteWord(word: WordItem): void {
    this.pendingDelete = word;
  }

  public confirmDeleteWord(): void {
    if (!this.pendingDelete?.id || this.deletingWord) return;
    this.deletingWord = true;
    const deletingId = this.pendingDelete.id;
    // Snapshot para posible revert en caso de error
    const snapshot = [...this.words];
    // Borrado optimista en la vista sin tocar otras tarjetas
    this.words = this.words.filter(w => w.id !== deletingId);
    // Ajuste de página si era la única y no estamos en la primera
    const wasLastOnPage = snapshot.length === 1 && this.currentPage > 0;
    if (wasLastOnPage) {
      this.currentPage = Math.max(0, this.currentPage - 1);
    }
    // Limpiar diálogo inmediato para sensación de rapidez
    this.pendingDelete = undefined;
    this.data.deleteWordRemote(deletingId).subscribe({
      next: () => {
        // Si tras el borrado la página queda vacía pero existen más páginas, cargar siguiente
        if (this.words.length === 0 && this.totalPages > 1) {
          if (this.currentPage > 0) {
            this.currentPage--;
          }
          this.fetchWords();
        }
      },
      error: () => {
        // Revertimos estado local
        this.words = snapshot;
        this.deletingWord = false;
      },
      complete: () => {
        this.deletingWord = false;
      }
    });
  }

  public cancelDeleteWord(): void {
    if (this.deletingWord) return; // evita cancelar mientras se elimina
    this.pendingDelete = undefined;
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
    if (!word.id) return;
    const snapshot = [...this.words];
    const newFav = !word.favorite;
    // Optimista: actualizar inmediatamente (también afecta filtrado de favoritos)
    this.words = this.words.map(w => w.id === word.id ? { ...w, favorite: newFav } : w);
    this.data.updateWordRemote({
      id: word.id,
      title: word.title,
      meaning: word.meaning || '',
      category: word.category!,
      favorite: newFav,
      imageFile: null
    }).subscribe({
      next: updated => {
        this.words = this.words.map(w => w.id === updated.id ? { ...updated } : w);
        // Si estamos en modo favoritos y quitamos el favorito, recargar para quitar de vista
        if (this.searchMode === 'favorites' && !newFav) {
          const categoryId = this.activeCategory?.id;
          if (categoryId) {
            this.data.fetchFavoriteWords(categoryId, undefined, this.currentPage, this.pageSize).subscribe(res => {
              this.words = res.items;
              this.totalPages = res.totalPages;
            });
          }
        }
      },
      error: () => {
        this.words = snapshot; // revertir
      }
    });
    // También actualizar estado REP/OLV acorde al like/unlike
    const estado = newFav ? 'REP' : 'OLV';
    this.changeWordEstado(word, estado);
  }

  /** Cambio de estado (REP / OLV) optimista */
  public changeWordEstado(word: WordItem, estado: string): void {
    if (!word.id) return;
    const snapshot = [...this.words];
    this.data.updateWordEstado(word.id, estado).subscribe({
      next: updated => {
        this.words = this.words.map(w => w.id === updated.id ? { ...updated } : w);
        // Si estamos en modo "olvidadas" y cambiamos a REP, recargar para quitar de vista
        if (this.searchMode === 'forgotten' && estado === 'REP') {
          this.data.fetchWordsByEstado('OLV', this.currentPage, this.pageSize).subscribe(res => {
            this.words = res.items;
            this.totalPages = res.totalPages;
          });
        }
      },
      error: () => {
        this.words = snapshot;
      }
    });
  }

  public cancelLogout(): void {
    // Volver a la vista previa y reactivar su item
    this.currentView = this.previousView;
    this.navigation = this.navigation.map(i => ({ ...i, active: (i.label === 'Ver categorías' && this.currentView==='categories') || (i.label==='Buscar palabra' && this.currentView==='search') || (i.label!=='Ver categorías' && i.label!=='Buscar palabra' && this.currentView==='sections') }));
  }

  public confirmLogout(): void {
    // Placeholder de lógica real de logout (limpieza de sesión si aplica)
    // Navegar a pantalla de login
    this.auth.clearUser();
    this.router.navigate(['/login']);
  }

  public cancelDeleteAccount(): void {
    this.currentView = this.previousView;
    this.navigation = this.navigation.map(i => ({ ...i, active: (i.label === 'Ver categorías' && this.currentView==='categories') || (i.label==='Buscar palabra' && this.currentView==='search') || (i.label!=='Ver categorías' && i.label!=='Buscar palabra' && this.currentView==='sections') }));
  }

  public confirmDeleteAccount(): void {
    // Placeholder de lógica real de eliminación
    this.auth.clearUser();
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
    
    // Si estamos en modo favoritos (sistema de secciones), recargar favoritos de la nueva categoría
    if (this.searchMode === 'favorites' && categoryId) {
      this.data.fetchFavoriteWords(categoryId, undefined, this.currentPage, this.pageSize).subscribe(res => {
        this.words = res.items;
        this.totalPages = res.totalPages;
      });
    }
  }

  private activateSearchView(mode: 'all' | 'favorites' | 'review' | 'forgotten', options: { preserveCategory?: boolean } = {}): void {
    this.searchMode = mode;
    this.currentView = 'search';
    this.previousView = 'search';
    const categoryId = options.preserveCategory ? this.activeCategory?.id : undefined;
    this.setActiveCategory(categoryId);
    this.navigation = this.navigation.map(i => ({ ...i, active: i.label === 'Buscar palabra' }));
    
    if (mode === 'favorites') {
      // Cargar favoritos desde backend para sincronizar cambios
      if (categoryId) {
        this.data.fetchFavoriteWords(categoryId, undefined, this.currentPage, this.pageSize).subscribe(res => {
          this.words = res.items;
          this.totalPages = res.totalPages;
        });
      }
    }
    
    if (mode === 'review') {
      this.reviewWords = this.data.getReviewWords();
    }
    
    if (mode === 'forgotten') {
      // Cargar palabras con estado OLV desde backend
      this.data.fetchWordsByEstado('OLV', this.currentPage, this.pageSize).subscribe(res => {
        this.words = res.items;
        this.totalPages = res.totalPages;
      });
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
      // Actualizar estado en backend a REP (Por repasar/Aprendida)
      this.changeWordEstado(this.practiceCurrentWord, 'REP');
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
      // Actualizar estado en backend a OLV (Olvidada)
      this.changeWordEstado(this.practiceCurrentWord, 'OLV');
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
