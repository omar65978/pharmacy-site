# Dr. Ali Abbas Pharmacy — Medicine Catalog & WhatsApp Inquiries

An Arabic-first, responsive pharmacy website built with **React, TypeScript, and Vite**. Visitors can search a locally bundled Egyptian medicine catalog, browse individual medicine pages, collect items in a browser-local inquiry basket, and open a prefilled WhatsApp message to ask the pharmacy about availability and pricing.

[Live website](https://dr-ali-abbas-pharmacy-site-14xz.vercel.app/) · [Image-rights review](docs/IMAGE-RIGHTS.md)

> **Scope:** This is a catalog and inquiry interface, not an online checkout or inventory-management system. It does not process payments, reserve stock, confirm purchases, or automatically validate prescriptions. Catalog prices and listings are reference data, not verified pharmacy stock or current selling prices. Medicine information is not medical advice.

## Features

- Responsive Arabic interface with right-to-left layout.
- Search by Arabic or English medicine name, with filtering and incremental result display. The interface itself is Arabic, not a bilingual UI.
- A local catalog snapshot with a labeled fallback dataset if loading fails.
- A browser-local basket that composes a WhatsApp inquiry with item names and quantities.
- Build-generated medicine detail pages, directory pages, a delivery-information page, and a sitemap.
- Exact-match photographs for eight selected packs; clearly labeled illustrations for other products or failed images.
- Unit tests for catalog behavior, WhatsApp messages, product-image selection, and generated-page helpers.

## Quick start

### Requirements

- Node.js 22.12 or later within the 22.x release line is a recommended development baseline for the Vite 7 toolchain; this repository does not currently pin a Node version.
- npm and Git.

```bash
git clone https://github.com/omar65978/pharmacy-site.git
cd pharmacy-site
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173/`. The application does not require an application database or a private backend key. WhatsApp and map links are external services and require connectivity.

### Tests and production build

```bash
npm test
npm run build
npm run preview
```

The production preview normally runs at `http://localhost:4173/`. The build includes TypeScript checking, Vite compilation, and generation of static catalog pages from the committed dataset. It does not silently download a new medicine catalog. Tests are present in the repository; this documentation update does not claim a new successful test or build run.

### Commands

| Command                     | Purpose                                                                         |
| --------------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`               | Start the Vite development server, including generated-page middleware          |
| `npm test`                  | Run the Vitest suite                                                            |
| `npm run build`             | Type-check, compile, and generate the static catalog pages                      |
| `npm run preview`           | Preview the completed production build                                          |
| `npm run refresh:medicines` | Fetch an updated catalog snapshot for explicit review; requires internet access |

## Deployment

The included `vercel.json` selects Vite, `npm run build`, and the `dist` output directory. Import the repository root. No payment, inventory, or database service is provisioned by deployment.

For another hostname, update the canonical site origin in `src/config.ts` and the corresponding settings in `index.html` and `public/robots.txt` before building. The generated-page script checks the homepage canonical against the configured origin. Verify deep links, the directory, and the sitemap after deployment.

## Data, images, and limitations

The existing project documentation identifies the catalog source as CC0. That statement concerns the dataset, **not** third-party product photographs, trademarks, or this project's source code. Eight local product-photo files have reference URLs in `src/lib/productImages.ts`; the inspected repository does not provide evidence of permission to redistribute those photos. Their status is **unverified**, not automatically licensed or proven unauthorized. See the [image-rights register](docs/IMAGE-RIGHTS.md) before featuring or distributing the project.

The hero image is identified in the existing documentation as a generated illustration, not a photograph of the actual pharmacy. The WhatsApp action opens a draft for the visitor to review and send; it is not an order confirmation. Prescription images must be attached manually in WhatsApp. Confirm medicine suitability, dispensing requirements, price, availability, and delivery directly with the pharmacist.

No project-wide source-code license was found in this review. Do not infer an unrestricted reuse grant from a public repository or the dataset's license.

## Repository structure

```text
src/App.tsx                Main catalog, basket, and information interface
src/components/            Product photographs and labeled illustrations
src/lib/                   Catalog, product matching, URLs, and inquiry messages
src/config.ts              Site origin and map configuration
public/data/               Committed catalog snapshot
public/images/             Hero illustration and selected pack photographs
scripts/                   Data refresh, static-page generation, and SEO helpers
docs/IMAGE-RIGHTS.md        Asset provenance and permission-review checklist
```

## Arabic project notes

The following Arabic notes retain the operational details, source references, image caveats, and configuration guidance.

### موقع صيدلية الدكتور علي عباس

موقع عربي مخصص لصيدلية الدكتور علي عباس **في عين شمس الغربية، القاهرة**: بحث في دليل الأدوية المصرية، سلة وطلبات استفسار على واتساب، روابط مباشرة ومستقلة للأدوية، فهرس أبجدي، ومعلومات العنوان ومناطق التوصيل. يعرض صور العبوات الثماني المطابقة فقط ورسوماً موضّحاً أنها «تعبيرية» لبقية الأصناف. توجد صورة رئيسية **توضيحية لصيدلي رجل** وشعار هلالي.

- **عنوان مقر الصيدلية:** ٩١ امتداد شارع المشروع، عين شمس الغربية، القاهرة. [الموقع المثبّت على خرائط جوجل](https://maps.app.goo.gl/Pmdh7Nh8gGHSpTdh9).
- **مناطق يُستفسَر عن التوصيل إليها:** عين شمس الغربية، المطرية، عرب الحصن. **لا نعلن عن فروع في المطرية أو عرب الحصن.** تكلفة ووقت التوصيل بعد السؤال.
- **الدومين الأساسي المخصص لروابط الصفحات:** <https://dr-ali-abbas-pharmacy-site-14xz.vercel.app/>.

> **تنبيه مهم:** دليل الأدوية والأسعار مصدره بيانات خارجية **لا تمثل مخزون الصيدلية أو أسعار بيعها الحالية**. وجود صنف في الدليل أو ظهور زر الطلب لا يضمن توافره؛ الاستفسار عبر واتساب، ولا يُعد فتح الرسالة شراءً أو دفعًا أو تأكيد طلب. تحقّق مع الصيدلي من السعر والتوفر والروشتة المناسبة.

## مصدر الأدوية وتحديث النسخة

- مصدر البيانات العامة بترخيص **CC0**: [Egyptian Drug Database](https://github.com/karem505/egyptian-drug-database)، [ملف JSON الأصلي](https://raw.githubusercontent.com/karem505/egyptian-drug-database/main/data/egyptian-drugs.json). النسخة الموجودة في `public/data/medicines.json` التُقطت بتاريخ **2026-09-25** وتضم **23,858 صنفًا صالحًا**. تاريخ النسخة ليس تأكيدًا لسعر الصيدلية أو المخزون.
- تُحمّل النسخة المحلية من نفس النشر في المتصفح بدل الاعتماد على مصدر خارجي حي؛ لذا **تطابق روابط نتائج البحث صفحات HTML المولّدة**. يتم البحث والتصفية محليًا ويُعرض 12 صنفًا في كل دفعة. في حال تعذر تحميل النسخة، تظهر عينة احتياطية من 45 دواء وتنبيه واضح في `src/data/fallback-medicines.json`.
- لتحديث القائمة مستقبلًا: شغّل `npm run refresh:medicines` **باتصال بالإنترنت**، راجع تغييرات البيانات والأسعار/الأسماء، ثم `npm test && npm run build`، ثم commit/push للنسخة الجديدة. أمر البناء نفسه لا يجلب أدوية جديدة خفية. راقب الأصناف المحذوفة والروابط التي قد تتغيّر وتحقق من حقوق الصور.
- السلة محفوظة محليًا في `localStorage`. زر «شراء الآن» ينشئ رسالة عن صنف واحد، وسلة الطلب تنشئ رسالة بكل الأصناف والكميات، وكلاهما موجّه لرقم **01020345314**. زر «اطلب الروشتة عبر الواتساب» يرسل نص **«هل لديكم هذه الروشتة؟»**؛ **إرفاق صورة الروشتة يدوي** بعد فتح واتساب.
- صورة البطل في `public/images/pharmacy-hero-male.webp` توضيحية مولّدة وليست تصويرًا للصيدلية الفعلية؛ استبدلها بصورة تملك حقوق استخدامها إن رغبت.

## صور عبوات الأدوية

تظهر **صور عبوات للأصناف الثمانية المختارة فقط** في البطاقات وتفاصيل الصنف والسلة، مع مطابقة الاسم والتركيز وحجم العبوة لصفحة المصدر. تُحفظ نسخ WebP مضغوطة محليًا داخل `public/images/medicines/`، لذلك لا يعتمد عرضها على اتصال بمتاجر الصور. **الترتيب «الافتراضي» في الصفحة الرئيسية دون بحث أو تصنيف يعرض هذه الأدوية المصوّرة فقط.** لعرض جميع الأدوية اضغط «عرض كل الأدوية» أو اختر فئة «كل الأدوية»؛ ينتقل الترتيب إلى «حسب الاسم» حتى تكون القائمة الكاملة ظاهرة. وتظل بقية الأدوية متاحة أيضًا بالبحث والتصنيفات. إعادة اختيار «الافتراضي» بلا بحث أو تصنيف تعيد قائمة الأصناف المصوّرة.

إذا تعذّر تحميل الصورة، أو كان الدواء غير مشمول بالمطابقة **الحرفية** في `src/lib/productImages.ts`، يعرض الموقع رسماً عامًا يعبّر عن **الشكل الدوائي** (أقراص أو كريم أو شراب أو قطرات)، لا عن عبوة المنتج نفسها. يظهر معه وسم واضح «صورة تعبيرية — ليست صورة حقيقية لهذا الدواء»، وتنبيه أعلى نتائج البحث وفي تفاصيل المنتج والسلة؛ لا توجد صور حقيقية لبقية آلاف الأصناف. لا يُستخدم تصوير عبوة مختلفة لدواء مشابه (مثل 25 مجم بدل 50، أو 15 قرصًا بدل 10). قد يتغير شكل التغليف بمرور الوقت، ولا تعني الصورة توفر العبوة في الصيدلية.

| الصنف المطابق حرفيًا                 | صفحة الصورة المرجعية                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `PANADOL EXTRA 24 F.C. TABS.`        | [EgyptDwa — 24 قرص](https://egyptdwa.com/m/9565)                                                                                 |
| `CONGESTAL 20 TABS.`                 | [صيدليات الريدي — 20 قرص](https://reedyph.com/productdetails/28721)                                                              |
| `BRUFEN 400 MG 30 TABS.`             | [EgyptDwa — 400 مجم، 30 قرص](https://egyptdwa.com/m/1767)                                                                        |
| `BEPANTHEN CREAM 30 GM`              | [Cosmapay — كريم 30 جم](https://www.cosmapay.com/products/بيبانثين-كريم)                                                         |
| `GAVISCON DOUBLE ACTION SUSP 150 ML` | [صيدليات العزبي — دبل أكشن 150 مل](https://drahmedelezaby.com/product/جافيسكون-دبل-أكشن-سائل-150-مل/)                            |
| `REDOX VITAMIN C 1000 MG 10 TABS.`   | [Vezeeta — Redox 1000 مجم، 10 أقراص](https://www.vezeeta.com/en-eg/pharmacy/redox-vitamin-c-1000-mg-10-tablets)؛ **ليس Redoxon** |
| `CATAFLAM 50 MG 20 SUGAR C.TABS.`    | [Tdawi — 50 مجم، 20 قرص مغلف بالسكر](https://tdawi.com/en_eg/medicines/cataflam-50-mg-20-tablets)                                |
| `CLARITINE 10MG 20 TAB.`             | [DwaPrices — 10 مجم، 20 قرص](https://dwaprices.com/med.php?id=2702)                                                              |

**حقوق الاستخدام:** قاعدة بيانات الأدوية CC0 **لا تمنح أي ترخيص لصور العبوات** على مواقع الأطراف الأخرى. ذكر المصادر لا يعد إذنًا بإعادة نشر الصور؛ قبل نشر الموقع للاستخدام التجاري أو رفع هذه الصور إلى مستودع عام، احصل على موافقة أصحاب الصور/المصنّعين أو استبدلها بصور تملكها للعبوات المطابقة. الصور الحالية أمثلة محلية للعرض ويجب مراجعة الحقوق وحداثة التغليف قبل الإطلاق. لاستبدال صورة: ضع ملف WebP مرخّصًا في `public/images/medicines/` وحدّث `src/lib/productImages.ts` مع اسم الصنف الكامل والرابط المرجعي. اترك الأصناف غير المتحقق منها دون صورة حقيقية حتى لا تُعرض عبوات مضللة.

## أماكن التعديل السريع

| ما تريد تغييره                                        | الملف                                                                                     |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| رقم واتساب المعروض ورقم صيغة `wa.me` الدولية          | `src/lib/order.ts` (`DISPLAY_PHONE` و`WHATSAPP_NUMBER`)                                   |
| النطاق الأساسي ورابط خرائط جوجل وكود تضمين الخريطة    | `src/config.ts` (مع `index.html` و`public/robots.txt` للنطاق)                             |
| نصوص الصيدلية والعنوان                                | `src/App.tsx` و`scripts/seo.ts` و`index.html`                                             |
| المصدر وملف النسخة المحلية وطريقة تحديثه              | `src/lib/catalog.ts` و`public/data/medicines.json` و`scripts/refresh-medicines.ts`        |
| الصور الثمانية المطابقة ومصادرها وبديل الرسم التوضيحي | `src/lib/productImages.ts` و`public/images/medicines/` و`src/components/ProductImage.tsx` |
| تصميم الصفحة الرئيسية وصفحات SEO                      | `src/styles.css` و`public/seo.css`                                                        |

**التقنيات:** React + TypeScript + Vite. الواجهة عربية RTL ومتجاوبة، ولا يتطلب النشر قاعدة بيانات أو خادمًا خاصًا.
