document.addEventListener('DOMContentLoaded', async () => {
    const projectsList = document.getElementById('projects-list');

    async function loadComponents(){
        // load header/footer fragments so JS-driven features (nav toggle, year) work
        try{
            const [hRes, fRes] = await Promise.all([
                fetch('components/header.html'),
                fetch('components/footer.html')
            ]);
            if (hRes.ok){
                const headerHtml = await hRes.text();
                const container = document.getElementById('site-header');
                if (container) container.innerHTML = headerHtml;
            }
            if (fRes.ok){
                const footerHtml = await fRes.text();
                const container = document.getElementById('site-footer');
                if (container) container.innerHTML = footerHtml;
            }
        }catch(err){
            console.warn('Could not load components:', err);
        }
    }

    // inject components first so the rest of initialization (year, nav) finds elements
    await loadComponents();

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    async function loadProjects() {
        try {
            const res = await fetch('data/projects.json');
            if (!res.ok) throw new Error('Network response was not ok');
            const projects = await res.json();
            renderProjects(projects);
        } catch (err) {
            console.error('Failed to load projects:', err);
            if (projectsList) projectsList.innerHTML = '<p>Could not load projects at this time.</p>';
        }
    }

    function renderProjects(projects = []) {
        if (!projectsList) return;
        projectsList.innerHTML = '';
            projects.forEach((p, i) => {
                const card = document.createElement('article');
                card.className = 'card';
                card.setAttribute('data-visible', 'false');
                card.innerHTML = `
                    ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)} screenshot" />` : ''}
                    <div class="card-body">
                        <h3 class="card-title">${escapeHtml(p.title)}</h3>
                        <p class="card-desc">${escapeHtml(p.description)}</p>
                        <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
                        <div class="card-links">
                            ${p.demo ? `<a class="btn-link btn-primary" href="${p.demo}" target="_blank" rel="noopener">Live demo</a>` : ''}
                            ${p.repo ? `<a class="btn-link" href="${p.repo}" target="_blank" rel="noopener">Source</a>` : ''}
                        </div>
                    </div>
                `;
                projectsList.appendChild(card);
                // staggered reveal for nicer UX
                setTimeout(()=>{ card.setAttribute('data-visible','true') }, 120 * i + 80);
            });
    }

    // simple HTML escaper to avoid injection from JSON
    function escapeHtml(str){
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    loadProjects();
    initScrolling();
    initHybridCarousel();
    initNeonToggle();

    function initNeonToggle(){
        try{
            const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const btn = document.getElementById('neon-toggle');
            if (!btn) return;

            const saved = localStorage.getItem('neon-enabled');
            let enabled = saved === null ? true : saved === 'true';

            function apply(){
                if (!enabled){
                    document.body.classList.add('neon-disabled');
                    btn.setAttribute('aria-pressed','false');
                    btn.setAttribute('data-enabled','false');
                } else {
                    document.body.classList.remove('neon-disabled');
                    btn.setAttribute('aria-pressed','true');
                    btn.setAttribute('data-enabled','true');
                    // add pulse animation unless prefers-reduced-motion
                    if (!prefersReduced){
                        document.querySelectorAll('.projects-grid .card').forEach(c=>c.classList.add('pulse'));
                    }
                }
            }

            btn.addEventListener('click', ()=>{
                enabled = !enabled;
                localStorage.setItem('neon-enabled', String(enabled));
                // remove pulse class immediately when toggled off
                if (!enabled) document.querySelectorAll('.projects-grid .card').forEach(c=>c.classList.remove('pulse'));
                apply();
            });

            // initial apply
            apply();
        }catch(e){ console.warn('Neon toggle failed to initialize', e); }
    }

    // setup smooth anchor scrolling with header offset and header scrolled state
    function initScrolling(){
        const header = document.querySelector('.site-header');
        const headerHeight = () => header ? header.offsetHeight : 0;

        // toggle scrolled class on header for subtle background change
        const onScroll = () => {
            if (!header) return;
            if (window.scrollY > 8) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        };
        document.addEventListener('scroll', onScroll, {passive:true});
        onScroll();

        // intercept internal anchor links and apply offset scroll
        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href');
                if (!href || href === '#') return;
                const target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();
                const y = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 12;
                window.scrollTo({ top: y, behavior: 'smooth' });
                // update URL without jumping
                history.pushState(null, '', href);
            });
        });
    }

    
    initMobileNav();

    function initMobileNav(){
        const toggle = document.querySelector('.nav-toggle');
        const body = document.body;
        if (!toggle) return;

        // create mobile nav container
        const mobileNav = document.createElement('div');
        mobileNav.className = 'mobile-nav';
        const cloneNav = document.querySelector('.main-nav').cloneNode(true);
        mobileNav.appendChild(cloneNav);
        document.body.appendChild(mobileNav);

        // close area to detect outside clicks
        const closeArea = document.createElement('div');
        closeArea.className = 'close-area';
        mobileNav.appendChild(closeArea);

        function open(){
            toggle.setAttribute('aria-expanded','true');
            body.classList.add('mobile-open');
        }
        function close(){
            toggle.setAttribute('aria-expanded','false');
            body.classList.remove('mobile-open');
        }

        toggle.addEventListener('click', (e)=>{
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            if (expanded) close(); else open();
        });

        closeArea.addEventListener('click', close);

        // close when any mobile nav link clicked
        mobileNav.querySelectorAll('a[href^="#"]').forEach(a=>{
            a.addEventListener('click', ()=>{
                close();
            });
        });
    }

    // Carousel implementation for the accomplishments gallery
    function initAccompCarousel(options = {}){
        const carousel = document.querySelector('.carousel');
        if (!carousel) return;
        const track = carousel.querySelector('.carousel-track');
        const slides = Array.from(track.querySelectorAll('.carousel-slide'));
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        const dotsContainer = carousel.querySelector('.carousel-dots');
        const interval = parseInt(carousel.getAttribute('data-interval')) || options.interval || 3000;

        let current = 0;
        let timer = null;

        // build dots
        slides.forEach((s, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('aria-label', `Slide ${i+1}`);
            btn.addEventListener('click', () => { goTo(i); resetTimer(); });
            dotsContainer.appendChild(btn);
        });

        const dots = Array.from(dotsContainer.children);

        function update(){
            track.style.transform = `translateX(-${current * 100}%)`;
            dots.forEach((d, i) => d.classList.toggle('active', i === current));
        }

        function goTo(i){
            if (i < 0) i = slides.length - 1;
            if (i >= slides.length) i = 0;
            current = i;
            update();
        }

        function next(){ goTo(current + 1); }
        function prev(){ goTo(current - 1); }

        function start(){ stop(); timer = setInterval(next, interval); }
        function stop(){ if (timer) { clearInterval(timer); timer = null; } }
        function resetTimer(){ stop(); start(); }

        // attach controls
        if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetTimer(); });
        if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetTimer(); });

        // pause on hover/focus
        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);
        carousel.addEventListener('focusin', stop);
        carousel.addEventListener('focusout', start);

        // responsive: ensure track width matches slides (handled by CSS flex)
        window.addEventListener('resize', update);

        // init
        update();
        setTimeout(start, 600);
    }

    // Hybrid: CSS marquee on large screens, JS carousel on small screens
    function initHybridCarousel(){
        const marquee = document.querySelector('.accomp-marquee');
        if (!marquee) return;

        let carouselEl = null;
        let carouselTimer = null;

        const mq = window.matchMedia('(max-width:780px)');

        function enableCarousel(){
            if (carouselEl) return; // already
            // collect first set of items (before duplication)
            const items = Array.from(marquee.querySelectorAll('.marquee-item'));
            const half = items.slice(0, Math.ceil(items.length / 2));

            // build carousel element
            carouselEl = document.createElement('div');
            carouselEl.className = 'carousel';
            // Determine interval for carousel from CSS variable --marquee-duration (supports 's' or 'ms')
            let cssDur = '';
            try { cssDur = getComputedStyle(marquee).getPropertyValue('--marquee-duration').trim(); } catch(e){ cssDur = ''; }
            let intervalMs = 5000; // use a friendlier default 5s on mobile
            if (cssDur) {
                // cssDur may be like '20s' or '4000ms'
                if (cssDur.endsWith('ms')) intervalMs = parseFloat(cssDur);
                else if (cssDur.endsWith('s')) intervalMs = parseFloat(cssDur) * 1000;
            }
            const attrInterval = marquee.getAttribute('data-interval');
            const finalInterval = attrInterval ? parseInt(attrInterval, 10) : intervalMs;
            carouselEl.setAttribute('data-interval', finalInterval);

            const track = document.createElement('div'); track.className = 'carousel-track';
            half.forEach(it => {
                const img = it.querySelector('img');
                const slide = document.createElement('div'); slide.className = 'carousel-slide';
                slide.appendChild(img.cloneNode(true));
                track.appendChild(slide);
            });
            carouselEl.appendChild(track);

            const prev = document.createElement('button'); prev.className = 'carousel-prev'; prev.setAttribute('aria-label','Previous'); prev.textContent='‹';
            const next = document.createElement('button'); next.className = 'carousel-next'; next.setAttribute('aria-label','Next'); next.textContent='›';
            const dots = document.createElement('div'); dots.className = 'carousel-dots';
            carouselEl.appendChild(prev); carouselEl.appendChild(next); carouselEl.appendChild(dots);

            marquee.style.display = 'none';
            marquee.parentNode.insertBefore(carouselEl, marquee.nextSibling);

            const slides = Array.from(track.children);
            let current = 0;

            slides.forEach((s,i)=>{
                const b = document.createElement('button'); b.type='button'; b.setAttribute('aria-label',`Slide ${i+1}`);
                b.addEventListener('click', ()=>{ current = i; update(); reset(); });
                dots.appendChild(b);
            });

            function update(){
                track.style.transform = `translateX(-${current * 100}%)`;
                Array.from(dots.children).forEach((d,i)=> d.classList.toggle('active', i===current));
            }

            function nextSlide(){ current = (current + 1) % slides.length; update(); }
            function prevSlide(){ current = (current - 1 + slides.length) % slides.length; update(); }

            prev.addEventListener('click', ()=>{ prevSlide(); reset(); });
            next.addEventListener('click', ()=>{ nextSlide(); reset(); });

            function start(){ stop(); carouselTimer = setInterval(nextSlide, parseInt(carouselEl.getAttribute('data-interval')) || 3000); }
            function stop(){ if (carouselTimer){ clearInterval(carouselTimer); carouselTimer = null; } }
            function reset(){ stop(); start(); }

            carouselEl.addEventListener('mouseenter', stop);
            carouselEl.addEventListener('mouseleave', start);
            carouselEl.addEventListener('focusin', stop);
            carouselEl.addEventListener('focusout', start);

            update(); start();
        }

        function disableCarousel(){
            if (!carouselEl) return;
            // stop timers
            try{ carouselEl.remove(); }catch(e){}
            carouselEl = null;
            if (carouselTimer){ clearInterval(carouselTimer); carouselTimer = null; }
            marquee.style.display = '';
        }

        function sync(){
            if (mq.matches) {
                enableCarousel();
            } else {
                disableCarousel();
            }
        }

        mq.addEventListener('change', sync);
        sync();
    }
});