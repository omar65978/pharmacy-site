import { describe, expect, it } from 'vitest';
import { toMedicine } from './catalog';
import { cartOrderMessage, singleOrderMessage, whatsappLink, WHATSAPP_NUMBER } from './order';

const first = toMedicine({
  commercial_name_ar: 'بانادول إكسترا', commercial_name_en: 'PANADOL EXTRA 24 F.C. TABS.',
  scientific_name: 'CAFFEINE+PARACETAMOL', manufacturer: 'GSK',
  drug_class: 'MILD ANALGESIC', route: 'ORAL.SOLID', price_egp: 54,
});
const second = toMedicine({
  commercial_name_ar: 'بروفين', commercial_name_en: 'BRUFEN 400 MG 30 TABS.',
  scientific_name: 'IBUPROFEN', manufacturer: 'ABBOTT',
  drug_class: 'NSAID', route: 'ORAL.SOLID', price_egp: 78,
});

describe('WhatsApp ordering', () => {
  it('puts the exact package in the single-product question', () => {
    expect(singleOrderMessage(first)).toContain('أريد هذا الدواء:');
    expect(singleOrderMessage(first)).toContain('PANADOL EXTRA 24 F.C. TABS.');
    expect(singleOrderMessage(first)).toContain('ما سعره؟');
  });
  it('includes every cart item and its quantity in a single message', () => {
    const message = cartOrderMessage([
      { medicine: first, quantity: 2 }, { medicine: second, quantity: 1 },
    ]);
    expect(message).toContain('بانادول إكسترا (PANADOL EXTRA 24 F.C. TABS.) × 2');
    expect(message).toContain('بروفين (BRUFEN 400 MG 30 TABS.) × 1');
    expect(message).toContain('ما سعرها؟');
  });
  it('opens the configured number and safely encodes Arabic text', () => {
    const link = new URL(whatsappLink(singleOrderMessage(first)));
    expect(link.pathname).toBe(`/${WHATSAPP_NUMBER}`);
    expect(link.searchParams.get('text')).toBe(singleOrderMessage(first));
  });
});
