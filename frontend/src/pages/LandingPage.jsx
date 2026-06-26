import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import styles from './LandingPage.module.css';

const FEATURES = [
  {
    icon: '🚦',
    title: 'Intelligent Routing',
    desc: 'Zero-shot classification instantly identifies leads, complaints, and spam — routing each to the right specialist agent.',
  },
  {
    icon: '🔍',
    title: 'Real-time Research',
    desc: 'The Researcher agent queries the web in real time, giving every reply grounded facts instead of hallucinated details.',
  },
  {
    icon: '✍️',
    title: 'Personalized Drafts',
    desc: 'The Writer crafts hyper-personalized responses using company intelligence and conversation context. Every email feels human.',
  },
  {
    icon: '⚖️',
    title: 'Reflection & Revision',
    desc: 'The Verifier quality-gates every draft. If tone, facts, or CTA fall short, it loops back to the Writer — automatically.',
  },
  {
    icon: '🔒',
    title: 'PII Protection',
    desc: 'Emails, phone numbers, and sensitive data are redacted before ever reaching an LLM. Privacy is built in, not bolted on.',
  },
  {
    icon: '📊',
    title: 'Full Audit Trail',
    desc: 'Every agent decision is logged. See exactly how each email was classified, researched, drafted, and verified.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Paste or Connect',
    desc: 'Drop in an email or connect your Gmail inbox. Beaver processes inbound emails automatically via the poller.',
  },
  {
    num: '02',
    title: 'Pipeline Runs',
    desc: 'Five specialized AI agents collaborate in milliseconds — routing, researching, drafting, verifying, and finalizing.',
  },
  {
    num: '03',
    title: 'Review & Send',
    desc: 'Get a polished, grounded, verified draft instantly. Copy it, edit it, or wire it directly to your email client.',
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Perfect for trying out Beaver Agent.',
    cta: 'Get Started Free',
    ctaLink: '/signup',
    highlight: false,
    features: [
      '50 emails / month',
      'All 5 agents',
      'Web research',
      'Email history (7 days)',
      'Community support',
    ],
    missing: ['Custom API keys', 'Gmail integration', 'Priority processing'],
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    desc: 'For sales teams and power users.',
    cta: 'Start Pro Trial',
    ctaLink: '/signup?plan=pro',
    highlight: true,
    badge: 'Most Popular',
    features: [
      '1,000 emails / month',
      'All 5 agents',
      'Web research',
      'Unlimited history',
      'Custom API keys',
      'Gmail integration',
      'Priority LLMs',
      'Email support',
    ],
    missing: [],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large teams with custom needs.',
    cta: 'Contact Sales',
    ctaLink: 'mailto:sales@beaveragent.com',
    highlight: false,
    features: [
      'Unlimited emails',
      'All Pro features',
      'Team seats & roles',
      'SSO / SAML',
      'On-premise option',
      'Dedicated SLA',
      'Priority support',
    ],
    missing: [],
  },
];

const STATS = [
  { value: '10K+', label: 'Emails Processed' },
  { value: '< 5s', label: 'Avg Pipeline Time' },
  { value: '94%', label: 'Draft Approval Rate' },
  { value: '5', label: 'Specialized Agents' },
];

