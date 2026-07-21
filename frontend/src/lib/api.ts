/**
 * Utilitaires API centralisés.
 * Appels directs au backend Django — NEXT_PUBLIC_API_URL bypass le proxy Next.js
 * (le proxy Turbopack/Next.js 16 est instable pour les rewrites).
 */

// "http://localhost:8000/api" → "http://localhost:8000"
const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

let csrfToken = '';

// Le cookie CSRF (nom : eec_csrftoken) peut être régénéré côté serveur pendant
// qu'un onglet reste ouvert. On lit donc TOUJOURS sa valeur courante dans le
// cookie en priorité — un token mis en cache indéfiniment finit par devenir
// invalide et fait échouer toutes les mutations (401/403 CSRF) sans jamais se
// corriger tant que la page n'est pas rechargée.
export async function getCsrf(): Promise<string> {
  if (typeof document !== 'undefined') {
    const m = document.cookie.match(/(?:^|;\s*)eec_csrftoken=([^;]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  if (csrfToken) return csrfToken;
  const res = await fetch(`${BACKEND}/api/auth/csrf/`, { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.csrfToken ?? '';
  return csrfToken;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // path = '/api/geo/paroisses/' → 'http://localhost:8000/api/geo/paroisses/'
  const url = path.startsWith('http') ? path : `${BACKEND}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function mutate<T>(method: string, path: string, body?: unknown): Promise<T> {
  const csrf = await getCsrf();
  const send = (token: string) => request<T>(path, {
    method,
    headers: { 'X-CSRFToken': token },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  try {
    return await send(csrf);
  } catch (e) {
    // Filet de sécurité : si le token utilisé était le fallback mis en cache
    // (cookie illisible) et qu'il est rejeté, on force un nouveau jeton et on
    // retente une seule fois avant de remonter l'erreur à l'appelant.
    if (e instanceof Error && e.message.includes('CSRF') && csrfToken === csrf) {
      csrfToken = '';
      const fresh = await getCsrf();
      return send(fresh);
    }
    throw e;
  }
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => mutate<T>('POST',   path, body),
  patch:  <T>(path: string, body: unknown) => mutate<T>('PATCH',  path, body),
  put:    <T>(path: string, body: unknown) => mutate<T>('PUT',    path, body),
  delete: <T>(path: string)               => mutate<T>('DELETE', path),
};

// Déconnexion centralisée — auparavant dupliquée dans chaque barre latérale
// (Sidebar, SidebarRegional, SidebarDistrict, SidebarParoisse, Topbar), avec
// une divergence : trois d'entre elles utilisaient une URL relative sans
// jeton CSRF, ce qui faisait échouer silencieusement l'appel côté serveur
// (session jamais détruite) tout en redirigeant quand même vers /login.
export async function logout(): Promise<void> {
  try {
    const csrf = await getCsrf();
    await fetch(`${BACKEND}/api/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRFToken': csrf, 'Content-Type': 'application/json' },
    });
  } finally {
    window.location.href = '/login';
  }
}

/* ─── Types communs ─────────────────────────────────────────────────── */

export interface DashboardStats {
  nb_paroisses: number;
  nb_paroisses_sans_gps: number;
  nb_oeuvres: number;
  nb_ouvriers: number;
  nb_regions: number;
  nb_districts: number;
  total_communiants: number;
  total_non_communiants: number;
  total_fideles: number;
  annee: number;
  scope: string;
  role: string;
}

export interface PagedResult<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface RegionSynodale {
  id: number;
  nom: string;
  code: string | null;
  nb_districts: number;
  nb_paroisses: number;
  nb_fideles?: number;
  nb_ouvriers?: number;
}

export interface District {
  id: number;
  nom: string;
  region_id: number;
  region_nom: string;
  nb_paroisses: number;
  nb_fideles?: number | null;
  nb_ouvriers?: number | null;
}

export interface Paroisse {
  id: number;
  nom: string;
  adresse: string;
  categorie: 'A++' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'C3' | 'C4' | null;
  en_prospection: boolean;
  district_id: number;
  district_nom: string;
  region_id: number;
  region_nom: string;
  latitude: number | null;
  longitude: number | null;
  nombre_fideles: number | null;
  communiants: number | null;
  non_communiants: number | null;
  nb_ouvriers: number;
  telephone: string;
  email: string;
  updated_at: string;
}

export interface Grade {
  id: number;
  nom: string;
  abreviation: string;
  niveau: number;
  nb_ouvriers: number;
}

export interface Ouvrier {
  id: number;
  nom: string;
  prenom: string;
  sexe: 'M' | 'F';
  statut: 'OCCUPE' | 'INOCCUPE';
  grade_id: number | null;
  grade_nom: string | null;
  grade_abreviation: string | null;
  paroisse_id: number | null;
  paroisse_nom: string | null;
  district_id: number | null;
  district_nom: string | null;
  region_id: number | null;
  region_nom: string | null;
  telephone: string;
  // EXIGENCE : un ouvrier n'est jamais géolocalisable — aucune coordonnée.
  created_at: string;
  updated_at: string;
}

export interface TypeOeuvre {
  id: number;
  nom: string;
  icone: string;
  couleur: string;
  nb_oeuvres: number;
}

export interface Oeuvre {
  id: number;
  nom: string;
  adresse: string;
  description: string;
  type_oeuvre_id: number;
  type_oeuvre_nom: string;
  type_oeuvre_label: string;
  type_oeuvre_couleur: string;
  type_oeuvre_icone: string;
  paroisse_id: number | null;
  paroisse_nom: string | null;
  district_id: number | null;
  district_nom: string | null;
  region_id: number | null;
  region_nom: string | null;
  rattachement: 'national' | 'region' | 'district' | 'paroisse';
  est_active: boolean;
  capacite: number | null;
  nb_personnels: number | null;
  en_prospection: boolean;
  annee_creation: number | null;
  telephone: string;
  email: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserAccount {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telephone: string;
  role: 'SUPER' | 'REGION' | 'DISTRICT' | 'PAROISSE' | 'VISITEUR';
  role_display: string;
  is_active: boolean;
  force_password_change: boolean;
  region: number | null;
  region_nom: string | null;
  district: number | null;
  district_nom: string | null;
  paroisse: number | null;
  paroisse_nom: string | null;
  scope_label: string;
  date_joined: string;
  last_login: string | null;
  avatar_url: string | null;
  theme: 'clair' | 'sombre';
}

export interface LogEntry {
  id: number;
  utilisateur: number | null;
  utilisateur_nom: string;
  action: string;
  action_display: string;
  type_objet: string;
  objet_id: number | null;
  objet_nom: string;
  description: string;
  ip_address: string;
  created_at: string;
}

export interface StatistiqueAnnuelle {
  id: number;
  paroisse: number;
  paroisse_nom: string;
  district_nom: string;
  region_nom: string;
  annee: number;
  communiants: number;
  non_communiants: number;
  total_fideles: number;
  validee: boolean;
}
