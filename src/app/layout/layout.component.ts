import { Component } from '@angular/core';

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

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  public user = {
    name: 'Juan Sebastian',
    avatar: 'assets/img/avatar-juan.svg'
  };

  public navigation: NavigationItem[] = [
    { label: 'Perfil', icon: 'person', active: true },
    { label: 'Ver categorías', icon: 'folder_open' },
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

  public onSectionSelect(section: SectionItem): void {
    this.sections = this.sections.map(item => ({
      ...item,
      active: item.label === section.label
    }));
  }
}