function AnimatedSection({ children, className }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.page}>
      {/* ── NAV ── */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoEmoji}>🦫</span>
            <span className={styles.logoText}>Beaver Agent</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#how-it-works" className={styles.navLink}>How it Works</a>
            <a href="#pricing" className={styles.navLink}>Pricing</a>
          </div>
          <div className={styles.navActions}>
            <Link to="/app" className={styles.navCta}>Go to Demo</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        {/* Animated grid background */}
        <div className={styles.heroGrid} />
        <div className={styles.heroGlow} />

        <div className={styles.heroContent}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Multi-Agent AI · Powered by Google Gemini
            </div>
            <h1 className={styles.heroTitle}>
              Your Inbox,<br />
              <span className={styles.heroGradient}>Handled by AI</span>
            </h1>
            <p className={styles.heroSub}>
              Beaver Agent reads inbound emails, researches the sender, writes personalized replies,
              and quality-checks every word — all in under 5 seconds.
            </p>
            <div className={styles.heroCtas}>
              <Link to="/app" className={styles.ctaPrimary}>
                Start Demo Now
                <span className={styles.ctaArrow}>→</span>
              </Link>
              <Link to="/app" className={styles.ctaSecondary}>
                Live Demo
              </Link>
            </div>
          </motion.div>

          {/* Pipeline visual */}
          <motion.div
            className={styles.heroPipeline}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            <div className={styles.pipelineCard}>
              <div className={styles.pipelineLabel}>Inbound Email</div>
              <div className={styles.pipelineEmail}>
                <div className={styles.emailLine} />
                <div className={styles.emailLine} style={{ width: '70%' }} />
                <div className={styles.emailLine} style={{ width: '85%' }} />
              </div>
            </div>
            <div className={styles.pipelineFlow}>
              {['🚦', '🔍', '✍️', '⚖️'].map((icon, i) => (
                <motion.div
                  key={i}
                  className={styles.pipelineStep}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                >
                  <div className={styles.pipelineStepIcon}>{icon}</div>
                  {i < 3 && <div className={styles.pipelineConnector} />}
                </motion.div>
              ))}
            </div>
            <div className={`${styles.pipelineCard} ${styles.pipelineCardGreen}`}>
              <div className={styles.pipelineLabel}>✅ Verified Draft</div>
              <div className={styles.pipelineEmail}>
                <div className={styles.emailLine} />
                <div className={styles.emailLine} style={{ width: '90%' }} />
                <div className={styles.emailLine} style={{ width: '60%' }} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats bar */}
        <AnimatedSection className={styles.statsBar}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </AnimatedSection>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className={styles.section}>
        <AnimatedSection>
          <div className={styles.sectionTag}>Features</div>
          <h2 className={styles.sectionTitle}>Five agents. One pipeline. Zero manual work.</h2>
          <p className={styles.sectionSub}>
            Each agent is specialized for its role — never a generalist doing everything poorly.
          </p>
        </AnimatedSection>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <AnimatedSection key={f.title}>
              <motion.div
                className={styles.featureCard}
                whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(91,127,255,0.15)' }}
                transition={{ duration: 0.2 }}
              >
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <AnimatedSection>
            <div className={styles.sectionTag}>How it Works</div>
            <h2 className={styles.sectionTitle}>From inbox to draft in three steps</h2>
          </AnimatedSection>
          <div className={styles.stepsGrid}>
            {STEPS.map((step, i) => (
              <AnimatedSection key={step.num}>
                <div className={styles.stepCard}>
                  <div className={styles.stepNum}>{step.num}</div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className={styles.section}>
        <AnimatedSection>
          <div className={styles.sectionTag}>Pricing</div>
          <h2 className={styles.sectionTitle}>Simple, transparent pricing</h2>
          <p className={styles.sectionSub}>Start free. Upgrade when you're ready.</p>
        </AnimatedSection>
        <div className={styles.pricingGrid}>
          {PLANS.map((plan) => (
            <AnimatedSection key={plan.name}>
              <motion.div
                className={`${styles.pricingCard} ${plan.highlight ? styles.pricingHighlight : ''}`}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {plan.badge && <div className={styles.pricingBadge}>{plan.badge}</div>}
                <div className={styles.planName}>{plan.name}</div>
                <div className={styles.planPrice}>
                  {plan.price}<span className={styles.planPeriod}>{plan.period}</span>
                </div>
                <div className={styles.planDesc}>{plan.desc}</div>
                <Link
                  to={plan.ctaLink}
                  className={`${styles.planCta} ${plan.highlight ? styles.planCtaHighlight : ''}`}
                >
                  {plan.cta}
                </Link>
                <ul className={styles.planFeatures}>
                  {plan.features.map((f) => (
                    <li key={f} className={styles.planFeature}>
                      <span className={styles.featureCheck}>✓</span> {f}
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className={`${styles.planFeature} ${styles.planFeatureMissing}`}>
                      <span className={styles.featureCross}>✗</span> {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className={styles.ctaBanner}>
        <AnimatedSection className={styles.ctaBannerInner}>
          <h2 className={styles.ctaBannerTitle}>Ready to automate your inbox?</h2>
          <p className={styles.ctaBannerSub}>
            Join hundreds of sales teams using Beaver Agent to respond faster and close more deals.
          </p>
          <Link to="/app" className={styles.ctaPrimary}>
            Go to Demo
            <span className={styles.ctaArrow}>→</span>
          </Link>
        </AnimatedSection>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.logoEmoji}>🦫</span>
            <span className={styles.logoText}>Beaver Agent</span>
          </div>
          <div className={styles.footerLinks}>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <Link to="/app">Demo</Link>
            <a href="https://github.com/Harshalzarikar/Beaver-agent" target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <div className={styles.footerCopy}>© 2026 Beaver Agent. Built with LangGraph & FastAPI.</div>
        </div>
      </footer>
    </div>
  );
}
