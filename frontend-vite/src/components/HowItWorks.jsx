import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import './HowItWorks.css';

/* ── SVG Icons ───────────────────────────────────────────────── */
const IconRegister = ({ color }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="hiw-icon-svg">
    <rect x="8" y="6" width="24" height="30" rx="3" stroke={color} strokeWidth="2.5" fill="none"/>
    <line x1="14" y1="16" x2="26" y2="16" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="14" y1="22" x2="26" y2="22" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="14" y1="28" x2="20" y2="28" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="37" cy="33" r="8" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2.5"/>
    <line x1="37" y1="29" x2="37" y2="37" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="33" y1="33" x2="41" y2="33" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const IconPay = ({ color }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="hiw-icon-svg">
    <rect x="4" y="12" width="40" height="26" rx="4" stroke={color} strokeWidth="2.5" fill="none"/>
    <line x1="4" y1="20" x2="44" y2="20" stroke={color} strokeWidth="2.5"/>
    <rect x="10" y="27" width="10" height="5" rx="2" fill={color}/>
    <circle cx="38" cy="10" r="7" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2"/>
    <path d="M38 7v3l2 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconTrade = ({ color }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="hiw-icon-svg">
    <polyline points="4,36 14,24 22,30 34,14 44,20" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <circle cx="14" cy="24" r="3" fill={color}/>
    <circle cx="22" cy="30" r="3" fill={color}/>
    <circle cx="34" cy="14" r="3" fill={color}/>
    <line x1="4" y1="40" x2="44" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    <line x1="4" y1="8" x2="4" y2="40" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

const IconWin = ({ color }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="hiw-icon-svg">
    <path d="M16 6h16v14a8 8 0 0 1-16 0V6z" stroke={color} strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
    <path d="M16 10H8a4 4 0 0 0 4 8h4" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 10h8a4 4 0 0 1-4 8h-4" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="24" y1="28" x2="24" y2="36" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="16" y1="42" x2="32" y2="42" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M20 36h8" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="24" cy="14" r="4" fill={color} fillOpacity="0.25"/>
  </svg>
);

const IconShield = ({ color }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="hiw-feat-icon">
    <path d="M16 3L5 8v8c0 6.6 4.7 12.8 11 14.3C23.3 28.8 28 22.6 28 16V8L16 3z" stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round"/>
    <polyline points="11,16 14,19 21,12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconChart = ({ color }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="hiw-feat-icon">
    <rect x="3" y="18" width="5" height="10" rx="1" fill={color} fillOpacity="0.7"/>
    <rect x="11" y="12" width="5" height="16" rx="1" fill={color} fillOpacity="0.85"/>
    <rect x="19" y="6" width="5" height="22" rx="1" fill={color}/>
    <line x1="2" y1="29" x2="30" y2="29" stroke={color} strokeWidth="1.5" opacity="0.5"/>
  </svg>
);

const IconWallet = ({ color }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="hiw-feat-icon">
    <rect x="2" y="8" width="28" height="18" rx="3" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M2 13h28" stroke={color} strokeWidth="2"/>
    <circle cx="22" cy="20" r="2.5" fill={color}/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
    <polyline points="4,10 8,14 16,6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
/* ──────────────────────────────────────────────────────────────── */

const HowItWorks = () => {
  const { t } = useI18n();
  const [activeStep, setActiveStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  // Intersection Observer for entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Colors matching the platform tiers
  const steps = [
    {
      id: 0,
      Icon: IconRegister,
      color: '#00C853',       // profit green — BASIC
      borderColor: 'rgba(0,200,83,0.35)',
      glowColor: 'rgba(0,200,83,0.12)',
      titleKey: 'howItWorks.step1Title',
      descKey: 'howItWorks.step1Desc',
      noteKey: 'howItWorks.step1Note'
    },
    {
      id: 1,
      Icon: IconPay,
      color: '#3B82F6',       // blue-500 — MEDIUM
      borderColor: 'rgba(59,130,246,0.35)',
      glowColor: 'rgba(59,130,246,0.12)',
      titleKey: 'howItWorks.step2Title',
      descKey: 'howItWorks.step2Desc',
      noteKey: null,
      priceTable: [
        { level: 'Basic',   entry: 12,  pool: 10  },
        { level: 'Medium',  entry: 54,  pool: 50  },
        { level: 'Premium', entry: 107, pool: 100 },
      ]
    },
    {
      id: 2,
      Icon: IconTrade,
      color: '#D4AF37',       // holy gold — PREMIUM
      borderColor: 'rgba(212,175,55,0.35)',
      glowColor: 'rgba(212,175,55,0.12)',
      titleKey: 'howItWorks.step3Title',
      descKey: 'howItWorks.step3Desc',
      noteKey: 'howItWorks.step3Note'
    },
    {
      id: 3,
      Icon: IconWin,
      color: '#D4AF37',       // holy gold — winner
      borderColor: 'rgba(212,175,55,0.45)',
      glowColor: 'rgba(212,175,55,0.18)',
      titleKey: 'howItWorks.step4Title',
      descKey: 'howItWorks.step4Desc',
      noteKey: null
    }
  ];

  const features = [
    { Icon: IconShield, color: '#00C853', titleKey: 'howItWorks.feature1Title', descKey: 'howItWorks.feature1Desc' },
    { Icon: IconChart,  color: '#3B82F6', titleKey: 'howItWorks.feature2Title', descKey: 'howItWorks.feature2Desc' },
    { Icon: IconWallet, color: '#D4AF37', titleKey: 'howItWorks.feature3Title', descKey: 'howItWorks.feature3Desc' }
  ];

  const handleCTA = () => {
    document.getElementById('competitions')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={ref} className={`hiw-section ${visible ? 'hiw-visible' : ''}`}>

      {/* Header */}
      <div className="hiw-header">
        <h2 className="hiw-title">{t('howItWorks.mainTitle')}</h2>
        <p className="hiw-subtitle">{t('howItWorks.mainSubtitle')}</p>
      </div>

      {/* Connector line — desktop */}
      <div className="hiw-connector" aria-hidden="true">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`hiw-connector-dot ${i <= activeStep ? 'hiw-connector-dot--active' : ''}`}
            style={{ '--dot-color': s.color }}
          />
        ))}
      </div>

      {/* Steps */}
      <div className="hiw-steps">
        {steps.map((step, index) => {
          const isActive    = activeStep === step.id;
          const isCompleted = index < activeStep;
          return (
            <button
              key={step.id}
              type="button"
              className={`hiw-card ${isActive ? 'hiw-card--active' : ''} ${isCompleted ? 'hiw-card--completed' : ''}`}
              style={{
                '--card-color':  step.color,
                '--card-border': isActive || isCompleted ? step.borderColor : 'rgba(42,42,42,0.8)',
                '--card-glow':   step.glowColor,
                animationDelay:  `${index * 0.12}s`
              }}
              onClick={() => setActiveStep(step.id)}
              aria-pressed={isActive}
            >
              {/* Step number badge */}
              <div className="hiw-badge" style={{ '--badge-color': step.color }}>
                {isCompleted ? <CheckIcon /> : index + 1}
              </div>

              {/* Icon */}
              <div className="hiw-icon-wrap">
                <step.Icon color={step.color} />
              </div>

              {/* Text */}
              <h3 className="hiw-card-title" style={{ color: isActive || isCompleted ? step.color : '#f1f5f9' }}>
                {t(step.titleKey)}
              </h3>
              <p className="hiw-card-desc">{t(step.descKey)}</p>

              {/* Special note */}
              {step.noteKey && (
                <div className="hiw-note" style={{ '--note-color': step.color }}>
                  <span className="hiw-note-dot" style={{ background: step.color }} />
                  {t(step.noteKey)}
                </div>
              )}

              {/* Pricing breakdown (step 2 only) */}
              {step.priceTable && (
                <div className="hiw-price-table" style={{ '--pt-color': step.color }}>
                  <span className="hiw-price-table-label">{t('howItWorks.step2ExampleLabel')}</span>
                  {step.priceTable.map(row => (
                    <div key={row.level} className="hiw-price-row">
                      <span className="hiw-price-level" style={{ color: step.color }}>{row.level}</span>
                      <span className="hiw-price-entry">${row.entry}</span>
                      <span className="hiw-price-arrow">→</span>
                      <span className="hiw-price-pool">${row.pool} pool</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Feature badges */}
      <div className="hiw-features">
        <p className="hiw-features-label">{t('howItWorks.featuresTitle')}</p>
        <div className="hiw-features-grid">
          {features.map((f, i) => (
            <div key={i} className="hiw-feat" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
              <div className="hiw-feat-icon-wrap" style={{ '--feat-color': f.color }}>
                <f.Icon color={f.color} />
              </div>
              <div>
                <p className="hiw-feat-title" style={{ color: f.color }}>{t(f.titleKey)}</p>
                <p className="hiw-feat-desc">{t(f.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="hiw-cta">
        <Button onClick={handleCTA} className="hiw-cta-btn">
          {t('howItWorks.ctaButton')} →
        </Button>
      </div>

    </section>
  );
};

export default HowItWorks;
