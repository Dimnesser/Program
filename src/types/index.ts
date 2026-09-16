import type { LucideIcon } from 'lucide-react';
import type { ComponentType, LazyExoticComponent } from 'react';

export type Language = 'uk' | 'en';

export type ThemeMode = 'dark' | 'light' | 'system';

export type Localized = Record<Language, string>;

export type CategoryId =
  | 'quick-tools'
  | 'documents'
  | 'images'
  | 'converters'
  | 'security'
  | 'web'
  | 'study'
  | 'developer';

export interface Category {
  id: CategoryId;
  name: Localized;
  description: Localized;
  icon: LucideIcon;
  /** Tailwind-safe accent hint used for category chips and tool glyphs. */
  tint: string;
}

/**
 * Props every tool module receives. `preset` lets several registry entries
 * share one implementation (e.g. every unit converter), and `initial` carries
 * values parsed out of a smart-search query ("convert 10 km to miles").
 */
export interface ToolProps {
  preset?: string;
  initial?: Record<string, string>;
}

export interface Tool {
  id: string;
  name: Localized;
  description: Localized;
  category: CategoryId;
  icon: LucideIcon;
  /** Search terms in both languages, including common misspellings. */
  keywords: string[];
  route: string;
  component: LazyExoticComponent<ComponentType<ToolProps>>;
  preset?: string;
  isPopular?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  /** Tools that never touch the network, surfaced with a privacy badge. */
  offline?: boolean;
}

export interface RecentEntry {
  toolId: string;
  at: number;
  /** Number of times the tool has been opened, used for recommendations. */
  count: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  favorite: boolean;
  color?: string;
}

export interface PomodoroStats {
  date: string;
  sessions: number;
  focusSeconds: number;
}

export interface CalculatorEntry {
  id: string;
  expression: string;
  result: string;
  at: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  known: boolean;
}

export interface ShortLink {
  id: string;
  code: string;
  url: string;
  createdAt: number;
  hits: number;
}

export interface UsageStats {
  /** ISO week key -> number of tool opens. */
  weekly: Record<string, number>;
  /** Total tool opens, all time. */
  total: number;
}

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  description?: string;
  variant: ToastVariant;
}

export interface IntentMatch {
  toolId: string;
  confidence: number;
  /** Prefilled tool state derived from the query. */
  initial?: Record<string, string>;
  /** Human-readable answer NOVA can show before opening the tool. */
  answer?: string;
  reason: Localized;
}
