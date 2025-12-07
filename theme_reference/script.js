// ========================================
// SIMPLIFIED SCROLL SYSTEM - Optimized for performance
// ========================================

const prefersReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointerFine = window.matchMedia('(pointer: fine)').matches;
const enableMotion = pointerFine && !prefersReduceMotion && window.innerWidth >= 900;

if (enableMotion) {
  document.documentElement.classList.add('has-animations');
} else {
  document.documentElement.classList.remove('has-animations');
}

// Lightweight scroll tracking for edge pattern opacity and detail
let scrollTicking = false;

function updateEdgeEffects() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
  
  // Update opacity (0.3 to 0.9)
  document.documentElement.style.setProperty('--scroll-opacity', scrollPercent);
  
  // Update detail level (shifts pattern to reveal more/less detail)
  document.documentElement.style.setProperty('--scroll-detail', scrollPercent);
  
  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(updateEdgeEffects);
    scrollTicking = true;
  }
}, { passive: true });

// Initialize on load
updateEdgeEffects();

// Mobile navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const navList = document.getElementById('primary-nav-list');
if (navToggle && navList) {
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navList.classList.toggle('open');
  });
  
  // Close on link click (mobile)
  navList.addEventListener('click', (e) => {
    const target = e.target;
    if (target instanceof Element && target.tagName === 'A') {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (navList.classList.contains('open') && 
        !navList.contains(e.target) && 
        !navToggle.contains(e.target)) {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
  
  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navList.classList.contains('open')) {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });
}

// Unified reveal on scroll with stagger
const animated = document.querySelectorAll('[data-animate]');
if (animated.length) {
  if (!enableMotion || prefersReduceMotion) {
    animated.forEach(el => el.classList.add('visible'));
  } else {
    animated.forEach((el, idx) => {
      const custom = parseFloat(el.dataset.delay || '');
      if (!Number.isNaN(custom)) {
        el.style.setProperty('--delay', `${custom}s`);
      } else {
        const slight = (idx % 6) * 0.04;
        el.style.setProperty('--delay', `${slight}s`);
      }
    });

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Animate stat numbers when they come into view
          const statNumbers = entry.target.querySelectorAll('.stat-number');
          statNumbers.forEach(statEl => {
            const text = statEl.textContent.trim();
            const hasPlus = text.includes('+');
            const hasPercent = text.includes('%');
            const numValue = parseInt(text.replace(/[^0-9]/g, ''));
            
            if (!isNaN(numValue)) {
              let current = 0;
              const duration = 1500; // 1.5 seconds
              const increment = numValue / (duration / 16); // 60fps
              
              const timer = setInterval(() => {
                current += increment;
                if (current >= numValue) {
                  current = numValue;
                  clearInterval(timer);
                }
                
                const displayValue = Math.floor(current);
                statEl.textContent = displayValue + (hasPlus ? '+' : '') + (hasPercent ? '%' : '');
              }, 16);
            }
          });
          
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.05, rootMargin: '0px 0px -80px 0px' });
    animated.forEach(el => io.observe(el));
  }
}

// Staggered reveal for key elements (translate/scale)
const revealables = document.querySelectorAll('[data-reveal]');
if (revealables.length) {
  if (!enableMotion || prefersReduceMotion) {
    revealables.forEach(el => el.classList.add('visible'));
  } else {
    revealables.forEach((el, idx) => {
      const slight = (idx % 10) * 0.05;
      el.style.setProperty('--delay', `${slight}s`);
    });
    const revObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -12% 0px' });
    revealables.forEach(el => revObserver.observe(el));
  }
}

// Section in-view detection for background accents
const sections = document.querySelectorAll('.section');
if (sections.length && enableMotion) {
  const sectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else {
        entry.target.classList.remove('in-view');
      }
    }
  }, { threshold: 0.2 });
  sections.forEach(section => sectionObserver.observe(section));
}

