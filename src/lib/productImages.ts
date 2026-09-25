import { FEATURED_NAMES, getFeatured, type Medicine } from './catalog';

export interface ProductPhoto {
  src: string;
  sourcePage: string;
}

type FeaturedName = (typeof FEATURED_NAMES)[number];

/**
 * Curated pack photos only for these exact catalog labels (drug + strength + pack size).
 * This is not a general image API: a similar name, form, or pack must use an illustration.
 * Source pages document identification, not permission to redistribute; see README.
 */
export const FEATURED_PHOTOS: Record<FeaturedName, ProductPhoto> = {
  'PANADOL EXTRA 24 F.C. TABS.': {
    src: '/images/medicines/panadol-extra-24.webp',
    sourcePage: 'https://egyptdwa.com/m/9565',
  },
  'CONGESTAL 20 TABS.': {
    src: '/images/medicines/congestal-20.webp',
    sourcePage: 'https://reedyph.com/productdetails/28721',
  },
  'BRUFEN 400 MG 30 TABS.': {
    src: '/images/medicines/brufen-400-30.webp',
    sourcePage: 'https://egyptdwa.com/m/1767',
  },
  'BEPANTHEN CREAM 30 GM': {
    src: '/images/medicines/bepanthen-cream-30g.webp',
    sourcePage: 'https://www.cosmapay.com/products/بيبانثين-كريم',
  },
  'GAVISCON DOUBLE ACTION SUSP 150 ML': {
    src: '/images/medicines/gaviscon-double-action-150ml.webp',
    sourcePage: 'https://drahmedelezaby.com/product/جافيسكون-دبل-أكشن-سائل-150-مل/',
  },
  'REDOX VITAMIN C 1000 MG 10 TABS.': {
    src: '/images/medicines/redox-vitamin-c-1000-10.webp',
    sourcePage: 'https://www.vezeeta.com/en-eg/pharmacy/redox-vitamin-c-1000-mg-10-tablets',
  },
  'CATAFLAM 50 MG 20 SUGAR C.TABS.': {
    src: '/images/medicines/cataflam-50-20.webp',
    sourcePage: 'https://tdawi.com/en_eg/medicines/cataflam-50-mg-20-tablets',
  },
  'CLARITINE 10MG 20 TAB.': {
    src: '/images/medicines/claritine-10-20.webp',
    sourcePage: 'https://dwaprices.com/med.php?id=2702',
  },
};

export function getProductPhoto(exactCatalogName: string): ProductPhoto | undefined {
  return Object.hasOwn(FEATURED_PHOTOS, exactCatalogName)
    ? FEATURED_PHOTOS[exactCatalogName as FeaturedName]
    : undefined;
}

/** Only genuinely photographed, exact-match featured packs appear in the default homepage showcase. */
export function getShowcaseMedicines(medicines: Medicine[]): Medicine[] {
  return getFeatured(medicines).filter((medicine) => Boolean(getProductPhoto(medicine.commercial_name_en)));
}
