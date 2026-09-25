import { describe, expect, it } from 'vitest';
import { MEDICINES_API_URL, processMedicines, type MedicineRaw } from '../src/lib/catalog';
import { medicinePath, medicineSlug } from '../src/lib/medicineUrl';
import fallback from '../src/data/fallback-medicines.json';
import { SITE_ORIGIN } from '../src/config';
import {
  directoryPath, generateSitemapXml, getSeoRoute, prepareSeoCatalog,
  readSeoCatalog, renderDeliveryPage, renderDirectoryPage, renderMedicinePage,
} from './seo';

const example: MedicineRaw = {
  commercial_name_en: 'PANADOL EXTRA 24 F.C. TABS.',
  commercial_name_ar: 'بانادول إكسترا',
  scientific_name: 'CAFFEINE+PARACETAMOL',
  manufacturer: 'GSK', drug_class: 'MILD ANALGESIC',
  route: 'ORAL.SOLID', price_egp: 54,
};
const sample = prepareSeoCatalog({
  sourceUrl: MEDICINES_API_URL, capturedAt: '2026-09-25',
  medicines: [example, { ...example, manufacturer: 'DIFFERENT COMPANY', commercial_name_ar: '<script>alert(1)</script>' }],
});

describe('SEO medicine URLs and static pages', () => {
  it('uses deterministic distinct URLs for different manufacturers and matches catalog links', () => {
    expect(medicineSlug(example)).toBe(medicineSlug(example));
    expect(medicinePath(example)).toMatch(/^\/medicine\/panadol-extra-24-f-c-tabs-[a-z0-9]+\/$/);
    expect(medicinePath(sample.medicines[0])).not.toBe(medicinePath(sample.medicines[1]));
    expect(sample.bySlug.get(medicineSlug(example))?.id).toBe(sample.medicines[0].id);
  });

  it('renders canonical HTML and reference-only facts without stock/offer markup or unescaped upstream text', () => {
    const html = renderMedicinePage(sample.medicines[1], sample);
    expect(html).toContain(`<link rel="canonical" href="${SITE_ORIGIN}${medicinePath(sample.medicines[1])}">`);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('لا يعني أنه متوفر في الصيدلية');
    expect(html).toContain('201020345314');
    expect(html).not.toContain('"offers"');
    expect(html).not.toContain('"availability"');
  });

  it('offers a browsable index and a truthful delivery page', () => {
    expect(directoryPath(1)).toBe('/directory/');
    expect(renderDirectoryPage(sample, 1)).toContain(`href="${medicinePath(example)}"`);
    const html = renderDeliveryPage();
    expect(html).toContain('٩١ امتداد شارع المشروع، عين شمس الغربية، القاهرة');
    expect(html).toContain('المطرية');
    expect(html).toContain('عرب الحصن');
    expect(html).toContain('وليست فروعًا للصيدلية');
  });

  it('includes exactly one canonical URL per item in the sitemap and returns 404 for unknown medicine routes', () => {
    const sitemap = generateSitemapXml(sample);
    expect(sitemap.split('<url>').length - 1).toBe(sample.medicines.length + sample.directoryPageCount + 2);
    expect(sitemap).toContain(`${SITE_ORIGIN}${medicinePath(example)}`);
    expect(getSeoRoute(medicinePath(example), sample)?.status).toBe(200);
    expect(getSeoRoute('/medicine/not-in-the-directory/', sample)?.status).toBe(404);
  });

  it('has a complete local snapshot and includes every offline-fallback product URL', () => {
    const catalog = readSeoCatalog();
    expect(catalog.medicines.length).toBeGreaterThan(20000);
    expect(catalog.bySlug.size).toBe(catalog.medicines.length);
    expect(catalog.directoryPageCount).toBeGreaterThan(40);
    for (const medicine of processMedicines(fallback)) {
      expect(catalog.bySlug.has(medicineSlug(medicine))).toBe(true);
    }
  });
});
