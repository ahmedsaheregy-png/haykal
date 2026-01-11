// ========================================
// SAWYAN Bank - Investor Portal JavaScript
// Animations, Interactions & Dynamic Data
// ========================================

// ===== DYNAMIC DATA LOADER =====
// DISABLED: This function was overwriting hardcoded HTML values with localStorage data.
// To re-enable, uncomment the function body below.
function loadDynamicData() {
    // Function disabled to preserve static HTML values
    console.log('Dynamic data loading disabled - using static HTML values');
    return;

    /* ORIGINAL CODE - COMMENTED OUT
    try {
        // 1. Get Project ID (most recent or from URL)
        let projectId = new URLSearchParams(window.location.search).get('project');

        if (!projectId) {
            const projects = JSON.parse(localStorage.getItem('funding_app_projects_list') || '[]');
            if (projects.length > 0) {
                // Sort by lastModified descending
                projects.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
                projectId = projects[0].id;
            }
        }

        if (!projectId) {
            console.warn('No project data found. Using default values.');
            return;
        }

        // ... rest of the function ...
    } catch (e) {
        console.error('Error loading dynamic data:', e);
    }
    */
}

function updateText(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = text; // Changed to innerHTML to support styling
        // Re-trigger animation if it exists
        el.removeAttribute('data-target'); // Remove old animation triggers to avoid conflict
    }
}

// ===== SMART NAVIGATION (Hide on Scroll Down, Show on Scroll Up) =====
let lastScrollTop = 0;
let scrollThreshold = 100;
const floatingNav = document.querySelector('.floating-nav');

if (floatingNav) {
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
}

document.addEventListener('DOMContentLoaded', () => {
    loadDynamicData(); // Load data first
    initScrollAnimations();
    initSmoothScroll();
    initNavbarScroll();
    // animateMetrics(); // Optional: Re-enable if we want counters to animate from 0 to new values
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
        '.problem-card, .feature-item, .metric-card, .bridge-point, .lean-column, .flow-step, .summary-box, .bento-card'
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
                // Check if navbar exists before getting offsetHeight
                const navbar = document.querySelector('.navbar');
                const navHeight = navbar ? navbar.offsetHeight : 0;
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
    if (!navbar) return;

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
