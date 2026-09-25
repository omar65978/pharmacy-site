import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MAP_LINK, SITE_ORIGIN } from '../src/config';
import {
  formatCount, formatPrice, MEDICINES_API_URL, processMedicines,
  type Medicine, type MedicineRaw,
} from '../src/lib/catalog';
import { medicinePath, medicineSlug } from '../src/lib/medicineUrl';
import { DISPLAY_PHONE, singleOrderMessage, whatsappLink } from '../src/lib/order';
import { getProductPhoto } from '../src/lib/productImages';

const PHARMACY = 'صيدلية الدكتور علي عباس';
const ADDRESS = '٩١ امتداد شارع المشروع، عين شمس الغربية، القاهرة.';
const SOURCE_PAGE = 'https://github.com/karem505/egyptian-drug-database';
const DELIVERY_PATH = '/delivery-areas/';
export const DIRECTORY_PAGE_SIZE = 500;

export interface MedicineSnapshot {
  sourceUrl: string;
  capturedAt: string;
  medicines: MedicineRaw[];
}

export interface SeoCatalog {
  snapshot: MedicineSnapshot;
  medicines: Medicine[];
  alphabetic: Medicine[];
  bySlug: Map<string, Medicine>;
  directoryPageById: Map<string, number>;
  directoryPageCount: number;
}

export function readSeoCatalog(): SeoCatalog {
  const snapshot = JSON.parse(readFileSync(resolve('public/data/medicines.json'), 'utf8')) as MedicineSnapshot;
  return prepareSeoCatalog(snapshot);
}

export function prepareSeoCatalog(snapshot: MedicineSnapshot): SeoCatalog {
  if (snapshot.sourceUrl !== MEDICINES_API_URL || !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.capturedAt)) {
    throw new Error('مصدر نسخة دليل الأدوية أو تاريخها غير صالح');
  }
  const medicines = processMedicines(snapshot.medicines);
  const bySlug = new Map<string, Medicine>();
  for (const medicine of medicines) {
    const slug = medicineSlug(medicine);
    if (bySlug.has(slug) && bySlug.get(slug)?.id !== medicine.id) {
      throw new Error(`تصادم رابط دواء: ${slug}`);
    }
    bySlug.set(slug, medicine);
  }
  const alphabetic = [...medicines].sort((a, b) =>
    a.commercial_name_en.localeCompare(b.commercial_name_en, 'en') ||
    a.manufacturer.localeCompare(b.manufacturer, 'en'));
  const directoryPageById = new Map(alphabetic.map((medicine, index) =>
    [medicine.id, Math.floor(index / DIRECTORY_PAGE_SIZE) + 1]));
  return {
    snapshot, medicines, alphabetic, bySlug, directoryPageById,
    directoryPageCount: Math.ceil(alphabetic.length / DIRECTORY_PAGE_SIZE),
  };
}

export function directoryPath(page: number): string {
  return page === 1 ? '/directory/' : `/directory/page/${page}/`;
}

export function escapeHtml(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!);
}

