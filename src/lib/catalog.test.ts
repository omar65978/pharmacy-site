import { describe, expect, it } from 'vitest';
import { filterMedicines, normalizeSearch, processMedicines, rankMedicines, toMedicine } from './catalog';

const panadol = toMedicine({
  commercial_name_en: 'PANADOL EXTRA 24 F.C. TABS.', commercial_name_ar: 'بانادول إكسترا',
  scientific_name: 'PARACETAMOL', manufacturer: 'GSK', drug_class: 'MILD ANALGESIC',
  route: 'ORAL.SOLID', price_egp: 54,
});
const bepanthen = toMedicine({
  commercial_name_en: 'BEPANTHEN CREAM 30 GM', commercial_name_ar: 'بيبانثين كريم',
  scientific_name: 'DEXPANTHENOL', manufacturer: 'BAYER', drug_class: 'SKIN CARE',
  route: 'TOPICAL', price_egp: 215,
});

describe('Egyptian medicines', () => {
  it('searches in Arabic without depending on hamza marks', () => {
    expect(normalizeSearch('إكْسترا')).toBe('اكسترا');
    expect(filterMedicines([panadol, bepanthen], 'اكسترا', 'all')).toEqual([panadol]);
  });
  it('searches English pack names and filters by category', () => {
    expect(filterMedicines([panadol, bepanthen], 'panadol extra', 'pain')).toEqual([panadol]);
    expect(filterMedicines([panadol, bepanthen], '', 'skin')).toEqual([bepanthen]);
  });
  it('ranks a matching drug name above names that only contain the query', () => {
    const similar = { ...panadol, id: 'other', commercial_name_ar: 'أكس بانادول' };
    expect(rankMedicines([similar, panadol], 'بانادول')).toEqual([panadol, similar]);
  });
  it('omits N/A-marked products from the external directory', () => {
    const unavailable = { ...panadol, commercial_name_en: 'PANADOL (N/A)' };
    expect(processMedicines([unavailable, panadol])).toHaveLength(1);
  });
});
