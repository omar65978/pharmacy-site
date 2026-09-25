import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { toMedicine } from '../lib/catalog';
import ProductImage from './ProductImage';

const medicine = (name: string) => toMedicine({
  commercial_name_en: name,
  commercial_name_ar: 'بانادول إكسترا',
  scientific_name: 'PARACETAMOL',
  manufacturer: 'GSK',
  drug_class: 'ANALGESIC',
  route: 'ORAL.SOLID',
  price_egp: 54,
});

describe('product image labeling', () => {
  it('labels an unmatched pack as an illustrative image, not a real photo', () => {
    const html = renderToStaticMarkup(createElement(ProductImage, { medicine: medicine('PANADOL EXTRA 48 F.C. TABS.') }));
    expect(html).toContain('صورة تعبيرية');
    expect(html).toContain('ليست صورة حقيقية لهذا الدواء');
    expect(html).toContain('ليست صورة حقيقية للدواء');
    expect(html).not.toContain('<img');
  });

  it('keeps an explicit short label and accessible full description in the cart', () => {
    const html = renderToStaticMarkup(createElement(ProductImage, { medicine: medicine('PANADOL EXTRA 48 F.C. TABS.'), compact: true }));
    expect(html).toContain('>تعبيرية</span>');
    expect(html).toContain('ليست صورة حقيقية للدواء');
  });

  it('uses the pack photo, not the illustrative label, for an exact match', () => {
    const html = renderToStaticMarkup(createElement(ProductImage, { medicine: medicine('PANADOL EXTRA 24 F.C. TABS.') }));
    expect(html).toContain('/images/medicines/panadol-extra-24.webp');
    expect(html).toContain('صورة العبوة');
    expect(html).not.toContain('صورة تعبيرية');
  });
});
