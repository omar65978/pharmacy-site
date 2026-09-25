import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { MEDICINES_API_URL, processMedicines, type MedicineRaw } from '../src/lib/catalog';

const output = resolve('public/data/medicines.json');

async function main() {
  const response = await fetch(MEDICINES_API_URL, { signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error(`تعذّر تحميل المصدر: HTTP ${response.status}`);
  const medicines = processMedicines(await response.json());
  if (medicines.length < 20000) throw new Error(`عدد الأصناف غير متوقع (${medicines.length})؛ لن أستبدل النسخة السابقة.`);

  // Keep only source facts: the derived category, search index and generated URLs are built locally.
  const entries: MedicineRaw[] = medicines.map((medicine) => ({
    commercial_name_en: medicine.commercial_name_en,
    commercial_name_ar: medicine.commercial_name_ar,
    scientific_name: medicine.scientific_name,
    manufacturer: medicine.manufacturer,
    drug_class: medicine.drug_class,
    route: medicine.route,
    price_egp: medicine.price_egp,
  }));
  const snapshot = {
    sourceUrl: MEDICINES_API_URL,
    capturedAt: new Date().toISOString().slice(0, 10),
    medicines: entries,
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(snapshot)}\n`, 'utf8');
  console.log(`نسخة الدليل: ${medicines.length.toLocaleString('en-US')} صنفًا بتاريخ ${snapshot.capturedAt} -> ${output}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
