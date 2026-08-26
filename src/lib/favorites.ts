const STORAGE_KEY = 'ck-favorites';
const RECENT_KEY = 'ck-recent';
const MAX_RECENT = 10;

export type FavoriteItem = {
  href: string;
  label: string;
  screenId?: string;
  type: 'customer' | 'vehicle' | 'job' | 'lead' | 'invoice' | 'screen';
};

export function getFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addFavorite(item: FavoriteItem): FavoriteItem[] {
  const favs = getFavorites().filter(f => f.href !== item.href);
  favs.unshift(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  window.dispatchEvent(new CustomEvent('favorites-changed'));
  return favs;
}

export function removeFavorite(href: string): FavoriteItem[] {
  const favs = getFavorites().filter(f => f.href !== href);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  window.dispatchEvent(new CustomEvent('favorites-changed'));
  return favs;
}

export function isFavorite(href: string): boolean {
  return getFavorites().some(f => f.href === href);
}

export function getRecentItems(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addRecentItem(item: FavoriteItem): void {
  const recent = getRecentItems().filter(r => r.href !== item.href);
  recent.unshift(item);
  if (recent.length > MAX_RECENT) recent.length = MAX_RECENT;
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}
