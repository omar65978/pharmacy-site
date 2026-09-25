import { useState } from 'react';
import type { Medicine } from '../lib/catalog';
import { getProductPhoto } from '../lib/productImages';
import ProductArt from './ProductArt';

/** An exact-match pack photo when available; otherwise a clearly labeled illustration. */
export default function ProductImage({ medicine, compact = false }: { medicine: Medicine; compact?: boolean }) {
  const photo = getProductPhoto(medicine.commercial_name_en);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!photo || failedSrc === photo.src) return <ProductArt medicine={medicine} compact={compact} />;

  return (
    <div className={`product-art product-art--photo${compact ? ' product-art--compact' : ''}`}>
      <img
        src={photo.src}
        alt={`صورة عبوة ${medicine.commercial_name_ar} — ${medicine.commercial_name_en}`}
        loading={compact ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailedSrc(photo.src)}
      />
      {!compact && <span className="product-art__label" aria-hidden="true">صورة العبوة</span>}
    </div>
  );
}
