/* =============================================
   CESFAM Belarmina Paredes - app.js
   Accesibilidad + Menú Móvil + Scroll suave
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ──────────────────────────────────────────
    // 1. INYECTAR BARRA DE ACCESIBILIDAD
    // ──────────────────────────────────────────
    const accBar = document.createElement('div');
    accBar.id = 'accessibility-bar';
    accBar.setAttribute('role', 'toolbar');
    accBar.setAttribute('aria-label', 'Opciones de accesibilidad');
    accBar.innerHTML = `
        <span class="label" aria-hidden="true">Accesibilidad:</span>

        <button class="acc-btn" id="acc-decrease" aria-label="Reducir tamaño de texto" title="Reducir texto">
            A<small>-</small>
        </button>
        <button class="acc-btn" id="acc-reset" aria-label="Restablecer tamaño de texto" title="Restablecer texto">
            A
        </button>
        <button class="acc-btn" id="acc-increase" aria-label="Aumentar tamaño de texto" title="Aumentar texto">
            A<sup>+</sup>
        </button>

        <div style="width:1px; background:#475569; height:20px; margin:0 4px;" aria-hidden="true"></div>

        <button class="acc-btn" id="acc-contrast" aria-label="Activar alto contraste" title="Alto contraste" aria-pressed="false">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.41 0 8 3.59 8 8s-3.59 8-8 8z"/>
            </svg>
            Alto Contraste
        </button>
    `;
    document.body.prepend(accBar);
    document.body.classList.add('has-acc-bar');

    // ──────────────────────────────────────────
    // 2. TAMAÑO DE TEXTO
    // ──────────────────────────────────────────
    const FONT_SIZES = [14, 16, 18, 20, 22];
    let fontIndex = FONT_SIZES.indexOf(
        parseInt(localStorage.getItem('cesfam-font-size')) || 16
    );
    if (fontIndex < 0) fontIndex = 1;

    function applyFontSize() {
        document.documentElement.style.setProperty('--base-font-size', FONT_SIZES[fontIndex] + 'px');
        document.documentElement.style.fontSize = FONT_SIZES[fontIndex] + 'px';
        localStorage.setItem('cesfam-font-size', FONT_SIZES[fontIndex]);
    }
    applyFontSize();

    document.getElementById('acc-increase').addEventListener('click', () => {
        if (fontIndex < FONT_SIZES.length - 1) { fontIndex++; applyFontSize(); }
    });
    document.getElementById('acc-decrease').addEventListener('click', () => {
        if (fontIndex > 0) { fontIndex--; applyFontSize(); }
    });
    document.getElementById('acc-reset').addEventListener('click', () => {
        fontIndex = 1; applyFontSize();
    });

    // ──────────────────────────────────────────
    // 3. ALTO CONTRASTE
    // ──────────────────────────────────────────
    const contrastBtn = document.getElementById('acc-contrast');
    let highContrast = localStorage.getItem('cesfam-contrast') === 'true';

    function applyContrast() {
        document.body.classList.toggle('high-contrast', highContrast);
        contrastBtn.classList.toggle('active', highContrast);
        contrastBtn.setAttribute('aria-pressed', highContrast);
        localStorage.setItem('cesfam-contrast', highContrast);
    }
    applyContrast();

    contrastBtn.addEventListener('click', () => {
        highContrast = !highContrast;
        applyContrast();
    });

    // ──────────────────────────────────────────
    // 4. MENÚ MÓVIL
    // ──────────────────────────────────────────
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            const isOpen = !mobileMenu.classList.contains('hidden');
            mobileMenu.classList.toggle('hidden');
            navToggle.setAttribute('aria-expanded', !isOpen);
        });
    }

    // ──────────────────────────────────────────
    // 5. SCROLL SUAVE PARA LINKS INTERNOS
    // ──────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            e.preventDefault();
            if (mobileMenu) mobileMenu.classList.add('hidden');

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 100;
                const offsetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });
    });

});
