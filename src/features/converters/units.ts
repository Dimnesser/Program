import type { Localized } from '@/types';

export type UnitCategoryId =
  | 'length'
  | 'weight'
  | 'temperature'
  | 'time'
  | 'speed'
  | 'data'
  | 'area'
  | 'volume';

export interface Unit {
  id: string;
  symbol: string;
  name: Localized;
  /** Multiplier to the category's base unit. Unused for temperature. */
  factor: number;
  /** Alternative spellings used by the smart-search parser. */
  aliases: string[];
}

export interface UnitCategory {
  id: UnitCategoryId;
  name: Localized;
  base: string;
  units: Unit[];
  defaults: [string, string];
}

const u = (
  id: string,
  symbol: string,
  uk: string,
  en: string,
  factor: number,
  aliases: string[] = [],
): Unit => ({ id, symbol, name: { uk, en }, factor, aliases: [id, symbol, uk, en, ...aliases] });

export const unitCategories: UnitCategory[] = [
  {
    id: 'length',
    name: { uk: 'Довжина', en: 'Length' },
    base: 'm',
    defaults: ['km', 'mi'],
    units: [
      u('mm', 'мм', 'міліметр', 'millimetre', 0.001, ['mm', 'millimeter', 'millimeters', 'міліметри', 'мм']),
      u('cm', 'см', 'сантиметр', 'centimetre', 0.01, ['cm', 'centimeter', 'centimeters', 'сантиметри', 'см']),
      u('m', 'м', 'метр', 'metre', 1, ['m', 'meter', 'meters', 'metres', 'метри', 'метрів', 'м']),
      u('km', 'км', 'кілометр', 'kilometre', 1000, ['km', 'kilometer', 'kilometers', 'kilometres', 'кілометри', 'кілометрів', 'км']),
      u('in', 'in', 'дюйм', 'inch', 0.0254, ['inch', 'inches', 'дюйми', 'дюймів', '"']),
      u('ft', 'ft', 'фут', 'foot', 0.3048, ['feet', 'foot', 'фути', 'футів']),
      u('yd', 'yd', 'ярд', 'yard', 0.9144, ['yards', 'ярди', 'ярдів']),
      u('mi', 'mi', 'миля', 'mile', 1609.344, ['mile', 'miles', 'милі', 'миль', 'милю']),
      u('nmi', 'nmi', 'морська миля', 'nautical mile', 1852, ['nautical', 'морська миля']),
    ],
  },
  {
    id: 'weight',
    name: { uk: 'Вага', en: 'Weight' },
    base: 'kg',
    defaults: ['kg', 'lb'],
    units: [
      u('mg', 'мг', 'міліграм', 'milligram', 0.000001, ['mg', 'milligrams', 'міліграми', 'мг']),
      u('g', 'г', 'грам', 'gram', 0.001, ['g', 'grams', 'грами', 'грамів', 'г']),
      u('kg', 'кг', 'кілограм', 'kilogram', 1, ['kg', 'kilograms', 'кілограми', 'кілограмів', 'кг']),
      u('t', 'т', 'тонна', 'tonne', 1000, ['ton', 'tons', 'tonnes', 'тонни', 'тонн', 'т']),
      u('oz', 'oz', 'унція', 'ounce', 0.0283495, ['ounces', 'унції', 'унцій']),
      u('lb', 'lb', 'фунт', 'pound', 0.453592, ['lbs', 'pounds', 'фунти', 'фунтів']),
      u('st', 'st', 'стоун', 'stone', 6.35029, ['stones', 'стоуни']),
    ],
  },
  {
    id: 'temperature',
    name: { uk: 'Температура', en: 'Temperature' },
    base: 'c',
    defaults: ['c', 'f'],
    units: [
      u('c', '°C', 'Цельсій', 'Celsius', 1, ['celsius', 'цельсій', 'цельсія', 'c', '°c', 'градуси']),
      u('f', '°F', 'Фаренгейт', 'Fahrenheit', 1, ['fahrenheit', 'фаренгейт', 'фаренгейта', 'f', '°f']),
      u('k', 'K', 'Кельвін', 'Kelvin', 1, ['kelvin', 'кельвін', 'кельвіна', 'k']),
    ],
  },
  {
    id: 'time',
    name: { uk: 'Час', en: 'Time' },
    base: 's',
    defaults: ['min', 'h'],
    units: [
      u('ms', 'мс', 'мілісекунда', 'millisecond', 0.001, ['ms', 'milliseconds', 'мілісекунди', 'мс']),
      u('s', 'с', 'секунда', 'second', 1, ['sec', 'seconds', 'секунди', 'секунд', 'с']),
      u('min', 'хв', 'хвилина', 'minute', 60, ['min', 'minutes', 'хвилини', 'хвилин', 'хв']),
      u('h', 'год', 'година', 'hour', 3600, ['hr', 'hours', 'години', 'годин', 'год']),
      u('d', 'д', 'день', 'day', 86400, ['days', 'дні', 'днів', 'доба']),
      u('wk', 'тиж', 'тиждень', 'week', 604800, ['weeks', 'тижні', 'тижнів']),
      u('mo', 'міс', 'місяць', 'month', 2629800, ['months', 'місяці', 'місяців']),
      u('yr', 'рік', 'рік', 'year', 31557600, ['years', 'роки', 'років']),
    ],
  },
  {
    id: 'speed',
    name: { uk: 'Швидкість', en: 'Speed' },
    base: 'mps',
    defaults: ['kmh', 'mph'],
    units: [
      u('mps', 'м/с', 'метр за секунду', 'metre per second', 1, ['m/s', 'mps', 'мс', 'м/с']),
      u('kmh', 'км/год', 'кілометр за годину', 'kilometre per hour', 0.277778, ['km/h', 'kmh', 'kph', 'км/год']),
      u('mph', 'mph', 'миля за годину', 'mile per hour', 0.44704, ['mi/h', 'mph', 'миль/год']),
      u('kn', 'kn', 'вузол', 'knot', 0.514444, ['knots', 'вузли']),
      u('fts', 'ft/s', 'фут за секунду', 'foot per second', 0.3048, ['ft/s', 'fps']),
    ],
  },
  {
    id: 'data',
    name: { uk: 'Дані', en: 'Data' },
    base: 'b',
    defaults: ['mb', 'gb'],
    units: [
      u('bit', 'біт', 'біт', 'bit', 0.125, ['bits', 'біти', 'біт']),
      u('b', 'Б', 'байт', 'byte', 1, ['bytes', 'байти', 'байтів', 'б']),
      u('kb', 'КБ', 'кілобайт', 'kilobyte', 1000, ['kb', 'kilobytes', 'кілобайти', 'кб']),
      u('mb', 'МБ', 'мегабайт', 'megabyte', 1000000, ['mb', 'megabytes', 'мегабайти', 'мб']),
      u('gb', 'ГБ', 'гігабайт', 'gigabyte', 1000000000, ['gb', 'gigabytes', 'гігабайти', 'гб']),
      u('tb', 'ТБ', 'терабайт', 'terabyte', 1000000000000, ['tb', 'terabytes', 'терабайти', 'тб']),
      u('kib', 'КіБ', 'кібібайт', 'kibibyte', 1024, ['kib', 'кібібайт']),
      u('mib', 'МіБ', 'мебібайт', 'mebibyte', 1048576, ['mib', 'мебібайт']),
      u('gib', 'ГіБ', 'гібібайт', 'gibibyte', 1073741824, ['gib', 'гібібайт']),
    ],
  },
  {
    id: 'area',
    name: { uk: 'Площа', en: 'Area' },
    base: 'm2',
    defaults: ['m2', 'ft2'],
    units: [
      u('cm2', 'см²', 'квадратний сантиметр', 'square centimetre', 0.0001, ['cm2', 'см2']),
      u('m2', 'м²', 'квадратний метр', 'square metre', 1, ['m2', 'sqm', 'кв.м', 'м2']),
      u('km2', 'км²', 'квадратний кілометр', 'square kilometre', 1000000, ['km2', 'км2']),
      u('ha', 'га', 'гектар', 'hectare', 10000, ['hectares', 'гектари', 'га']),
      u('ar', 'сотка', 'сотка', 'are', 100, ['ares', 'сотки', 'соток']),
      u('ft2', 'ft²', 'квадратний фут', 'square foot', 0.092903, ['sqft', 'ft2']),
      u('ac', 'ac', 'акр', 'acre', 4046.86, ['acres', 'акри', 'акрів']),
    ],
  },
  {
    id: 'volume',
    name: { uk: 'Об’єм', en: 'Volume' },
    base: 'l',
    defaults: ['l', 'gal'],
    units: [
      u('ml', 'мл', 'мілілітр', 'millilitre', 0.001, ['ml', 'milliliters', 'мілілітри', 'мл']),
      u('l', 'л', 'літр', 'litre', 1, ['l', 'liter', 'liters', 'litres', 'літри', 'літрів', 'л']),
      u('m3', 'м³', 'кубічний метр', 'cubic metre', 1000, ['m3', 'куб.м', 'м3']),
      u('tsp', 'tsp', 'чайна ложка', 'teaspoon', 0.00492892, ['teaspoon', 'чайна ложка']),
      u('tbsp', 'tbsp', 'столова ложка', 'tablespoon', 0.0147868, ['tablespoon', 'столова ложка']),
      u('cup', 'cup', 'чашка', 'cup', 0.236588, ['cups', 'чашки']),
      u('flz', 'fl oz', 'рідка унція', 'fluid ounce', 0.0295735, ['floz', 'fl oz', 'рідка унція']),
      u('pt', 'pt', 'пінта', 'pint', 0.473176, ['pints', 'пінти']),
      u('gal', 'gal', 'галон', 'gallon', 3.78541, ['gallons', 'галони', 'галон']),
    ],
  },
];

