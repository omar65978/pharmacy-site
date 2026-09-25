/** Public Egyptian medicine directory. The listing is NOT this pharmacy's inventory. */
export const MEDICINES_API_URL =
  'https://raw.githubusercontent.com/karem505/egyptian-drug-database/main/data/egyptian-drugs.json';
export type CategoryId = 'all' | 'pain' | 'cold' | 'vitamins' | 'skin' | 'digestive' | 'antibiotics';
export type ProductCategory = Exclude<CategoryId, 'all'> | 'other';
export type SortOrder = 'default' | 'price-asc' | 'price-desc' | 'name';

export interface MedicineRaw {
  commercial_name_en: string;
  commercial_name_ar: string;
  scientific_name: string;
  manufacturer: string;
  drug_class: string;
  route: string;
  price_egp: number | null;
}

export interface Medicine extends MedicineRaw {
  id: string;
  category: ProductCategory;
  form: string;
  searchIndex: string;
}

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'all', label: 'كل الأدوية' },
  { id: 'pain', label: 'مسكنات وألم' },
  { id: 'cold', label: 'برد وحساسية' },
  { id: 'vitamins', label: 'فيتامينات' },
  { id: 'skin', label: 'عناية بالبشرة' },
  { id: 'digestive', label: 'معدة وهضم' },
  { id: 'antibiotics', label: 'مضادات حيوية' },
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  pain: 'مسكنات وألم',
  cold: 'برد وحساسية',
  vitamins: 'فيتامينات ومكملات',
  skin: 'عناية بالبشرة',
  digestive: 'معدة وهضم',
  antibiotics: 'مضاد حيوي',
  other: 'أدوية وعناية',
};

export const FEATURED_NAMES = [
  'PANADOL EXTRA 24 F.C. TABS.',
  'CONGESTAL 20 TABS.',
  'BRUFEN 400 MG 30 TABS.',
  'BEPANTHEN CREAM 30 GM',
  'GAVISCON DOUBLE ACTION SUSP 150 ML',
  'REDOX VITAMIN C 1000 MG 10 TABS.',
  'CATAFLAM 50 MG 20 SUGAR C.TABS.',
  'CLARITINE 10MG 20 TAB.',
] as const;

export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferCategory(drugClass: string, route: string): ProductCategory {
  const cls = drugClass.toUpperCase();
  if (/ANTIBIOTIC|PENICILLIN|CEPHALOSPORIN|MACROLIDE|QUINOLONE|TETRACYCLINE/.test(cls)) return 'antibiotics';
  if (/VITAMIN|SUPPLEMENT|MINERAL|CALCIUM|IRON PREPARATION|OMEGA|ZINC/.test(cls)) return 'vitamins';
  if (/COLD|COUGH|ALLERGY|ANTI.HISTAMINE|DECONGEST|SORE THROAT|NASAL CONGEST/.test(cls)) return 'cold';
  if (/ANALGESIC|NSAID|ANTIPYRETIC|MIGRAINE|PAIN RELIE/.test(cls)) return 'pain';
  if (/ANTACID|PEPTIC ULCER|GASTRO|LAXATIVE|ANTIDIARR|ANTIFLATULENT|ANTISPASMODIC|DIGEST|ANTI.EMETIC/.test(cls)) return 'digestive';
  if (/SKIN CARE|DERMATO|EMOLLIENT|ANTI.ACNE|ANTISEPTIC|SUN.?SCREEN/.test(cls) || route.toUpperCase() === 'TOPICAL') return 'skin';
  return 'other';
}

function inferForm(route: string, name: string): string {
  const normalizedRoute = route.toUpperCase();
  const normalizedName = name.toUpperCase();
  if (/EYE|OPHTH|DROPS/.test(normalizedRoute) || /EYE DROPS|NASAL DROPS|ORAL DROPS/.test(normalizedName)) return 'قطرات';
  if (/TOPICAL|CREAM|OINT|GEL/.test(normalizedRoute) || /CREAM|OINT\.|GEL\b|LOTION/.test(normalizedName)) return 'كريم ومرهم';
  if (/ORAL.LIQUID|SYRUP|SUSP/.test(normalizedRoute) || /SUSP\b|SYRUP|SOLUTION/.test(normalizedName)) return 'شراب ومعلّق';
  if (/INJECTION|I.V.|AMP|VIAL/.test(normalizedRoute)) return 'حقن وأمبولات';
  if (/ORAL.SOLID|EFF/.test(normalizedRoute)) return 'أقراص وكبسولات';
  return 'مستحضر دوائي';
}