function structuredData(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function pageHtml(options: {
  title: string; description: string; path: string; body: string;
  schema?: unknown; robots?: 'index, follow' | 'noindex, follow';
}): string {
  const url = `${SITE_ORIGIN}${options.path}`;
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#123e37">
<title>${escapeHtml(options.title)}</title>
<meta name="description" content="${escapeHtml(options.description)}">
<meta name="robots" content="${options.robots ?? 'index, follow'}">
<link rel="canonical" href="${escapeHtml(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(options.title)}">
<meta property="og:description" content="${escapeHtml(options.description)}">
<meta property="og:url" content="${escapeHtml(url)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/seo.css">
${options.schema ? `<script type="application/ld+json">${structuredData(options.schema)}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">انتقل إلى المحتوى</a>
<header class="top"><div class="wrap top-inner"><a class="brand" href="/"><img src="/favicon.svg" alt="" width="43" height="43"><span><strong>${PHARMACY}</strong><small>في عين شمس الغربية، القاهرة</small></span></a><nav class="top-nav" aria-label="القائمة الرئيسية"><a href="/">الرئيسية</a><a href="/directory/">فهرس الأدوية</a><a href="${DELIVERY_PATH}">مناطق التوصيل</a></nav></div></header>
${options.body}
<footer class="footer"><div class="wrap foot-inner"><div><strong>${PHARMACY}</strong><p>مقر الصيدلية الوحيد: ${ADDRESS}</p><p>معلومات دليل الأدوية مرجعية ولا تؤكد المخزون أو السعر النهائي.</p></div><div class="foot-links"><a href="${escapeHtml(MAP_LINK)}" target="_blank" rel="noopener noreferrer">موقع الصيدلية على خرائط جوجل</a><a href="${DELIVERY_PATH}">أماكن التوصيل</a><a href="/directory/">فهرس الأدوية</a><a href="${escapeHtml(whatsappLink('مرحباً، أود التواصل مع صيدلية الدكتور علي عباس.'))}" target="_blank" rel="noopener noreferrer">واتساب: ${DISPLAY_PHONE}</a></div></div></footer>
</body>
</html>`;
}

function breadcrumbs(current: string, parent?: { label: string; path: string }): string {
  return `<nav class="crumbs" aria-label="مسار التصفح"><a href="/">الرئيسية</a><span aria-hidden="true"> / </span>${parent ? `<a href="${parent.path}">${escapeHtml(parent.label)}</a><span aria-hidden="true"> / </span>` : ''}<span aria-current="page">${escapeHtml(current)}</span></nav>`;
}

function fact(label: string, value: string, ltr = false): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd${ltr ? ' dir="ltr"' : ''}>${escapeHtml(value || 'غير مذكور في الدليل')}</dd></div>`;
}

export function renderMedicinePage(medicine: Medicine, catalog: SeoCatalog): string {
  const name = medicine.commercial_name_ar.trim() || medicine.commercial_name_en;
  const en = medicine.commercial_name_en.trim();
  const path = medicinePath(medicine);
  const photo = getProductPhoto(en);
  const directoryPage = catalog.directoryPageById.get(medicine.id) ?? 1;
  const referencePrice = medicine.price_egp !== null && Number.isFinite(medicine.price_egp) && medicine.price_egp > 0
    ? `${formatPrice(medicine.price_egp)} ج.م (من الدليل، وليس سعر الصيدلية)`
    : 'غير مذكور في الدليل';
  const description = `${name} (${en}) في دليل الأدوية المصري. تفاصيل العبوة والمادة الفعالة من مصدر خارجي؛ اسأل ${PHARMACY} بعين شمس الغربية عن السعر والتوفر الفعلي.`;
  const title = `${name} | ${en} — دليل الأدوية | ${PHARMACY}`;
  const crumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: PHARMACY, item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'فهرس الأدوية', item: `${SITE_ORIGIN}/directory/` },
      { '@type': 'ListItem', position: 3, name, item: `${SITE_ORIGIN}${path}` },
    ],
  };
  const photoHtml = photo
    ? `<figure class="pack"><img src="${photo.src}" width="260" height="260" loading="lazy" alt="صورة مرجعية لعبوة ${escapeHtml(en)}"><figcaption>صورة مرجعية للعبوة، وقد يتغيّر شكل التغليف. <a href="${escapeHtml(photo.sourcePage)}" target="_blank" rel="noopener noreferrer">مصدر الصورة</a></figcaption></figure>`
    : '<div class="no-pack" role="note"><span aria-hidden="true">✳</span><strong>لا تتوفر صورة عبوة موثوقة لهذا الصنف</strong><small>لم نستخدم صورة منتج آخر أو عبوة مشابهة.</small></div>';
  const body = `<main id="main" class="wrap main">
${breadcrumbs(name, { label: 'فهرس الأدوية', path: directoryPath(directoryPage) })}
<div class="two-column"><article class="paper medicine-detail">
<p class="eyebrow">بيانات من دليل أدوية مصري خارجي · ليست قائمة مخزون</p>
<h1>${escapeHtml(name)}</h1><p class="latin" dir="ltr">${escapeHtml(en)}</p>
<div class="product-lead">${photoHtml}<div><h2>بيانات الصنف في الدليل</h2><dl class="facts">
${fact('الاسم التجاري', en, true)}
${fact('المادة الفعالة', medicine.scientific_name, true)}
${fact('الشركة المدوّنة', medicine.manufacturer, true)}
${fact('الشكل التقريبي', medicine.form)}
${fact('تصنيف الدليل', medicine.drug_class, true)}
${fact('طريقة الاستعمال في الدليل', medicine.route, true)}
${fact('السعر المرجعي المسجّل', referencePrice)}
</dl></div></div>
<section class="notice" aria-labelledby="notice-title"><h2 id="notice-title">قبل الاستفسار عن الدواء</h2><p>ورود هذا الصنف في دليل خارجي <strong>لا يعني أنه متوفر في الصيدلية</strong>، ولا أن السعر المعروض هو سعر البيع الحالي. البيانات المرجعية قد تتغير أو تكون غير مكتملة؛ الصيدلي يؤكد السعر والتوفر، ويتحقق من متطلبات الروشتة عند اللزوم. هذه الصفحة ليست نصيحة طبية.</p></section>
<p class="source">مصدر البيانات: <a href="${SOURCE_PAGE}" target="_blank" rel="noopener noreferrer">Egyptian Drug Database</a> (CC0). تاريخ التقاط نسخة الدليل: <time datetime="${catalog.snapshot.capturedAt}" dir="ltr">${catalog.snapshot.capturedAt}</time>.</p>
<p class="back"><a href="${directoryPath(directoryPage)}">← الرجوع إلى فهرس الأدوية</a></p>
</article><aside class="paper contact-box"><p class="eyebrow">تواصل مع الصيدلية</p><h2>اسأل عن السعر والتوفر الفعلي</h2><p>اذكر اسم الصنف والعبوة في رسالة واتساب، وسنساعدك في التأكد من التفاصيل قبل أي طلب.</p><a class="cta" href="${escapeHtml(whatsappLink(singleOrderMessage(medicine)))}" target="_blank" rel="noopener noreferrer">اسأل عن هذا الدواء على واتساب ↗</a><p class="aside-note">مقرّنا في عين شمس الغربية، والتوصيل متاح للاستفسار في عين شمس الغربية والمطرية وعرب الحصن بعد تأكيد التفاصيل.</p><a class="text-link" href="${DELIVERY_PATH}">تفاصيل التوصيل والزيارة ←</a></aside></div>
</main>`;
  return pageHtml({ title, description, path, body, schema: crumbSchema });
}

export function renderDirectoryPage(catalog: SeoCatalog, page: number): string {
  if (!Number.isInteger(page) || page < 1 || page > catalog.directoryPageCount) throw new Error(`صفحة فهرس غير متاحة: ${page}`);
  const path = directoryPath(page);
  const items = catalog.alphabetic.slice((page - 1) * DIRECTORY_PAGE_SIZE, page * DIRECTORY_PAGE_SIZE);
  const start = (page - 1) * DIRECTORY_PAGE_SIZE + 1;
  const end = start + items.length - 1;
  const entries = items.map((medicine) => `<li><a href="${medicinePath(medicine)}"><span>${escapeHtml(medicine.commercial_name_ar || medicine.commercial_name_en)}</span><small dir="ltr">${escapeHtml(medicine.commercial_name_en)}</small></a></li>`).join('\n');
  const pages = Array.from({ length: catalog.directoryPageCount }, (_, index) => index + 1)
    .map((number) => `<a href="${directoryPath(number)}"${page === number ? ' aria-current="page"' : ''}>${formatCount(number)}</a>`).join('');
  const title = `فهرس الأدوية المصرية | صفحة ${page} من ${catalog.directoryPageCount} | ${PHARMACY}`;
  const description = `فهرس أبجدي لأسماء الأدوية في الدليل المصري، من ${formatCount(start)} إلى ${formatCount(end)}. بيانات مرجعية لا تؤكد توفر الأدوية في ${PHARMACY}.`;
  const body = `<main id="main" class="wrap main">
${breadcrumbs('فهرس الأدوية')}
<div class="paper directory"><p class="eyebrow">دليل الأدوية المصرية · فهرس أبجدي</p><h1>فهرس الأدوية المصرية</h1>
<p>تصفّح الروابط المستقلة لكل صنف أو <a href="/#catalog">ابحث بالاسم العربي أو الإنجليزي في واجهة الصيدلية</a>. هذه أسماء من دليل خارجي، <strong>وليست قائمة بالأدوية المتوفرة لدينا</strong>. اسأل الصيدلي عن التوفر والسعر الفعلي.</p>
<p class="range">عرض ${formatCount(start)}–${formatCount(end)} من ${formatCount(catalog.medicines.length)} صنفًا · صفحة ${formatCount(page)} من ${formatCount(catalog.directoryPageCount)}</p>
<ul class="medicine-list">${entries}</ul>
<nav class="page-nav" aria-label="صفحات فهرس الأدوية">${page > 1 ? `<a href="${directoryPath(page - 1)}">السابق ←</a>` : ''}${page < catalog.directoryPageCount ? `<a href="${directoryPath(page + 1)}">التالي ←</a>` : ''}</nav>
<details class="jump"><summary>انتقل إلى صفحة أخرى من الفهرس</summary><nav class="page-numbers" aria-label="جميع صفحات الفهرس">${pages}</nav></details>
</div></main>`;
  return pageHtml({ title, description, path, body });
}

export function renderDeliveryPage(): string {
  const title = `موقع ${PHARMACY} ومناطق التوصيل | عين شمس الغربية والمطرية وعرب الحصن`;
  const description = `${PHARMACY} في ٩١ امتداد شارع المشروع، عين شمس الغربية، القاهرة. استفسر عن التوصيل إلى عين شمس الغربية والمطرية وعرب الحصن عبر واتساب بعد تأكيد توفر الدواء.`;
  const body = `<main id="main" class="wrap main">
${breadcrumbs('موقع الصيدلية ومناطق التوصيل')}
<article class="paper delivery"><p class="eyebrow">زورنا أو اسأل عن التوصيل</p><h1>صيدلية في عين شمس الغربية، وتوصيل للمناطق القريبة</h1>
<p class="intro">مقر <strong>${PHARMACY}</strong> في <strong>${ADDRESS}</strong> يمكن الاستفسار عن توصيل الطلبات إلى عين شمس الغربية والمطرية وعرب الحصن؛ هذه <strong>مناطق توصيل، وليست فروعًا للصيدلية</strong>.</p>
<div class="delivery-grid"><section><h2>عنوان الصيدلية وزيارتها</h2><address>${ADDRESS}</address><p>افتح الموقع المؤكد للصيدلية على خرائط جوجل للوصول إلى العنوان، أو اسألنا قبل الزيارة عن الدواء المطلوب.</p><a class="text-link" href="${escapeHtml(MAP_LINK)}" target="_blank" rel="noopener noreferrer">فتح الموقع على خرائط جوجل ↗</a></section>
<section><h2>أين يمكن الاستفسار عن التوصيل؟</h2><ul class="areas"><li>عين شمس الغربية</li><li>المطرية</li><li>عرب الحصن</li></ul><p>نؤكد عند التواصل توفر الصنف والسعر الحالي وإمكانية التوصيل ومدته وتكلفته بحسب العنوان؛ لا يظهر مخزون أو تكلفة توصيل مباشرة على الموقع.</p></section></div>
<section class="delivery-steps"><h2>كيف تطلب أو تستفسر؟</h2><ol><li>ابحث عن اسم الدواء أو <a href="/directory/">افتح فهرس الأدوية</a> للتأكد من الصنف والعبوة المقصودين.</li><li>راسل الصيدلية عبر واتساب للسؤال عن توفره وسعره النهائي ومتطلبات الروشتة.</li><li>اذكر عنوان التوصيل في إحدى المناطق المذكورة أو خطّط لزيارة مقرّنا بعين شمس الغربية بعد التأكيد.</li></ol><a class="cta" href="${escapeHtml(whatsappLink('مرحباً صيدلية الدكتور علي عباس، أود الاستفسار عن توصيل دواء إلى عين شمس الغربية أو المطرية أو عرب الحصن. هل التوصيل متاح؟'))}" target="_blank" rel="noopener noreferrer">اسأل عن التوصيل عبر واتساب ↗</a></section>
</article></main>`;
  return pageHtml({ title, description, path: DELIVERY_PATH, body, schema: {
    '@context': 'https://schema.org', '@type': 'WebPage',
    name: title, url: `${SITE_ORIGIN}${DELIVERY_PATH}`, about: { '@id': `${SITE_ORIGIN}/#pharmacy` },
  } });
}

