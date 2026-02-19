import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import './HowItWorks.css';

const HowItWorks = () => {
  const { t } = useI18n();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 0,
      emoji: '📝',
      titleKey: 'howItWorks.step1Title',
      descriptionKey: 'howItWorks.step1Desc'
    },
    {
      id: 1,
      emoji: '💰',
      titleKey: 'howItWorks.step2Title',
      descriptionKey: 'howItWorks.step2Desc'
    },
    {
      id: 2,
      emoji: '📊',
      titleKey: 'howItWorks.step3Title',
      descriptionKey: 'howItWorks.step3Desc'
    },
    {
      id: 3,
      emoji: '🏆',
      titleKey: 'howItWorks.step4Title',
      descriptionKey: 'howItWorks.step4Desc'
    }
  ];

  const features = [
    {
      icon: '🎯',
      titleKey: 'howItWorks.feature1Title',
      descKey: 'howItWorks.feature1Desc'
    },
    {
      icon: '✅',
      titleKey: 'howItWorks.feature2Title',
      descKey: 'howItWorks.feature2Desc'
    },
    {
      icon: '💎',
      titleKey: 'howItWorks.feature3Title',
      descKey: 'howItWorks.feature3Desc'
    }
  ];

  const handleStepClick = (stepId) => {
    setActiveStep(stepId);
  };

  const handleCTA = () => {
    const competitionsSection = document.getElementById('competitions');
    if (competitionsSection) {
      competitionsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="how-it-works-container">
      {/* HEADER */}
      <div className="how-it-works-header">
        <h2 className="how-it-works-title">{t('howItWorks.mainTitle')}</h2>
        <p className="how-it-works-subtitle">{t('howItWorks.mainSubtitle')}</p>
      </div>

      {/* STEPS */}
      <div className="how-it-works-steps">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`step-card ${activeStep === step.id ? 'active' : ''} ${index <= activeStep ? 'completed' : ''}`}
            onClick={() => handleStepClick(step.id)}
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <div className="step-number">{step.id + 1}</div>
            <div className="step-emoji">{step.emoji}</div>
            <h3 className="step-title">{t(step.titleKey)}</h3>
            <p className="step-description">{t(step.descriptionKey)}</p>
            {index <= activeStep && <div className="step-checkmark">✓</div>}
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <div className="how-it-works-features">
        <h3 className="features-title">{t('howItWorks.featuresTitle')}</h3>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-badge"
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              <span className="feature-icon">{feature.icon}</span>
              <div className="feature-text">
                <p className="feature-title">{t(feature.titleKey)}</p>
                <p className="feature-desc">{t(feature.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="how-it-works-cta">
        <Button
          onClick={handleCTA}
          className="how-it-works-button"
        >
          {t('howItWorks.ctaButton')} →
        </Button>
      </div>
    </div>
  );
};

export default HowItWorks;
