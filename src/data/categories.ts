import { BookOpen, Code2, FileText, Image, Link2, Repeat, ShieldCheck, Zap } from 'lucide-react';
import type { Category } from '@/types';

export const categories: Category[] = [
  {
    id: 'quick-tools',
    name: { uk: 'Швидкі інструменти', en: 'Quick tools' },
    description: { uk: 'Порахувати, відміряти час, кинути жереб.', en: 'Do the math, track time, settle a choice.' },
    icon: Zap,
    tint: '#7A8CFF',
  },
  {
    id: 'documents',
    name: { uk: 'Документи', en: 'Documents' },
    description: { uk: 'Текст, підрахунки, розмітка та PDF.', en: 'Text, counts, markup and PDFs.' },
    icon: FileText,
    tint: '#6FD0E2',
  },
  {
    id: 'images',
    name: { uk: 'Зображення', en: 'Images' },
    description: { uk: 'Стиснути, змінити розмір, конвертувати.', en: 'Compress, resize, convert.' },
    icon: Image,
    tint: '#F2A365',
  },
  {
    id: 'converters',
    name: { uk: 'Конвертери', en: 'Converters' },
    description: { uk: 'Одиниці вимірювання й валюти.', en: 'Units of measure and currencies.' },
    icon: Repeat,
    tint: '#8FD694',
  },
  {
    id: 'security',
    name: { uk: 'Безпека', en: 'Security' },
    description: { uk: 'Паролі, хеші та випадкові значення.', en: 'Passwords, hashes and random values.' },
    icon: ShieldCheck,
    tint: '#E28FB8',
  },
  {
    id: 'web',
    name: { uk: 'Веб', en: 'Web' },
    description: { uk: 'QR-коди, посилання й мета-теги.', en: 'QR codes, links and meta tags.' },
    icon: Link2,
    tint: '#9B8CF0',
  },
  {
    id: 'study',
    name: { uk: 'Навчання', en: 'Study' },
    description: { uk: 'Фокус, картки, оцінки й нотатки.', en: 'Focus, flashcards, grades and notes.' },
    icon: BookOpen,
    tint: '#F0C97A',
  },
  {
    id: 'developer',
    name: { uk: 'Розробка', en: 'Developer' },
    description: { uk: 'JSON, Base64, regex і кольори.', en: 'JSON, Base64, regex and colors.' },
    icon: Code2,
    tint: '#7ADCC0',
  },
];

export const categoryMap = new Map(categories.map((category) => [category.id, category]));
