import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { WordItem } from '../components/word-card/word-card.component';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Category {
  id: string;
  name: string;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class WordDataService {
  // Se inicializa vacío; se poblará desde backend.
  private categories: Category[] = [];
  // Lista de palabras en memoria (últimos resultados obtenidos)
  private words: WordItem[] = [];
  private nextId = 1; // Solo para palabras locales creadas manualmente (si se usan)
  private reviewWordIds = new Set<number>();

  constructor(private http: HttpClient, private auth: AuthService) {}

  getCategories(): Category[] {
    return this.categories.map(cat => ({ ...cat }));
  }

  /**
   * Carga categorías desde backend (endpoint retorna Page<CategoriaDTO>). Se requiere header idUsuario.
   * No usa fallback local: si no hay categorías, devuelve array vacío.
   */
  fetchCategories(page: number = 0, size: number = 50): Observable<Category[]> {
    const idUsuario = this.auth.getUserId();
    if (!idUsuario) {
      // Sin usuario autenticado no se hace request; devuelve lista actual (vacía).
      return new Observable<Category[]>(subscriber => {
        subscriber.next(this.getCategories());
        subscriber.complete();
      });
    }
    const headers = new HttpHeaders({ idUsuario: String(idUsuario) });
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<any>(`${environment.apiBaseUrl}/api/categoria`, { headers, params }).pipe(
      map(pageResp => (pageResp.content || []).map((c: any) => ({ id: String(c.id), name: c.nombre, icon: 'assets/icons/flashcards.svg' } as Category))),
      map(mapped => { this.categories = mapped; return this.getCategories(); })
    );
  }

  getWords(): WordItem[] {
    return this.words.map(word => ({ ...word }));
  }

  // Resultado de página genérico para el front
  // Se elimina estructura de página para volver a lista simple

  /**
   * Carga tarjetas por categoría.
   * Backend fuerza PageRequest size=1, por lo que devolverá de a una tarjeta por página.
   * page controla el número de página solicitada.
   */
  fetchWordsByCategory(categoryId: string, page: number = 0, size: number = 10): Observable<{ items: WordItem[]; page: number; size: number; totalPages: number; totalElements: number }> {
    const params = new HttpParams().set('page', page).set('size', size);
    const url = `${environment.apiBaseUrl}/api/tarjeta/categoria/${categoryId}`;
    return this.http.get<any>(url, { params }).pipe(
      map(p => ({
        items: (p.content || []).map((t: any) => this.mapTarjetaToWordItem(t)),
        page: p.number ?? page,
        size: p.size ?? size,
        totalPages: p.totalPages ?? 1,
        totalElements: p.totalElements ?? (p.content?.length ?? 0)
      })),
      map(res => { this.words = res.items; return res; })
    );
  }

  /** Tarjetas por categoría y estado opcionalmente filtradas por query */
  fetchWordsByCategoryAndEstado(categoryId: string, estado: string, query?: string, page: number = 0, size: number = 10): Observable<{ items: WordItem[]; page: number; size: number; totalPages: number; totalElements: number }> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (query) params = params.set('query', query);
    const url = `${environment.apiBaseUrl}/api/tarjeta/${categoryId}/${estado}`;
    return this.http.get<any>(url, { params }).pipe(
      map(p => ({
        items: (p.content || []).map((t: any) => this.mapTarjetaToWordItem(t)),
        page: p.number ?? page,
        size: p.size ?? size,
        totalPages: p.totalPages ?? 1,
        totalElements: p.totalElements ?? (p.content?.length ?? 0)
      })),
      map(res => { this.words = res.items; return res; })
    );
  }

  /** Tarjetas favoritas por categoría (con query opcional) */
  fetchFavoriteWords(categoryId: string, query?: string, page: number = 0, size: number = 10): Observable<{ items: WordItem[]; page: number; size: number; totalPages: number; totalElements: number }> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (query) params = params.set('query', query);
    const url = `${environment.apiBaseUrl}/api/tarjeta/favorites/${categoryId}`;
    return this.http.get<any>(url, { params }).pipe(
      map(p => ({
        items: (p.content || []).map((t: any) => this.mapTarjetaToWordItem(t, true)),
        page: p.number ?? page,
        size: p.size ?? size,
        totalPages: p.totalPages ?? 1,
        totalElements: p.totalElements ?? (p.content?.length ?? 0)
      })),
      map(res => { this.words = res.items; return res; })
    );
  }

  /** Obtiene una tarjeta por ID */
  fetchWordById(idTarjeta: number): Observable<WordItem | undefined> {
    const url = `${environment.apiBaseUrl}/api/tarjeta/${idTarjeta}`;
    return this.http.get<any>(url).pipe(
      map(t => this.mapTarjetaToWordItem(t))
    );
  }

  /** Mapea TarjetaDTO backend a WordItem frontend */
  private mapTarjetaToWordItem(t: any, overrideFavorite?: boolean): WordItem {
    return {
      id: t.id,
      title: t.palabra,
      meaning: t.traduccion,
      imageUrl: t.imagen,
      favorite: overrideFavorite ?? !!t.esFavorita,
      category: String(t.idCategoria)
    } as WordItem;
  }

  /** Crea tarjeta en backend (multipart). Devuelve WordItem mapeado */
  createWordRemote(payload: { title: string; meaning: string; category: string; favorite?: boolean; imageFile?: File | null }): Observable<WordItem> {
    const form = new FormData();
    const tarjetaDTO = {
      idCategoria: Number(payload.category),
      palabra: payload.title,
      traduccion: payload.meaning,
      esFavorita: !!payload.favorite
    };
    form.append('tarjeta', new Blob([JSON.stringify(tarjetaDTO)], { type: 'application/json' }));
    if (payload.imageFile) form.append('imagen', payload.imageFile);
    return this.http.post<any>(`${environment.apiBaseUrl}/api/tarjeta/create`, form).pipe(
      map(t => this.mapTarjetaToWordItem(t))
    );
  }

  /** Actualiza tarjeta completa (multipart). */
  updateWordRemote(word: { id: number; title: string; meaning: string; category: string; favorite?: boolean; imageFile?: File | null }): Observable<WordItem> {
    const form = new FormData();
    const tarjetaDTO = {
      id: word.id,
      idCategoria: Number(word.category),
      palabra: word.title,
      traduccion: word.meaning,
      esFavorita: !!word.favorite
    };
    form.append('tarjeta', new Blob([JSON.stringify(tarjetaDTO)], { type: 'application/json' }));
    if (word.imageFile) form.append('imagen', word.imageFile);
    return this.http.put<any>(`${environment.apiBaseUrl}/api/tarjeta`, form).pipe(
      map(t => {
        const mapped = this.mapTarjetaToWordItem(t);
        // Actualización local en cache si existe
        this.updateWord(mapped);
        return mapped;
      })
    );
  }

  /**
   * Elimina tarjeta por ID en backend y actualiza cache local de palabras de forma inmediata.
   * Backend retorna TarjetaDTO eliminada; aquí sólo usamos su id.
   * Devuelve el id eliminado para permitir manejo optimista en componentes.
   */
  deleteWordRemote(id: number): Observable<number> {
    return this.http.delete<any>(`${environment.apiBaseUrl}/api/tarjeta/${id}`).pipe(
      map(resp => {
        // Actualiza almacenamiento local si presente
        this.deleteWord(id);
        return resp?.id ?? id;
      })
    );
  }

  /** Actualiza estado (sigla) de tarjeta */
  updateWordEstado(id: number, siglaEstado: string): Observable<WordItem> {
    return this.http.put<any>(`${environment.apiBaseUrl}/api/tarjeta/status/${id}/${siglaEstado}`, null).pipe(
      map(t => {
        const mapped = this.mapTarjetaToWordItem(t);
        this.updateWord(mapped);
        return mapped;
      })
    );
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

  /** Inserta provisional (optimista) al inicio. Devuelve el provisional para luego reconciliar. */
  insertProvisionalWord(payload: { title: string; meaning: string; category: string; favorite?: boolean; imageUrl?: string }): WordItem {
    const provisional: WordItem = {
      id: Date.now(),
      title: payload.title,
      meaning: payload.meaning,
      category: payload.category,
      favorite: !!payload.favorite,
      imageUrl: payload.imageUrl
    };
    this.words = [provisional, ...this.words];
    return { ...provisional };
  }

  /** Reemplaza una palabra (por id) con otra (id real) tras respuesta backend. */
  replaceWord(oldId: number, newWord: WordItem): void {
    this.words = this.words.map(w => w.id === oldId ? { ...newWord } : w);
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