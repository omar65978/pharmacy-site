import type { Medicine } from './catalog';

type MedicineIdentity = Pick<Medicine, 'commercial_name_en' | 'manufacturer'>;

/**
 * Deterministic, browser-safe URL based on the upstream directory's item identity.
 * The 64-bit suffix distinguishes products with the same name from different manufacturers.
 * Do not change this algorithm after indexing without adding permanent redirects.
 */
export function medicineSlug(medicine: MedicineIdentity): string {
  const name = medicine.commercial_name_en.trim();
  const manufacturer = medicine.manufacturer.trim();
  const readable = name.toLowerCase().normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 68)
    .replace(/-+$/g, '') || 'medicine';

  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(`${name}|${manufacturer}`)) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n);
  }
  return `${readable}-${hash.toString(36).padStart(13, '0')}`;
}

export function medicinePath(medicine: MedicineIdentity): string {
  return `/medicine/${medicineSlug(medicine)}/`;
}
