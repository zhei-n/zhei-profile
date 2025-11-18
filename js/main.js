document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Initialize all features
    loadProjects();
    initScrolling();
    initMobileNav();
    initHybridCarousel();

    // Load and render projects from JSON
    async function loadProjects() {
        const projectsList = document.getElementById('projects-list');
        if (!projectsList) return;

        try {
            const res = await fetch('data/projects.json');
            if (!res.ok) throw new Error('Network response was not ok');
            const projects = await res.json();
            renderProjects(projects);
        } catch (err) {
            console.error('Failed to load projects:', err);
            projectsList.innerHTML = '<p>Could not load projects at this time.</p>';
        }
    }

    function renderProjects(projects = []) {
        const projectsList = document.getElementById('projects-list');
        if (!projectsList) return;

        projectsList.innerHTML = '';
        projects.forEach((p, i) => {
            const card = document.createElement('article');
            card.className = 'card';
            card.setAttribute('data-visible', 'false');
            card.innerHTML = `
                ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)} screenshot" loading="lazy" />` : ''}
                <div class="card-body">
                    <h3 class="card-title">${escapeHtml(p.title)}</h3>
                    <p class="card-desc">${escapeHtml(p.description)}</p>
                    <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
                    <div class="card-links">
                        ${p.demo ? `<a class="btn-link btn-primary" href="${escapeHtml(p.demo)}" target="_blank" rel="noopener noreferrer">Live demo</a>` : ''}
                        ${p.repo ? `<a class="btn-link" href="${escapeHtml(p.repo)}" target="_blank" rel="noopener noreferrer">Source</a>` : ''}
                    </div>
                </div>
            `;
            projectsList.appendChild(card);
            // Staggered reveal animation
            setTimeout(() => card.setAttribute('data-visible', 'true'), 120 * i + 80);
        });
    }

    // Escape HTML to prevent XSS
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Smooth scrolling with header offset
    function initScrolling() {
        const header = document.querySelector('.site-header');
        const headerHeight = () => header ? header.offsetHeight : 0;

        // Add 'scrolled' class to header on scroll
        const onScroll = () => {
            if (!header) return;
            header.classList.toggle('scrolled', window.scrollY > 8);
        };
        document.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href');
                if (!href || href === '#') return;
                const target = document.querySelector(href);
                if (!target) return;
                
                e.preventDefault();
                const y = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 12;
                window.scrollTo({ top: y, behavior: 'smooth' });
                history.pushState(null, '', href);
            });
        });
    }

    // Mobile navigation menu
    function initMobileNav() {
        const toggle = document.querySelector('.nav-toggle');
        if (!toggle) return;

        const body = document.body;

        // Create mobile nav overlay
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav';
        const cloneNav = document.querySelector('.main-nav').cloneNode(true);
        mobileNav.appendChild(cloneNav);

        // Close area (click outside to close)
        const closeArea = document.createElement('div');
        closeArea.className = 'close-area';
        mobileNav.appendChild(closeArea);
        
        body.appendChild(mobileNav);

        function open() {
            toggle.setAttribute('aria-expanded', 'true');
            body.classList.add('mobile-open');
        }

        function close() {
            toggle.setAttribute('aria-expanded', 'false');
            body.classList.remove('mobile-open');
        }

        // Toggle on button click
        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            expanded ? close() : open();
        });

        // Close when clicking outside
        closeArea.addEventListener('click', close);

        // Close when clicking nav links
        mobileNav.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', close);
        });
    }

    // Hybrid: CSS marquee on desktop, JS carousel on mobile
    function initHybridCarousel() {
        const marquee = document.querySelector('.accomp-marquee');
        if (!marquee) return;

        let carouselEl = null;
        let carouselTimer = null;
        const mq = window.matchMedia('(max-width:780px)');

        function enableCarousel() {
            if (carouselEl) return; // Already enabled

            // Get first set of images (before duplication)
            const items = Array.from(marquee.querySelectorAll('.marquee-item'));
            const half = items.slice(0, Math.ceil(items.length / 2));

            // Create carousel structure
            carouselEl = document.createElement('div');
            carouselEl.className = 'carousel';

            // Get interval from CSS variable or use default
            let intervalMs = 5000;
            try {
                const cssDur = getComputedStyle(marquee).getPropertyValue('--marquee-duration').trim();
                if (cssDur.endsWith('ms')) intervalMs = parseFloat(cssDur);
                else if (cssDur.endsWith('s')) intervalMs = parseFloat(cssDur) * 1000;
            } catch(e) {}

            carouselEl.setAttribute('data-interval', intervalMs);

            // Build carousel track
            const track = document.createElement('div');
            track.className = 'carousel-track';
            half.forEach(item => {
                const img = item.querySelector('img');
                const slide = document.createElement('div');
                slide.className = 'carousel-slide';
                slide.appendChild(img.cloneNode(true));
                track.appendChild(slide);
            });
            carouselEl.appendChild(track);

            // Add controls
            const prev = document.createElement('button');
            prev.className = 'carousel-prev';
            prev.setAttribute('aria-label', 'Previous');
            prev.textContent = '‹';

            const next = document.createElement('button');
            next.className = 'carousel-next';
            next.setAttribute('aria-label', 'Next');
            next.textContent = '›';

            const dots = document.createElement('div');
            dots.className = 'carousel-dots';

            carouselEl.appendChild(prev);
            carouselEl.appendChild(next);
            carouselEl.appendChild(dots);

            // Hide marquee, show carousel
            marquee.style.display = 'none';
            marquee.parentNode.insertBefore(carouselEl, marquee.nextSibling);

            // Carousel functionality
            const slides = Array.from(track.children);
            let current = 0;

            slides.forEach((s, i) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.setAttribute('aria-label', `Slide ${i + 1}`);
                btn.addEventListener('click', () => {
                    current = i;
                    update();
                    reset();
                });
                dots.appendChild(btn);
            });

            function update() {
                track.style.transform = `translateX(-${current * 100}%)`;
                Array.from(dots.children).forEach((d, i) => {
                    d.classList.toggle('active', i === current);
                });
            }

            function nextSlide() {
                current = (current + 1) % slides.length;
                update();
            }

            function prevSlide() {
                current = (current - 1 + slides.length) % slides.length;
                update();
            }

            prev.addEventListener('click', () => {
                prevSlide();
                reset();
            });

            next.addEventListener('click', () => {
                nextSlide();
                reset();
            });

            function start() {
                stop();
                carouselTimer = setInterval(nextSlide, parseInt(carouselEl.getAttribute('data-interval')) || 5000);
            }

            function stop() {
                if (carouselTimer) {
                    clearInterval(carouselTimer);
                    carouselTimer = null;
                }
            }

            function reset() {
                stop();
                start();
            }

            // Pause on hover/focus
            carouselEl.addEventListener('mouseenter', stop);
            carouselEl.addEventListener('mouseleave', start);
            carouselEl.addEventListener('focusin', stop);
            carouselEl.addEventListener('focusout', start);

            update();
            start();
        }

        function disableCarousel() {
            if (!carouselEl) return;
            
            if (carouselTimer) {
                clearInterval(carouselTimer);
                carouselTimer = null;
            }
            
            carouselEl.remove();
            carouselEl = null;
            marquee.style.display = '';
        }

        function sync() {
            mq.matches ? enableCarousel() : disableCarousel();
        }

        mq.addEventListener('change', sync);
        sync();
    }
});