// Auto-hide header on scroll down, show on scroll up
const headerEl = document.querySelector('.site-header');
if (headerEl) {
  let lastY = window.scrollY;
  let ticking = false;
  // initialize top state
  headerEl.classList.toggle('is-top', window.scrollY < 20);
  const update = () => {
    const y = window.scrollY;
    const goingDown = y > lastY && y > 40;
    
    // Close mobile menu when scrolling
    if (navList && navList.classList.contains('open')) {
      navList.classList.remove('open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    }
    
    headerEl.classList.toggle('is-hidden', goingDown);
    headerEl.classList.toggle('is-top', y < 20);
    lastY = y;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

// Subtle parallax for hero background - throttled for performance and scoped to hero only
const heroBg = document.querySelector('.hero-bg');
const heroSection = document.querySelector('.hero');
if (heroBg && heroSection && enableMotion) {
  let frame;
  let lastX = 0;
  let lastY = 0;
  const throttleDelay = 80; // ms
  let lastUpdate = 0;
  
  const onMove = (e) => {
    const now = performance.now();
    if (now - lastUpdate < throttleDelay) return;
    lastUpdate = now;
    
    const rect = heroSection.getBoundingClientRect();
    const mx = (e.clientX - (rect.left + rect.width / 2)) * 0.5;
    const my = (e.clientY - (rect.top + rect.height / 2)) * 0.4;
    
    if (Math.abs(mx - lastX) < 2 && Math.abs(my - lastY) < 2) return;
    lastX = mx;
    lastY = my;
    
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      heroBg.style.setProperty('--mx', `${mx}`);
      heroBg.style.setProperty('--my', `${my}`);
    });
  };
  
  heroSection.addEventListener('mousemove', onMove, { passive: true });
}

// Interactive tilt and glow for key cards (desktop hover devices only)
// Optimized: reduced tilt intensity and throttled updates
(() => {
  const hoverCapable = window.matchMedia('(hover: hover)').matches;
  const tiltTargets = document.querySelectorAll('.feature-card, .advisory-card, .snapshot-media, .final-cta-inner, .security-checklist, .ai-grid .feature-card, .approach-grid .feature-card');

  if (!enableMotion || !hoverCapable || !tiltTargets.length) return;

  tiltTargets.forEach((card) => {
    card.classList.add('tilt-card');
    let raf;
    let lastUpdate = 0;
    const throttleDelay = 32; // ~30fps instead of 60fps
    
    const reset = () => {
      card.style.setProperty('--tiltX', '0deg');
      card.style.setProperty('--tiltY', '0deg');
      card.style.setProperty('--glowX', '50%');
      card.style.setProperty('--glowY', '50%');
      card.classList.remove('is-tilting');
    };

    card.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - lastUpdate < throttleDelay) return;
      lastUpdate = now;
      
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltY = (0.5 - x) * 8; // Reduced from 12 to 8
      const tiltX = (y - 0.5) * 8; // Reduced from 12 to 8
      const glowX = x * 100;
      const glowY = y * 100;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.setProperty('--tiltX', `${tiltY}deg`);
        card.style.setProperty('--tiltY', `${tiltX}deg`);
        card.style.setProperty('--glowX', `${glowX}%`);
        card.style.setProperty('--glowY', `${glowY}%`);
        card.classList.add('is-tilting');
      });
    });

    card.addEventListener('pointerleave', () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(reset);
    });
  });
})();

// Drive edge line scroll positions via rAF for non-resetting, continuous motion
// Optimized: only run when page is visible, using interval instead of rAF
(() => {
  if (!enableMotion) return;

  const doc = document.documentElement;
  let yLeft = 0;
  let yRight = 0;
  let lastTime = performance.now();
  let intervalId = null;
  const speedLeft = 6; // px per second (reduced for performance)
  const speedRight = 16; // px per second (reduced for performance)
  const spritesheetHeight = 1600; // must match SVG height in CSS

  const tick = () => {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    yLeft = (yLeft - speedLeft * dt) % spritesheetHeight;
    yRight = (yRight - speedRight * dt) % spritesheetHeight;
    if (yLeft > 0) yLeft -= spritesheetHeight;
    if (yRight > 0) yRight -= spritesheetHeight;
    doc.style.setProperty('--edge-left-y', `${yLeft}px`);
    doc.style.setProperty('--edge-right-y', `${yRight}px`);
  };

  const start = () => {
    if (intervalId || document.hidden) return;
    lastTime = performance.now();
    intervalId = setInterval(tick, 80); // ~12.5fps
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  start();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });
})();

