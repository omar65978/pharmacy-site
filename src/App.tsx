import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft, ArrowUpLeft, Check, ChevronLeft, Droplets, ExternalLink, FileText, FlaskConical,
  Grid2X2, HeartPulse, Info, MapPin, Menu, MessageCircle, Minus, Phone, Pill,
  Plus, RefreshCcw, Search, ShieldCheck, ShoppingBag, Sparkles, Stethoscope,
  Thermometer, Trash2, X, type LucideIcon,
} from 'lucide-react';
import fallbackRaw from './data/fallback-medicines.json';
import ProductImage from './components/ProductImage';
import { getProductPhoto, getShowcaseMedicines } from './lib/productImages';
import { medicinePath } from './lib/medicineUrl';
import { MAP_EMBED_URL, MAP_LINK } from './config';
import {
  CATEGORIES, CATEGORY_LABELS, filterMedicines, formatCount, formatPrice,
  getFeatured, loadEgyptianMedicines, processMedicines, rankMedicines, sortMedicines,
  type CategoryId, type Medicine, type SortOrder,
} from './lib/catalog';
import {
  cartOrderMessage, DISPLAY_PHONE, PRESCRIPTION_MESSAGE, readCart, saveCart,
  singleOrderMessage, whatsappLink, type CartLine,
} from './lib/order';

const FALLBACK_MEDICINES = processMedicines(fallbackRaw);
const PAGE_SIZE = 12;
const CONTACT_LINK = whatsappLink('مرحباً، أريد الاستفسار عن دواء من صيدلية الدكتور علي عباس.');
const PRESCRIPTION_LINK = whatsappLink(PRESCRIPTION_MESSAGE);

const categoryIcons: Record<CategoryId, LucideIcon> = {
  all: Grid2X2, pain: Pill, cold: Thermometer, vitamins: Sparkles,
  skin: Droplets, digestive: HeartPulse, antibiotics: FlaskConical,
};

