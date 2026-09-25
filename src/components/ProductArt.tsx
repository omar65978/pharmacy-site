import type { Medicine, ProductCategory } from '../lib/catalog';

const palettes: Record<ProductCategory, { background: string; accent: string; faint: string }> = {
  pain: { background: '#e9f3ee', accent: '#51977d', faint: '#c9e2d3' },
  cold: { background: '#e7f0f4', accent: '#6595a5', faint: '#c8dee6' },
  vitamins: { background: '#f7f1dd', accent: '#b79b53', faint: '#efe1ab' },
  skin: { background: '#f5eae5', accent: '#b68b75', faint: '#ecd2c3' },
  digestive: { background: '#eaeaf5', accent: '#8886b4', faint: '#d6d4ec' },
  antibiotics: { background: '#eff0ea', accent: '#858f72', faint: '#d9dfd0' },
  other: { background: '#edf1ed', accent: '#829a8c', faint: '#d7e2d9' },
};

/** Generic dosage-form illustrations: never a photograph of this medicine or its packaging. */
export default function ProductArt({ medicine, compact = false }: { medicine: Medicine; compact?: boolean }) {
  const colors = palettes[medicine.category];
  const route = medicine.route.toUpperCase();
  const name = medicine.commercial_name_en.toUpperCase();
  const isDrops = /EYE|OPHTH|DROPS/.test(route) || /EYE DROPS|NASAL DROPS/.test(name);
  const isTopical = /TOPICAL/.test(route) || /CREAM|OINT\.|LOTION|\bGEL\b/.test(name);
  const isLiquid = /ORAL.LIQUID/.test(route) || /SUSP\b|SYRUP/.test(name);

  return (
    <div className={`product-art product-art--illustration${compact ? ' product-art--compact' : ''}`} style={{ backgroundColor: colors.background }} role="img" aria-label={`صورة تعبيرية عامة للشكل الدوائي، ليست صورة حقيقية للدواء ${medicine.commercial_name_ar} أو عبوته`}>
      <svg viewBox="0 0 252 158" focusable="false" aria-hidden="true">
        <circle cx="211" cy="36" r="51" fill={colors.faint} opacity=".42" />
        <circle cx="32" cy="139" r="45" fill="#fff" opacity=".32" />
        <ellipse cx="124" cy="134" rx="86" ry="8" fill="#36564b" opacity=".09" />
        {isDrops ? (
          <g transform="rotate(-8 126 80)">
            <path d="M112 26h28v26h-28z" fill={colors.accent} />
            <rect x="105" y="41" width="42" height="13" rx="4" fill="#f9faf7" />
            <path d="M99 57q0-7 7-7h40q7 0 7 7v68q0 7-7 7h-40q-7 0-7-7z" fill="white" stroke="#dfe8df" strokeWidth="2" />
            <rect x="103" y="72" width="46" height="42" rx="3" fill={colors.faint} />
            <path d="M126 81v22m-11-11h22" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" />
            <path d="M115 25V16q0-7 11-7t11 7v9" fill={colors.accent} />
          </g>
        ) : isTopical ? (
          <g transform="rotate(-12 126 78)">
            <path d="M95 33h62l-8 90H103z" fill="white" stroke="#dfe8df" strokeWidth="2" />
            <path d="M98 37h56l-3 21h-50z" fill={colors.accent} />
            <rect x="102" y="103" width="48" height="16" rx="3" fill={colors.faint} />
            <rect x="105" y="119" width="42" height="12" rx="2" fill="#f8f8f4" stroke="#dfe8df" />
            <path d="M113 76h29m-29 8h20" stroke={colors.faint} strokeWidth="4" strokeLinecap="round" />
            <path d="M126 63v13m-6-6.5h12" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : isLiquid ? (
          <g transform="rotate(-6 126 83)">
            <rect x="105" y="17" width="43" height="24" rx="4" fill={colors.accent} />
            <path d="M109 40h35l8 14v69q0 9-9 9h-34q-9 0-9-9V54z" fill="white" stroke="#dfe8df" strokeWidth="2" />
            <rect x="102" y="62" width="48" height="48" rx="3" fill={colors.faint} />
            <path d="M126 72v27m-13-13.5h26" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />
            <path d="M111 118h30" stroke="#dce5db" strokeWidth="4" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <g transform="rotate(15 66 104)">
              <rect x="34" y="77" width="63" height="52" rx="5" fill="#f8faf7" stroke="#d5dfd6" strokeWidth="2" />
              {[0, 1, 2].map((col) => [0, 1].map((row) => (
                <circle key={`${col}-${row}`} cx={47 + col * 20} cy={90 + row * 23} r="6.5" fill="white" stroke="#cedad0" strokeWidth="2" />
              )))}
            </g>
            <g transform="rotate(-8 148 75)">
              <rect x="96" y="25" width="109" height="102" rx="5" fill="white" stroke="#dde6dc" strokeWidth="2" />
              <path d="M96 30q0-5 5-5h12v102H96z" fill={colors.accent} />
              <rect x="127" y="51" width="47" height="5" rx="2.5" fill={colors.faint} />
              <rect x="127" y="63" width="63" height="4" rx="2" fill="#e3e9e1" />
              <rect x="127" y="72" width="49" height="4" rx="2" fill="#e3e9e1" />
              <path d="M150 87v23m-11.5-11.5h23" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />
            </g>
          </g>
        )}
      </svg>
      {compact ? (
        <span className="product-art__illustration-badge product-art__illustration-badge--compact" aria-hidden="true">تعبيرية</span>
      ) : (
        <span className="product-art__illustration-badge" aria-hidden="true"><strong>صورة تعبيرية</strong><span>ليست صورة حقيقية لهذا الدواء</span></span>
      )}
    </div>
  );
}