export function generateSitemapXml(catalog: SeoCatalog): string {
  const paths = [
    '/', DELIVERY_PATH,
    ...Array.from({ length: catalog.directoryPageCount }, (_, index) => directoryPath(index + 1)),
    ...catalog.medicines.map(medicinePath),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `<url><loc>${SITE_ORIGIN}${path}</loc></url>`).join('\n')}\n</urlset>\n`;
}

/** Vite dev server serves exactly the same pages that the production build emits. */
export function getSeoRoute(pathname: string, catalog: SeoCatalog): { status: number; type: string; body: string } | null {
  if (pathname === '/sitemap.xml') return { status: 200, type: 'application/xml', body: generateSitemapXml(catalog) };
  if (pathname === DELIVERY_PATH || pathname === '/delivery-areas') return { status: 200, type: 'text/html', body: renderDeliveryPage() };
  if (pathname === '/directory/' || pathname === '/directory') return { status: 200, type: 'text/html', body: renderDirectoryPage(catalog, 1) };
  const directoryPage = /^\/directory\/page\/([1-9]\d*)\/?$/.exec(pathname);
  if (directoryPage) {
    const page = Number(directoryPage[1]);
    if (page >= 2 && page <= catalog.directoryPageCount) return { status: 200, type: 'text/html', body: renderDirectoryPage(catalog, page) };
    return { status: 404, type: 'text/plain', body: 'صفحة غير موجودة' };
  }
  const medicine = /^\/medicine\/([a-z0-9-]+)\/?$/.exec(pathname);
  if (medicine) {
    const item = catalog.bySlug.get(medicine[1]);
    return item
      ? { status: 200, type: 'text/html', body: renderMedicinePage(item, catalog) }
      : { status: 404, type: 'text/plain', body: 'دواء غير موجود في الدليل' };
  }
  return null;
}