function isMedicineRaw(value: unknown): value is MedicineRaw {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<MedicineRaw>;
  return typeof v.commercial_name_en === 'string' &&
    typeof v.commercial_name_ar === 'string' &&
    typeof v.scientific_name === 'string' &&
    typeof v.manufacturer === 'string' &&
    typeof v.drug_class === 'string' &&
    typeof v.route === 'string' &&
    (typeof v.price_egp === 'number' || v.price_egp === null);
}

export function toMedicine(raw: MedicineRaw): Medicine {
  const name = raw.commercial_name_en.trim();
  return {
    ...raw,
    id: `${name}|${raw.manufacturer.trim()}`,
    category: inferCategory(raw.drug_class, raw.route),
    form: inferForm(raw.route, name),
    searchIndex: normalizeSearch([
      raw.commercial_name_en,
      raw.commercial_name_ar,
      raw.scientific_name,
      raw.manufacturer,
    ].join(' ')),
  };
}

export function processMedicines(input: unknown): Medicine[] {
  if (!Array.isArray(input)) throw new Error('صيغة دليل الأدوية غير صالحة');
  const names = new Set<string>();
  return input.filter(isMedicineRaw)
    // N/A is explicitly marked by the upstream database; do not list it as an orderable item.
    .filter((raw) => raw.commercial_name_en.trim() && !/\(N\/A\)/i.test(raw.commercial_name_en))
    .map(toMedicine)
    .filter((medicine) => {
      if (names.has(medicine.id)) return false;
      names.add(medicine.id);
      return true;
    });
}

export function getFeatured(medicines: Medicine[]): Medicine[] {
  const byName = new Map(medicines.map((medicine) => [medicine.commercial_name_en, medicine]));
  return FEATURED_NAMES.map((name) => byName.get(name)).filter((item): item is Medicine => Boolean(item));
}

export function filterMedicines(medicines: Medicine[], query: string, category: CategoryId): Medicine[] {
  const words = normalizeSearch(query).split(' ').filter(Boolean);
  return medicines.filter((medicine) =>
    (category === 'all' || medicine.category === category) &&
    words.every((word) => medicine.searchIndex.includes(word)),
  );
}

export function rankMedicines(medicines: Medicine[], query: string): Medicine[] {
  const term = normalizeSearch(query);
  if (!term) return medicines;
  const score = (medicine: Medicine): number => {
    const arabic = normalizeSearch(medicine.commercial_name_ar);
    const english = normalizeSearch(medicine.commercial_name_en);
    if (arabic === term || english === term) return 0;
    if (arabic.startsWith(term) || english.startsWith(term)) return 1;
    if (arabic.includes(term) || english.includes(term)) return 2;
    return 3; // active ingredient or manufacturer only
  };
  return [...medicines].sort((a, b) => score(a) - score(b));
}

export function sortMedicines(medicines: Medicine[], order: SortOrder): Medicine[] {
  if (order === 'default') return medicines;
  const sorted = [...medicines];
  if (order === 'name') return sorted.sort((a, b) => a.commercial_name_ar.localeCompare(b.commercial_name_ar, 'ar'));
  return sorted.sort((a, b) => {
    const aPrice = a.price_egp ?? (order === 'price-asc' ? Infinity : -Infinity);
    const bPrice = b.price_egp ?? (order === 'price-asc' ? Infinity : -Infinity);
    return order === 'price-asc' ? aPrice - bPrice : bPrice - aPrice;
  });
}

export function formatPrice(price: number | null): string {
  if (price === null) return 'اسأل عن السعر';
  return new Intl.NumberFormat('ar-EG-u-nu-latn', { maximumFractionDigits: 2 }).format(price);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('ar-EG-u-nu-latn').format(value);
}

export async function loadEgyptianMedicines(signal?: AbortSignal): Promise<Medicine[]> {
  // The browsable catalog and every indexed HTML URL must use the SAME version of the
  // directory. Refresh it at build time via `npm run refresh:medicines`, never at runtime.
  const response = await fetch('/data/medicines.json', { signal });
  if (!response.ok) throw new Error(`تعذّر تحميل نسخة الدليل (${response.status})`);
  const snapshot = await response.json() as { medicines?: unknown };
  const medicines = processMedicines(snapshot.medicines);
  if (medicines.length < 20000) throw new Error('نسخة دليل الأدوية غير مكتملة');
  return medicines;
}