// Intro overlay tied to scroll and header reveal
(() => {
  const intro = document.querySelector('.intro-overlay');
  const header = document.querySelector('.site-header');
  const hero = document.getElementById('hero');
  if (!intro || !header || !hero) return;

  if (!enableMotion) {
    intro.classList.add('hidden');
    header.classList.add('visible');
    return;
  }

  const html = document.documentElement;
  html.classList.add('intro-sequence', 'intro-lock');

  const update = () => {
    const heroTop = hero.getBoundingClientRect().top + window.scrollY;
    const max = Math.max(heroTop, 1);
    const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
    const fadeFactor = 3.0;
    const nextOpacity = Math.max(0, 1 - progress * fadeFactor);
    intro.style.opacity = String(nextOpacity);
    if (progress >= 0.55) {
      intro.classList.add('hidden');
      html.classList.remove('intro-sequence', 'intro-lock', 'intro-exiting');
    }
    if (progress >= 0.85) {
      header.classList.add('visible');
    } else {
      header.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(update));
  window.addEventListener('load', () => {
    setTimeout(() => {
      html.classList.add('intro-exiting');
      update();
    }, prefersReduceMotion ? 600 : 1000);
  }, { once: true });
})();

// Intro overlay + header reveal + scroll hint + auto-scroll failsafe
(() => {
  const intro = document.querySelector('.intro-overlay');
  const header = document.querySelector('.site-header');
  const hero = document.getElementById('hero');
  const hint = document.querySelector('.scroll-hint');
  if (!intro || !header || !hero) return;

  if (!enableMotion) {
    intro.classList.add('hidden');
    header.classList.add('visible');
    if (hint) hint.classList.add('hidden');
    return;
  }

  const html = document.documentElement;
  html.classList.add('intro-sequence', 'intro-lock');

  let autoScrolled = false;
  let inactivityTimer = null;

  const resetInactivity = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (autoScrolled) return;
      autoScrolled = true;
      hero.scrollIntoView({ behavior: enableMotion ? 'smooth' : 'auto' });
    }, 5000);
  };

  const update = () => {
    const heroTop = hero.getBoundingClientRect().top + window.scrollY;
    const max = Math.max(heroTop, 1);
    const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
    intro.style.opacity = String(1 - progress);
    if (progress >= 0.98) {
      intro.classList.add('hidden');
      html.classList.remove('intro-sequence', 'intro-lock', 'intro-exiting');
    }
    if (progress >= 0.65) {
      header.classList.add('visible');
    } else {
      header.classList.remove('visible');
    }
    if (hint) {
      if (progress > 0.08) hint.classList.add('hidden');
      else hint.classList.remove('hidden');
    }
  };

  window.addEventListener('scroll', () => {
    requestAnimationFrame(update);
    resetInactivity();
  }, { passive: true });
  window.addEventListener('resize', () => requestAnimationFrame(update));
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetInactivity, { passive: true });
  });

  window.addEventListener('load', () => {
    setTimeout(() => {
      html.classList.add('intro-exiting');
      update();
      resetInactivity();
    }, prefersReduceMotion ? 600 : 1000);
  }, { once: true });
})();

// Current year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Contact form validation and Netlify submit handler
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Honeypot check
    const hp = form.querySelector('input[name="company"]');
    if (hp && hp.value) {
      return; // likely a bot
    }

    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const organization = String(formData.get('organization') || '').trim();
    const message = String(formData.get('message') || '').trim();

    let valid = true;
    const setError = (name, text) => {
      const field = form.querySelector(`[name="${name}"]`);
      const error = field && field.closest('.field')?.querySelector('.error');
      if (error) error.textContent = text || '';
    };

    setError('name');
    setError('email');
    setError('message');

    if (!name) { setError('name', 'Please enter your name'); valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('email', 'Enter a valid email'); valid = false; }
    if (!message) { setError('message', 'Tell us a bit more'); valid = false; }

    if (!valid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const original = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.setAttribute('disabled', 'true');
      submitBtn.textContent = 'Sending…';
    }

    const payload = {
      name,
      email,
      organization,
      message,
      newsletter: Boolean(form.querySelector('input[name="newsletter"]')?.checked),
    };

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || 'Request failed');
        }
        const successEl = document.getElementById('contact-success');
        if (successEl) {
          successEl.textContent = 'Thanks for your interest! We will be in touch.';
          successEl.hidden = false;
        }
        form.reset();
      })
      .catch(() => {
        alert('Sorry, there was a problem submitting the form. Please try again.');
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.removeAttribute('disabled');
          submitBtn.textContent = original || 'Send';
        }
      });
  });
}
