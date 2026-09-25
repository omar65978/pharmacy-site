import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import fallbackRaw from '../data/fallback-medicines.json';
import { FEATURED_NAMES, processMedicines } from './catalog';
import { FEATURED_PHOTOS, getProductPhoto, getShowcaseMedicines } from './productImages';

describe('Curated pack photos', () => {
  it('covers the eight exact featured labels with local, nonempty image files', () => {
    expect(Object.keys(FEATURED_PHOTOS)).toEqual([...FEATURED_NAMES]);
    for (const name of FEATURED_NAMES) {
      const photo = getProductPhoto(name);
      expect(photo?.sourcePage).toMatch(/^https:\/\//);
      expect(photo?.src).toMatch(/^\/images\/medicines\/.+\.webp$/);
      const file = join(process.cwd(), 'public', photo!.src.slice(1));
      expect(existsSync(file), file).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(2000);
    }
  });

  it('shows only medicines with real pack photos in the default homepage showcase', () => {
    const catalog = processMedicines(fallbackRaw);
    expect(catalog.length).toBeGreaterThan(FEATURED_NAMES.length);
    expect(getShowcaseMedicines(catalog).map((medicine) => medicine.commercial_name_en)).toEqual([...FEATURED_NAMES]);
    expect(getShowcaseMedicines(catalog.slice(1)).map((medicine) => medicine.commercial_name_en)).toEqual([...FEATURED_NAMES.slice(1)]);
  });

  it('never reuses a photo for another strength, pack, brand or unknown name', () => {
    for (const name of [
      'PANADOL EXTRA 48 F.C. TABS.',
      'BRUFEN 200 MG 30 TABS.',
      'BRUFEN 400 MG 20 TABS.',
      'GAVISCON DOUBLE ACTION SUSP 300 ML',
      'REDOXON VITAMIN C 1000 MG 15 TABS.',
      'CATAFLAM 25 MG 20 SUGAR C.TABS.',
      'toString',
    ]) expect(getProductPhoto(name)).toBeUndefined();
  });
});
