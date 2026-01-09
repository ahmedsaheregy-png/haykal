// ========================================
// SAWYAN Bank - Investor Portal JavaScript
// Animations & Interactions
// ========================================

// ===== SMART NAVIGATION (Hide on Scroll Down, Show on Scroll Up) =====
let lastScrollTop = 0;
let scrollThreshold = 100;
const floatingNav = document.querySelector('.floating-nav');

window.addEventListener('scroll', function () {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop < scrollThreshold) {
        floatingNav.style.transform = 'translateX(-50%) translateY(0)';
        return;
    }

    if (scrollTop > lastScrollTop) {
        floatingNav.style.transform = 'translateX(-50%) translateY(-120%)';
    } else {
        floatingNav.style.transform = 'translateX(-50%) translateY(0)';
    }

    lastScrollTop = scrollTop;
}, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
    animateMetrics();
    initScrollAnimations();
    initSmoothScroll();
    initNavbarScroll();
});

// ========================================
// Animated Metrics Counter
// ========================================

function animateMetrics() {
    const metrics = document.querySelectorAll('.metric-value[data-target]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                const prefix = el.dataset.prefix || '';
                const suffix = el.dataset.suffix || '';

                animateValue(el, 0, target, 2500, prefix, suffix);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    metrics.forEach(m => observer.observe(m));
}

function animateValue(element, start, end, duration, prefix, suffix) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOut);

        element.textContent = prefix + current.toLocaleString('en-US') + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ========================================
// Scroll Animations
// ========================================

function initScrollAnimations() {
    const elements = document.querySelectorAll(
        '.problem-card, .feature-item, .metric-card, .bridge-point, .lean-column, .flow-step, .summary-box'
    );

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, i * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '-50px' });

    elements.forEach(el => observer.observe(el));
}

// ========================================
// Smooth Scroll
// ========================================

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                window.scrollTo({
                    top: target.offsetTop - navHeight - 20,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========================================
// Navbar Scroll Effect
// ========================================

function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(10, 10, 20, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.4)';
        } else {
            navbar.style.background = 'rgba(10, 10, 20, 0.9)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// ========================================
// Language Switch (placeholder)
// ========================================

document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-switch button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Future: implement language switching
    });
});
