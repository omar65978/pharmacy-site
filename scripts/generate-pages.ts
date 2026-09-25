import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { SITE_ORIGIN } from '../src/config';
import { medicineSlug } from '../src/lib/medicineUrl';
import {
  directoryPath, generateSitemapXml, readSeoCatalog, renderDeliveryPage,
  renderDirectoryPage, renderMedicinePage,
} from './seo';

const dist = resolve('dist');

async function saveHtml(route: string, html: string) {
  const target = join(dist, route.replace(/^\//, ''), 'index.html');
  await mkdir(resolve(target, '..'), { recursive: true });
  await writeFile(target, html, 'utf8');
}

async function main() {
  const catalog = readSeoCatalog();
  if (catalog.medicines.length < 20000 || catalog.bySlug.size !== catalog.medicines.length) {
    throw new Error('نسخة دليل الأدوية غير كاملة أو بها روابط غير فريدة؛ أوقف النشر.');
  }
  const homepage = await readFile(join(dist, 'index.html'), 'utf8');
  if (!homepage.includes(`href="${SITE_ORIGIN}/"`)) {
    throw new Error('الرابط canonical للصفحة الرئيسية لا يطابق نطاق خريطة الموقع.');
  }

  await saveHtml('/delivery-areas/', renderDeliveryPage());
  for (let page = 1; page <= catalog.directoryPageCount; page++) {
    await saveHtml(directoryPath(page), renderDirectoryPage(catalog, page));
  }

  // Work in small batches to avoid opening tens of thousands of descriptors at once.
  const batchSize = 64;
  for (let offset = 0; offset < catalog.medicines.length; offset += batchSize) {
    await Promise.all(catalog.medicines.slice(offset, offset + batchSize).map(async (medicine) => {
      // A safe, deterministic ASCII folder name, shared with client-side catalog links.
      const route = `/medicine/${medicineSlug(medicine)}/`;
      await saveHtml(route, renderMedicinePage(medicine, catalog));
    }));
  }
  const sitemap = generateSitemapXml(catalog);
  await writeFile(join(dist, 'sitemap.xml'), sitemap, 'utf8');
  const expected = catalog.medicines.length + catalog.directoryPageCount + 2;
  if (sitemap.split('<url>').length - 1 !== expected) throw new Error('عدد روابط خريطة الموقع غير متطابق.');
  console.log(`SEO: ${catalog.medicines.length.toLocaleString('en-US')} صفحات دواء مستقلة، ${catalog.directoryPageCount} صفحات فهرس، صفحة توصيل وsitemap.xml لـ ${SITE_ORIGIN}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