function CategoryIcon({ category, size = 18 }: { category: CategoryId; size?: number }) {
  const Icon = categoryIcons[category];
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

function Logo({ light = false }: { light?: boolean }) {
  const maskId = light ? 'crescent-footer' : 'crescent-header';
  return (
    <a href="#home" className={`brand${light ? ' brand--light' : ''}`} aria-label="صيدلية الدكتور علي عباس — الرئيسية">
      <span className="brand__mark" aria-hidden="true">
        <svg className="brand__moon" viewBox="0 0 48 48" focusable="false">
          <defs><mask id={maskId} x="0" y="0" width="48" height="48" maskUnits="userSpaceOnUse" style={{ maskType: 'luminance' }}>
            <rect width="48" height="48" fill="black" />
            <circle cx="22" cy="26" r="18" fill="white" />
            <circle cx="31" cy="18" r="17" fill="black" />
          </mask></defs>
          <rect width="48" height="48" fill="currentColor" mask={`url(#${maskId})`} />
        </svg>
      </span>
      <span className="brand__type"><strong>صيدلية الدكتور علي عباس</strong><small>قريبين منك.. لصحتك</small></span>
    </a>
  );
}

function ProductCard({ medicine, onAdd, onDetails }: {
  medicine: Medicine;
  onAdd: (medicine: Medicine) => void;
  onDetails: (medicine: Medicine) => void;
}) {
  return (
    <article className="product-card">
      <button className="product-card__art-button" onClick={() => onDetails(medicine)} aria-label={`تفاصيل ${medicine.commercial_name_ar}`}>
        <ProductImage medicine={medicine} />
        <span className="product-card__art-hint">عرض التفاصيل <ChevronLeft size={15} aria-hidden="true" /></span>
      </button>
      <div className="product-card__content">
        <div className="product-card__labels">
          <span>{CATEGORY_LABELS[medicine.category]}</span>
          {medicine.category === 'antibiotics' && <span className="rx-tag">قد يحتاج روشتة</span>}
        </div>
        <button className="product-card__title" onClick={() => onDetails(medicine)}>
          {medicine.commercial_name_ar}
        </button>
        <p className="product-card__en" dir="ltr" title={medicine.commercial_name_en}>{medicine.commercial_name_en}</p>
        <a className="product-card__permalink" href={medicinePath(medicine)}>صفحة الدواء المستقلة <ArrowUpLeft size={14} aria-hidden="true" /></a>
        <p className="product-card__form">{medicine.form}</p>
        <div className="product-card__bottom">
          <div className="product-price"><span>السعر المرجعي</span><strong dir="ltr">{formatPrice(medicine.price_egp)} {medicine.price_egp !== null && <small>ج.م</small>}</strong></div>
          <div className="product-card__actions">
            <button className="button button--add" type="button" onClick={() => onAdd(medicine)} aria-label={`أضف ${medicine.commercial_name_ar} إلى السلة`}>
              <ShoppingBag size={17} aria-hidden="true" /> أضف للسلة
            </button>
            <a className="button button--buy" href={whatsappLink(singleOrderMessage(medicine))} target="_blank" rel="noopener noreferrer" aria-label={`شراء ${medicine.commercial_name_ar} عبر واتساب`}>
              شراء الآن <ArrowUpLeft size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function CartDrawer({ lines, onClose, onQuantity, onRemove, onClear }: {
  lines: CartLine[];
  onClose: () => void;
  onQuantity: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + (line.medicine.price_egp ?? 0) * line.quantity, 0);
  const allPriced = lines.every((line) => line.medicine.price_egp !== null);
  return (
    <div className="overlay-layer">
      <button type="button" className="overlay-backdrop" onClick={onClose} aria-label="إغلاق السلة" />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="سلة المشتريات">
        <div className="cart-drawer__heading">
          <div><span className="section-kicker">طلبك من الصيدلية</span><h2>سلة المشتريات <span>({formatCount(itemCount)})</span></h2></div>
          <button type="button" className="icon-button icon-button--soft" aria-label="إغلاق السلة" onClick={onClose} autoFocus><X size={21} /></button>
        </div>
        {lines.length ? (
          <>
            <div className="cart-drawer__items">
              {lines.map(({ medicine, quantity }) => (
                <div className="cart-item" key={medicine.id}>
                  <div className="cart-item__image"><ProductImage medicine={medicine} compact /></div>
                  <div className="cart-item__body">
                    <h3>{medicine.commercial_name_ar}</h3>
                    <p dir="ltr" title={medicine.commercial_name_en}>{medicine.commercial_name_en}</p>
                    <strong dir="ltr">{formatPrice(medicine.price_egp)} {medicine.price_egp !== null && 'ج.م'}</strong>
                    {!getProductPhoto(medicine.commercial_name_en) && <small className="cart-item__image-note">صورة تعبيرية، وليست صورة حقيقية لهذا الدواء</small>}
                    <div className="cart-item__controls">
                      <div className="quantity-control" aria-label={`كمية ${medicine.commercial_name_ar}`}>
                        <button type="button" onClick={() => onQuantity(medicine.id, -1)} aria-label={`تقليل كمية ${medicine.commercial_name_ar}`}><Minus size={14} /></button>
                        <span>{quantity}</span>
                        <button type="button" onClick={() => onQuantity(medicine.id, 1)} disabled={quantity >= 99} aria-label={`زيادة كمية ${medicine.commercial_name_ar}`}><Plus size={14} /></button>
                      </div>
                      <button className="cart-item__remove" type="button" onClick={() => onRemove(medicine.id)} aria-label={`حذف ${medicine.commercial_name_ar} من السلة`}><Trash2 size={17} /></button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="clear-cart" onClick={onClear}><Trash2 size={15} aria-hidden="true" /> إفراغ السلة</button>
            </div>
            <div className="cart-drawer__checkout">
              <div className="cart-drawer__total"><span>الإجمالي الاسترشادي</span><strong dir="ltr">{formatPrice(total)} ج.م</strong></div>
              <p>{allPriced ? 'السعر النهائي والتوفر يؤكدهما الصيدلي قبل إتمام الطلب.' : 'بعض الأسعار غير متاحة؛ اسأل الصيدلية عن السعر النهائي والتوفر.'}</p>
              <a className="button button--checkout" href={whatsappLink(cartOrderMessage(lines))} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={20} aria-hidden="true" /> اطلب من الصيدلية عبر واتساب <ArrowUpLeft size={18} aria-hidden="true" />
              </a>
            </div>
          </>
        ) : (
          <div className="cart-empty"><div className="cart-empty__icon"><ShoppingBag size={35} strokeWidth={1.5} aria-hidden="true" /></div><h3>السلة لسه فاضية</h3><p>دوّر على الأدوية اللي محتاجها وأضفها هنا، وبعدها ابعت طلبك في رسالة واحدة.</p><button className="button button--primary" type="button" onClick={() => { onClose(); document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }); }}>تصفّح الأدوية <ArrowLeft size={17} aria-hidden="true" /></button></div>
        )}
      </aside>
    </div>
  );
}

function MedicineDetails({ medicine, onAdd, onClose }: {
  medicine: Medicine;
  onAdd: (medicine: Medicine) => void;
  onClose: () => void;
}) {
  const photo = getProductPhoto(medicine.commercial_name_en);
  return (
    <div className="overlay-layer overlay-layer--modal">
      <button className="overlay-backdrop" type="button" aria-label="إغلاق التفاصيل" onClick={onClose} />
      <div className="details-modal" role="dialog" aria-modal="true" aria-label={`تفاصيل ${medicine.commercial_name_ar}`}>
        <button type="button" className="icon-button icon-button--soft details-modal__close" aria-label="إغلاق التفاصيل" onClick={onClose} autoFocus><X size={20} /></button>
        <div className="details-modal__art"><ProductImage medicine={medicine} /></div>
        <div className="details-modal__body">
          <span className="details-modal__category">{CATEGORY_LABELS[medicine.category]}</span>
          <h2>{medicine.commercial_name_ar}</h2>
          <p className="details-modal__en" dir="ltr">{medicine.commercial_name_en}</p>
          <dl className="medicine-facts">
            <div><dt>الشكل الدوائي</dt><dd>{medicine.form}</dd></div>
            <div><dt>المادة الفعالة</dt><dd dir="ltr">{medicine.scientific_name || 'اسأل الصيدلي'}</dd></div>
            <div><dt>الشركة</dt><dd dir="ltr">{medicine.manufacturer || 'غير متاح'}</dd></div>
          </dl>
          <div className="details-modal__price"><span>سعر مرجعي من دليل خارجي</span><strong dir="ltr">{formatPrice(medicine.price_egp)} {medicine.price_egp !== null && 'ج.م'}</strong></div>
          <div className="details-modal__actions"><button className="button button--add" type="button" onClick={() => onAdd(medicine)}><ShoppingBag size={18} aria-hidden="true" /> أضف للسلة</button><a className="button button--buy" href={whatsappLink(singleOrderMessage(medicine))} target="_blank" rel="noopener noreferrer">شراء الآن <ArrowUpLeft size={17} aria-hidden="true" /></a></div>
          <p className="details-modal__note"><Info size={16} aria-hidden="true" /> للتأكد من السعر والتوفر واحتياج الروشتة، تواصل مع الصيدلي.</p>
          <a className="details-modal__permalink" href={medicinePath(medicine)}>افتح صفحة هذا الدواء المستقلة <ArrowUpLeft size={15} aria-hidden="true" /></a>
          {!photo && <p className="details-modal__illustration-note">هذه صورة تعبيرية للشكل الدوائي، وليست صورة حقيقية لهذا الدواء أو عبوته.</p>}
          {photo && <p className="details-modal__photo-source">صورة العبوة مرجعية وقد يختلف الشكل. <a href={photo.sourcePage} target="_blank" rel="noopener noreferrer">مصدر الصورة <ExternalLink size={12} aria-hidden="true" /></a></p>}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [medicines, setMedicines] = useState<Medicine[]>(FALLBACK_MEDICINES);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [retryIndex, setRetryIndex] = useState(0);
  const [cart, setCart] = useState<CartLine[]>(readCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [category, setCategory] = useState<CategoryId>('all');
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<SortOrder>('default');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoadStatus('loading');
    loadEgyptianMedicines(controller.signal)
      .then((loaded) => { if (!controller.signal.aborted) { setMedicines(loaded); setLoadStatus('ready'); } })
      .catch(() => { if (!controller.signal.aborted) setLoadStatus('fallback'); });
    return () => controller.abort();
  }, [retryIndex]);

  useEffect(() => { saveCart(cart); }, [cart]);

  useEffect(() => {
    if (loadStatus !== 'ready') return;
    const catalogById = new Map(medicines.map((m) => [m.id, m]));
    setCart((current) => current.map((line) => ({ ...line, medicine: catalogById.get(line.medicine.id) ?? line.medicine })));
  }, [medicines, loadStatus]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.body.style.overflow = cartOpen || selectedMedicine ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [cartOpen, selectedMedicine]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { setCartOpen(false); setSelectedMedicine(null); setMenuOpen(false); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // The homepage's default order shows only exact-match pack photos; searches and explicit browsing keep all medicines.
  const isFeatured = sort === 'default' && !search.trim() && category === 'all';
  const filtered = useMemo(() => {
    if (isFeatured) return getShowcaseMedicines(medicines);
    const choices = filterMedicines(medicines, deferredSearch, category);
    if (sort === 'default' && deferredSearch.trim()) return rankMedicines(choices, deferredSearch);
    if (sort === 'default') {
      const featured = getFeatured(choices);
      const featuredIds = new Set(featured.map((medicine) => medicine.id));
      return [...featured, ...choices.filter((medicine) => !featuredIds.has(medicine.id))];
    }
    return sortMedicines(choices, sort);
  }, [medicines, deferredSearch, category, isFeatured, sort]);
  const shown = filtered.slice(0, page * PAGE_SIZE);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  function addToCart(medicine: Medicine) {
    setCart((current) => {
      const existing = current.find((line) => line.medicine.id === medicine.id);
      if (existing) return current.map((line) => line.medicine.id === medicine.id
        ? { ...line, medicine, quantity: Math.min(line.quantity + 1, 99) } : line);
      return [...current, { medicine, quantity: 1 }];
    });
    setToast(`اتضاف ${medicine.commercial_name_ar} للسلة`);
  }

  function changeQuantity(id: string, amount: number) {
    setCart((current) => current.flatMap((line) => {
      if (line.medicine.id !== id) return [line];
      const quantity = line.quantity + amount;
      return quantity < 1 ? [] : [{ ...line, quantity: Math.min(quantity, 99) }];
    }));
  }

  function goToCatalog(options?: { query?: string; category?: CategoryId }) {
    setMenuOpen(false);
    setShowAll(true);
    setPage(1);
    if (options?.query !== undefined) {
      setSearch(options.query);
      setCategory('all');
      setSort(options.query.trim() ? 'default' : 'name');
    } else if (options?.category !== undefined) {
      setSearch('');
      setCategory(options.category);
      setSort(options.category === 'all' ? 'name' : 'default');
    } else {
      setSearch('');
      setCategory('all');
      setSort('name'); // "All medicines" must actually show the full catalog, not just the photo showcase.
    }
    requestAnimationFrame(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }));
  }

  function onHeroSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToCatalog({ query: search });
  }

  return (
    <>
      <div id="home" className="site-top">
        <div className="top-strip"><div className="container top-strip__inner"><span><MapPin size={14} aria-hidden="true" /> مقرّنا بعين شمس الغربية، ونستقبل استفسارات التوصيل للمطرية وعرب الحصن</span><a href={CONTACT_LINK} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} aria-hidden="true" /> اسأل الصيدلية على واتساب <ArrowUpLeft size={13} aria-hidden="true" /></a></div></div>
        <header className="site-header"><div className="container site-header__inner">
          <Logo />
          <nav className={`main-nav${menuOpen ? ' main-nav--open' : ''}`} aria-label="القائمة الرئيسية">
            <a href="#home" onClick={() => setMenuOpen(false)}>الرئيسية</a>
            <a href="#catalog" onClick={(event) => { event.preventDefault(); goToCatalog(); }}>الأدوية</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>إزاي تطلب؟</a>
            <a href="#location" onClick={() => setMenuOpen(false)}>مكاننا</a>
            <a href="/delivery-areas/">مناطق التوصيل</a>
          </nav>
          <div className="header-actions">
            <a className="header-contact" href={CONTACT_LINK} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true" /> تواصل معنا</a>
            <button type="button" className="cart-trigger" onClick={() => { setCartOpen(true); setMenuOpen(false); setToast(''); }} aria-label={`فتح سلة المشتريات، ${cartCount} منتجات`}><ShoppingBag size={21} strokeWidth={1.8} aria-hidden="true" /><span>السلة</span><span className="cart-trigger__count">{formatCount(cartCount)}</span></button>
            <button type="button" className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={menuOpen}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
          </div>
        </div></header>
      </div>

      <main>
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero__text">
            <div className="hero__location"><span className="hero__dot" /> صيدلية الدكتور علي عباس <span className="hero__separator" /> عين شمس الغربية، القاهرة</div>
            <h1 id="hero-title">دوّر على دوائك.<br />واحنا هنا نساعدك.</h1>
            <p>في عين شمس الغربية بالقاهرة. ابحث في دليل الأدوية المصري، واسألنا على واتساب عن السعر والتوفر. استفسر عن التوصيل للمطرية وعرب الحصن وعين شمس الغربية.</p>
            <form className="hero-search" onSubmit={onHeroSearch} role="search"><Search size={22} aria-hidden="true" /><input aria-label="ابحث عن دواء" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="اسم الدواء بالعربي أو الإنجليزي..." /><button type="submit">ابحث عن دواء <ArrowLeft size={18} aria-hidden="true" /></button></form>
            <div className="hero__suggestions"><span>بحث سريع:</span>{['بانادول', 'بروفين', 'بيبانثين'].map((term) => <button type="button" key={term} onClick={() => goToCatalog({ query: term })}>{term}</button>)}</div>
            <div className="hero__prescription">
              <div className="hero__prescription-info"><span className="hero__prescription-icon"><FileText size={20} aria-hidden="true" /></span><span><strong>معاك روشتة؟</strong><small>افتح واتساب وأرفق صورتها في المحادثة.</small></span></div>
              <a className="hero__prescription-button" href={PRESCRIPTION_LINK} target="_blank" rel="noopener noreferrer">اطلب الروشتة عبر الواتساب <ArrowUpLeft size={17} aria-hidden="true" /></a>
            </div>
          </div>
          <div className="hero__image"><img src="/images/pharmacy-hero-male.webp" alt="صورة توضيحية لصيدلي داخل صيدلية" fetchPriority="high" /><span className="hero__illustrative">صورة توضيحية</span><div className="hero__image-note"><span className="hero__image-note-icon"><ShieldCheck size={22} strokeWidth={1.7} aria-hidden="true" /></span><span>اسأل الصيدلي عن<br /><strong>السعر والتوفر قبل الطلب</strong></span></div></div>
        </section>

        <div className="container benefits" aria-label="مزايا الطلب"><div className="benefit"><span className="benefit__icon"><Search size={23} strokeWidth={1.7} /></span><div><strong>بحث سهل عن دوائك</strong><small>بالاسم العربي أو الإنجليزي</small></div></div><div className="benefit"><span className="benefit__icon"><ShoppingBag size={23} strokeWidth={1.7} /></span><div><strong>كل طلبك في سلة واحدة</strong><small>أضف الأصناف والعدد اللي تحتاجه</small></div></div><div className="benefit"><span className="benefit__icon"><MessageCircle size={23} strokeWidth={1.7} /></span><div><strong>اطلب برسالة جاهزة</strong><small>مباشرةً على واتساب الصيدلية</small></div></div></div>

        <section id="catalog" className="catalog-section container" aria-labelledby="catalog-title">
          <div className="section-heading"><div><span className="section-kicker">دليل الأدوية المصري</span><h2 id="catalog-title">{isFeatured ? 'أدوية بيبحث عنها ناس كتير' : 'دوّر على اللي تحتاجه'}</h2><p>{isFeatured ? 'الترتيب الافتراضي يعرض الأدوية ذات صور العبوات فقط؛ ابحث أو تصفّح الكل لعرض بقية الدليل.' : 'اختار الفئة المناسبة أو اكتب اسم الدواء للوصول للصنف والعبوة بالضبط.'}</p></div>{isFeatured && <button type="button" className="text-link" onClick={() => goToCatalog()}>عرض كل الأدوية <ArrowLeft size={19} aria-hidden="true" /></button>}</div>

          <div className="category-list" role="group" aria-label="تصفية الأدوية حسب الفئة">{CATEGORIES.map((item) => <button key={item.id} type="button" className={`category-pill${category === item.id && (showAll || item.id !== 'all') && !isFeatured ? ' category-pill--active' : ''}`} onClick={() => { setCategory(item.id); setSearch(''); setPage(1); setShowAll(true); if (item.id === 'all') setSort('name'); }} aria-pressed={category === item.id && (showAll || item.id !== 'all') && !isFeatured}><CategoryIcon category={item.id} />{item.label}</button>)}</div>

          <div className="catalog-toolbar"><div className="catalog-toolbar__search"><Search size={19} aria-hidden="true" /><input type="search" aria-label="ابحث في جميع الأدوية" placeholder="ابحث باسم الدواء أو المادة الفعالة..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); if (event.target.value) { setCategory('all'); setShowAll(true); } }} />{search && <button type="button" aria-label="مسح البحث" onClick={() => { setSearch(''); setPage(1); }}><X size={17} /></button>}</div><div className="catalog-toolbar__right"><span className="catalog-toolbar__count">{isFeatured ? 'أدوية بصور عبوات' : `${formatCount(filtered.length)} نتيجة`}</span><label className="sort-control">ترتيب <select value={sort} onChange={(event) => { setSort(event.target.value as SortOrder); setPage(1); if (event.target.value !== 'default') setShowAll(true); }} aria-label="ترتيب الأدوية"><option value="default">الافتراضي</option><option value="price-asc">الأقل سعرًا</option><option value="price-desc">الأعلى سعرًا</option><option value="name">حسب الاسم</option></select></label></div></div>

          {loadStatus === 'loading' && <div className="source-notice source-notice--loading" role="status"><span className="loading-spinner" /> بنحمّل نسخة دليل الأدوية المصري المرتبطة بصفحات الأصناف. يمكنك تصفّح بعض الأدوية الآن.</div>}
          {loadStatus === 'fallback' && <div className="source-notice source-notice--offline" role="alert"><Info size={18} aria-hidden="true" /><span>تعذّر تحميل نسخة دليل الأدوية على الموقع؛ تظهر نسخة محدودة للتصفّح. جرّب التحديث أو اسأل الصيدلية مباشرة.</span><button type="button" onClick={() => setRetryIndex((n) => n + 1)}><RefreshCcw size={15} aria-hidden="true" /> إعادة المحاولة</button></div>}
          {loadStatus === 'ready' && <div className="source-caption"><Check size={15} aria-hidden="true" /> تم تحميل {formatCount(medicines.length)} صنفًا من دليل الأدوية المصري المفتوح. <a href="https://github.com/karem505/egyptian-drug-database" target="_blank" rel="noopener noreferrer">مصدر البيانات <ExternalLink size={13} aria-hidden="true" /></a></div>}
          {shown.length > 0 && <div className="catalog-image-guidance" role="note"><Info size={17} aria-hidden="true" /><span>الصنف الذي لا تتوفر له صورة عبوة موثوقة يظهر برسم عام حسب شكله الدوائي؛ <strong>الصور المعلّمة «تعبيرية» ليست صورًا حقيقية لهذه الأدوية أو عبواتها.</strong></span></div>}

          {shown.length ? <div className="product-grid">{shown.map((medicine) => <ProductCard key={medicine.id} medicine={medicine} onAdd={addToCart} onDetails={setSelectedMedicine} />)}</div> : <div className="no-results"><span><Search size={27} /></span><h3>مش لاقيين الدواء بالاسم ده</h3><p>جرّب اسمًا تاني أو اكتب جزءًا من الاسم. ولو محتاج مساعدة، اسأل الصيدلية على واتساب.</p><a className="button button--primary" href={whatsappLink(`مرحباً، أبحث عن دواء: ${search || 'أحتاج مساعدة في العثور على دواء'}. هل هو متوفر لديكم وما سعره؟`)} target="_blank" rel="noopener noreferrer">اسأل الصيدلية <MessageCircle size={17} /></a></div>}
          {shown.length < filtered.length && <div className="load-more"><button className="button button--outline" type="button" onClick={() => setPage((n) => n + 1)}>عرض المزيد من الأدوية <ArrowLeft size={17} aria-hidden="true" /></button><span>عرض {formatCount(shown.length)} من {formatCount(filtered.length)}</span></div>}
          {isFeatured && <div className="catalog-explore"><button className="button button--outline" type="button" onClick={() => goToCatalog()}>استكشف كل الأدوية <ArrowLeft size={18} aria-hidden="true" /></button></div>}
          <p className="catalog-index-link">تفضّل التصفح الأبجدي؟ <a href="/directory/">فهرس الأدوية المصرية وروابط الصفحات المستقلة <ArrowUpLeft size={16} aria-hidden="true" /></a></p>
          <div className="catalog-disclaimer"><Info size={18} aria-hidden="true" /><span>صور العبوات المختارة مرجعية وقد يختلف شكلها؛ الرسومات الأخرى تعبيرية وليست صورًا حقيقية لتلك الأدوية. الأسعار استرشادية من قاعدة بيانات خارجية وليست تأكيدًا للتوفر أو السعر النهائي؛ اسأل الصيدلي قبل الشراء، وقد تتطلب بعض الأدوية روشتة.</span></div>
        </section>

        <section id="how-it-works" className="how-section" aria-labelledby="how-title"><div className="container how-section__inner"><div className="how-intro"><span className="section-kicker">طلب واضح من أول خطوة</span><h2 id="how-title">من البحث للطلب،<br />في ٣ خطوات بسيطة.</h2><p>من غير تسجيل حساب ولا خطوات طويلة. اختار دواءك، والباقي رسالة واتساب جاهزة.</p><a href={CONTACT_LINK} target="_blank" rel="noopener noreferrer" className="text-link">عندك سؤال؟ كلّم الصيدلية <ArrowUpLeft size={18} aria-hidden="true" /></a></div><div className="steps"><div className="step"><span className="step__number">١</span><div><h3>دوّر على الدواء</h3><p>ابحث بالاسم العربي أو الإنجليزي، وحدد العبوة اللي تقصدها.</p></div><Search size={23} aria-hidden="true" /></div><div className="step"><span className="step__number">٢</span><div><h3>أضف اللي تحتاجه للسلة</h3><p>اجمع الأدوية وعدّل الكميات بسهولة قبل إرسال الطلب.</p></div><ShoppingBag size={23} aria-hidden="true" /></div><div className="step"><span className="step__number">٣</span><div><h3>ابعت الطلب على واتساب</h3><p>هنكتب لك رسالة بالأدوية والكميات لتسأل الصيدلية عن السعر والتوفر.</p></div><MessageCircle size={23} aria-hidden="true" /></div></div></div></section>

        <section id="location" className="location-section container" aria-labelledby="location-title"><div className="section-heading"><div><span className="section-kicker">العنوان والاتجاهات</span><h2 id="location-title">زورونا في عين شمس الغربية.</h2><p>مكاننا على الخريطة، ولو محتاج تتأكد من دواء قبل الزيارة، ابعت لنا رسالة.</p></div></div><div className="location-layout"><div className="location-info"><div className="location-info__pin"><MapPin size={30} strokeWidth={1.7} aria-hidden="true" /></div><h3>صيدلية الدكتور علي عباس</h3><p>٩١ امتداد شارع المشروع، عين شمس الغربية، القاهرة.</p><div className="location-info__divider" /><span>تواصل مع الصيدلية</span><a className="location-info__phone" href={CONTACT_LINK} target="_blank" rel="noopener noreferrer" dir="ltr"><Phone size={18} aria-hidden="true" /> {DISPLAY_PHONE}</a><div className="location-info__actions"><a className="button button--map" href={MAP_LINK} target="_blank" rel="noopener noreferrer">افتح الاتجاهات <ArrowUpLeft size={18} aria-hidden="true" /></a><a className="location-info__whatsapp" href={CONTACT_LINK} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true" /> اسألنا على واتساب</a></div></div><div className="location-map"><iframe title="موقع صيدلية الدكتور علي عباس على خرائط جوجل" src={MAP_EMBED_URL} width="600" height="450" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /><a href={MAP_LINK} target="_blank" rel="noopener noreferrer">افتح موقع الصيدلية في خرائط جوجل <ArrowUpLeft size={15} aria-hidden="true" /></a></div></div><div className="delivery-teaser"><div><h3>استفسر عن التوصيل لعين شمس الغربية والمطرية وعرب الحصن</h3><p>عنوان الصيدلية الوحيد في عين شمس الغربية؛ المناطق الأخرى مناطق توصيل وليست فروعًا. نؤكد التوفر والسعر وإمكانية التوصيل قبل الطلب.</p></div><a className="button button--outline" href="/delivery-areas/">تفاصيل المناطق والتوصيل <ArrowLeft size={17} aria-hidden="true" /></a></div></section>

        <section className="questions-section container" aria-labelledby="questions-title"><div className="questions-section__intro"><Stethoscope size={24} strokeWidth={1.6} aria-hidden="true" /><h2 id="questions-title">قبل ما تطلب، خليك مطمّن.</h2><p>معلومات بسيطة مهم تعرفها عن الأسعار وطريقة الطلب.</p></div><div className="questions"><details><summary>هل الأسعار الظاهرة نهائية؟ <Plus size={18} aria-hidden="true" /></summary><p>لا. هي أسعار استرشادية من دليل أدوية خارجي وقد تتغير. اسأل الصيدلية على واتساب عن السعر النهائي والتوفر.</p></details><details><summary>هل إضافة دواء للسلة تعني أنه متوفر؟ <Plus size={18} aria-hidden="true" /></summary><p>السلة تجهز رسالة طلب فقط، ولا تعني تأكيد توافر الدواء في الصيدلية. الصيدلي يؤكد لك المتاح عند التواصل.</p></details><details><summary>ماذا عن الأدوية التي تحتاج روشتة؟ <Plus size={18} aria-hidden="true" /></summary><p>بعض الأدوية تُصرف بروشتة طبية. الصيدلية تتحقق من المتطلبات قبل صرف أي دواء، ولا يُعد الدليل نصيحة طبية.</p></details><details><summary>هل لديكم فروع في المطرية أو عرب الحصن؟ <Plus size={18} aria-hidden="true" /></summary><p>لا نعرض فروعًا هناك؛ مقر الصيدلية هو عين شمس الغربية. يمكن الاستفسار عن توصيل الطلب إلى المطرية وعرب الحصن بعد تأكيد السعر والتوفر وتفاصيل التوصيل.</p></details></div></section>
      </main>

      <footer className="site-footer"><div className="container site-footer__top"><div className="site-footer__brand"><Logo light /><p>نخلّي الوصول للدواء والسؤال عنه أسهل، بخطوة واحدة بينك وبين الصيدلية.</p></div><div className="site-footer__links"><h3>روابط مهمة</h3><a href="#home">الرئيسية</a><a href="#catalog" onClick={(event) => { event.preventDefault(); goToCatalog(); }}>تصفّح الأدوية</a><a href="#how-it-works">طريقة الطلب</a><a href="#location">العنوان</a><a href="/delivery-areas/">مناطق التوصيل</a><a href="/directory/">فهرس الأدوية</a></div><div className="site-footer__links"><h3>تواصل معنا</h3><a href={CONTACT_LINK} target="_blank" rel="noopener noreferrer">واتساب: {DISPLAY_PHONE}</a><a href={MAP_LINK} target="_blank" rel="noopener noreferrer">موقع الصيدلية على الخريطة</a><span>عين شمس الغربية، القاهرة</span></div></div><div className="container site-footer__bottom"><span>© {new Date().getFullYear()} صيدلية الدكتور علي عباس</span><span>بيانات الأدوية للاسترشاد فقط. السعر والتوفر يؤكدهما الصيدلي.</span></div></footer>

      {cartOpen && <CartDrawer lines={cart} onClose={() => setCartOpen(false)} onQuantity={changeQuantity} onRemove={(id) => setCart((current) => current.filter((line) => line.medicine.id !== id))} onClear={() => setCart([])} />}
      {selectedMedicine && <MedicineDetails medicine={selectedMedicine} onAdd={addToCart} onClose={() => setSelectedMedicine(null)} />}
      {toast && <div className="toast" role="status" aria-live="polite"><span><Check size={18} aria-hidden="true" /></span><p>{toast}</p><button type="button" onClick={() => { setSelectedMedicine(null); setCartOpen(true); setToast(''); }}>افتح السلة <ChevronLeft size={16} aria-hidden="true" /></button><button type="button" className="toast__close" aria-label="إغلاق الإشعار" onClick={() => setToast('')}><X size={16} /></button></div>}
    </>
  );
}

export default App;