export const unitCategoryMap = new Map(unitCategories.map((category) => [category.id, category]));

export function convertUnits(category: UnitCategoryId, fromId: string, toId: string, value: number): number {
  if (!Number.isFinite(value)) return Number.NaN;

  if (category === 'temperature') {
    const celsius = fromId === 'c' ? value : fromId === 'f' ? ((value - 32) * 5) / 9 : value - 273.15;
    if (toId === 'c') return celsius;
    if (toId === 'f') return (celsius * 9) / 5 + 32;
    return celsius + 273.15;
  }

  const definition = unitCategoryMap.get(category);
  const from = definition?.units.find((unit) => unit.id === fromId);
  const to = definition?.units.find((unit) => unit.id === toId);
  if (!from || !to) return Number.NaN;
  return (value * from.factor) / to.factor;
}

export interface UnitLookup {
  category: UnitCategoryId;
  unit: Unit;
}

/** alias (normalised) -> unit, built once for the smart-search parser. */
export const unitAliasIndex: Map<string, UnitLookup> = (() => {
  const index = new Map<string, UnitLookup>();
  for (const category of unitCategories) {
    for (const unit of category.units) {
      for (const alias of unit.aliases) {
        const key = alias.toLowerCase().trim();
        // Earlier categories win so that "m" stays metres rather than minutes.
        if (key && !index.has(key)) index.set(key, { category: category.id, unit });
      }
    }
  }
  return index;
})();
