import { toMedicine, type Medicine, type MedicineRaw } from './catalog';

/** Egyptian number 01020345314 in WhatsApp's international number format. */
export const WHATSAPP_NUMBER = '201020345314';
export const DISPLAY_PHONE = '01020345314';
export const PRESCRIPTION_MESSAGE = 'هل لديكم هذه الروشتة؟';
export const CART_STORAGE_KEY = 'ali-abbas-pharmacy-cart-v1';

export interface CartLine {
  medicine: Medicine;
  quantity: number;
}

export function singleOrderMessage(medicine: Medicine): string {
  return `مرحباً، أريد هذا الدواء:\n${medicine.commercial_name_ar} (${medicine.commercial_name_en})\nما سعره؟ وهل هو متوفر لديكم؟`;
}

export function cartOrderMessage(lines: CartLine[]): string {
  const items = lines.map((line, index) =>
    `${index + 1}. ${line.medicine.commercial_name_ar} (${line.medicine.commercial_name_en}) × ${line.quantity}`,
  ).join('\n');
  return `مرحباً، أريد هذه الأدوية:\n${items}\nما سعرها؟ وهل هي متوفرة لديكم؟`;
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Cart stores only the upstream data fields and quantity, not an entire search index. */
export function saveCart(lines: CartLine[]): void {
  try {
    const minimalLines = lines.map(({ medicine, quantity }) => ({
      medicine: {
        commercial_name_en: medicine.commercial_name_en,
        commercial_name_ar: medicine.commercial_name_ar,
        scientific_name: medicine.scientific_name,
        manufacturer: medicine.manufacturer,
        drug_class: medicine.drug_class,
        route: medicine.route,
        price_egp: medicine.price_egp,
      },
      quantity,
    }));
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(minimalLines));
  } catch {
    // The website still works if a browser blocks local storage.
  }
}

export function readCart(): CartLine[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((line: unknown) => {
      if (!line || typeof line !== 'object') return [];
      const candidate = line as { medicine?: Partial<MedicineRaw>; quantity?: number };
      const m = candidate.medicine;
      if (!m || typeof m.commercial_name_en !== 'string' ||
        typeof m.commercial_name_ar !== 'string' ||
        typeof m.scientific_name !== 'string' ||
        typeof m.manufacturer !== 'string' ||
        typeof m.drug_class !== 'string' ||
        typeof m.route !== 'string' ||
        (typeof m.price_egp !== 'number' && m.price_egp !== null) ||
        !Number.isInteger(candidate.quantity) || candidate.quantity! < 1) return [];
      return [{ medicine: toMedicine(m as MedicineRaw), quantity: Math.min(candidate.quantity!, 99) }];
    });
  } catch {
    return [];
  }
}
