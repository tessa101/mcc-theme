/* assets/mcc-reviews.js */
(function () {
  // namespace + idempotent guard
  window.MCC = window.MCC || {};
  const API = (window.MCC.Reviews = window.MCC.Reviews || {});
  if (API.__installed) return;
  API.__installed = true;

  // tiny helpers
  const on = (t, fn, o) => window.addEventListener(t, fn, o);
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // feature flags (can be toggled from init options)
  let CFG = {
    hostSel: '#reviews.pdp-reviews',
    disableDesktopPagerOnMobile: true,
    enableMobileMore: true,
    enableWideMark: true,
    enableAnimate: true
  };

  API.init = function init(opts = {}) {
    // merge config
    CFG = Object.assign({}, CFG, opts || {});

    // don’t run until DOM is ready
    if (document.readyState === 'loading') {
      on('DOMContentLoaded', () => boot(CFG));
    } else {
      boot(CFG);
    }
  };

  function boot(cfg) {
    const host = qs(cfg.hostSel);
    if (!host || host.__mccBooted) return;
    host.__mccBooted = true;

    // 1) Hydrate Judge.me if present
    hydrateJudgeMe();

    // 2) Respect “desktop pager off on mobile” flag
    if (cfg.disableDesktopPagerOnMobile) {
      window.__MCC_DISABLE_REVIEWS_PAGER__ = !matchMedia('(min-width: 768px)').matches;
      const mq = matchMedia('(max-width: 767.98px)');
      const apply = () => (window.__MCC_DISABLE_REVIEWS_PAGER__ = mq.matches);
      mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
      apply();
    }

    // 3) Mobile “See more” button (safe, no DOM writes)
    if (cfg.enableMobileMore && matchMedia('(max-width: 767.98px)').matches) {
      initMobileMore(host);
    }

    // 4) Mark long reviews as “wide” on mobile (layout only)
    if (cfg.enableWideMark && matchMedia('(max-width: 767.98px)').matches) {
      initWideMark(host);
    }

    // 5) Lightweight animation when lists change
    if (cfg.enableAnimate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      initAnimate(host);
    }
  }

  /* ----------------- features ----------------- */

  function hydrateJudgeMe() {
    try {
      if (window.jdgm && typeof window.jdgm.initializeWidgets === 'function') {
        window.jdgm.initializeWidgets();
      } else {
        // try again once on mutations (when app injects)
        const mo = new MutationObserver(() => {
          if (window.jdgm && typeof window.jdgm.initializeWidgets === 'function') {
            try { window.jdgm.initializeWidgets(); } catch {}
            mo.disconnect();
          }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
        setTimeout(() => mo.disconnect(), 4000);
      }
    } catch {}
  }

  function initMobileMore(host) {
    const LIST_SEL = '.jdgm-rev-widg__reviews';
    const NEXT_SEL = '.jdgm-paginate__load-more, .jdgm-paginate [rel="next"], .jdgm-paginate a, .jdgm-paginate button';

    const list = () => qs(LIST_SEL, host);
    const jdgmNext = () => qs(NEXT_SEL, host);

    // ensure a single button placed after the widget
    function ensureBtn() {
      let btn = qs('.mcc-mobile-more', host);
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mcc-mobile-more';
        btn.textContent = 'See more reviews';
        const widg = qs('.jdgm-rev-widg', host);
        (widg || host).appendChild(btn);
      }
      return btn;
    }

    function update(btn) {
      const more = !!jdgmNext();
      btn.disabled = !more;
      btn.setAttribute('aria-disabled', String(!more));
      if (!more) btn.textContent = 'All reviews loaded';
    }

    function waitStable(idle = 180, max = 1400) {
      const start = Date.now();
      let last = -1, t;
      return new Promise((res) => {
        (function tick() {
          const n = list() ? list().children.length : 0;
          if (n !== last) { last = n; clearTimeout(t); t = setTimeout(done, idle); }
          if (Date.now() - start > max) return done();
          requestAnimationFrame(tick);
        })();
        function done() { clearTimeout(t); res(); }
      });
    }

    function wire(btn) {
      btn.addEventListener('click', async () => {
        const nx = jdgmNext();
        if (!nx) return update(btn);
        btn.disabled = true;
        btn.textContent = 'Loading…';
        const l = list(); if (!l) return;
        const mo = new MutationObserver(() => { mo.disconnect(); });
        mo.observe(l, { childList: true, subtree: true });
        nx.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await waitStable();
        btn.textContent = 'See more reviews';
        update(btn);
      });
    }

    const boot = () => {
      const btn = ensureBtn();
      update(btn);
      wire(btn);
    };

    if (list()) boot();
    else {
      const w = new MutationObserver(() => { if (list()) { w.disconnect(); boot(); } });
      w.observe(host, { childList: true, subtree: true });
      setTimeout(() => w.disconnect(), 4000);
    }

    // keep button state fresh if JDGM appends more later
    new MutationObserver(() => {
      const btn = qs('.mcc-mobile-more', host);
      if (btn) update(btn);
    }).observe(host, { childList: true, subtree: true });
  }

  function initWideMark(host) {
    const LIST_SEL = '.jdgm-rev-widg__reviews';
    const CARD_SEL = '.jdgm-rev';
    const THRESH = 200;

    const list = () => qs(LIST_SEL, host);
    const markWide = (card) => {
      if (!card || card.classList.contains('mcc-wide')) return;
      const t = qs('.jdgm-rev__title', card)?.textContent || '';
      const b = (qs('.jdgm-rev__body, .jdgm-rev__content', card)?.textContent || '');
      if ((t + ' ' + b).trim().length >= THRESH) card.classList.add('mcc-wide');
    };
    const sweep = () => qsa(CARD_SEL, list() || document).forEach(markWide);

    const boot = () => { if (list()) sweep(); };
    if (list()) boot();
    else {
      const mo = new MutationObserver(() => { if (list()) { sweep(); } });
      mo.observe(host, { childList: true, subtree: true });
      setTimeout(() => mo.disconnect(), 4000);
    }
  }

  function initAnimate(host) {
    const VP_SEL = '.mcc-reviews-viewport';
    const LIST_SEL = '.jdgm-rev-widg__reviews';
    const CARD_SEL = '.jdgm-rev';
    const vp = qs(VP_SEL, host) || host;

    function animate() {
      const list = qs(LIST_SEL, host);
      if (!list) return;
      const cards = qsa(CARD_SEL, list).filter((c) => !c.classList.contains('is-hidden'));
      cards.forEach((c, i) => c.style.setProperty('--i', i));
      vp.classList.remove('is-anim'); void vp.offsetWidth; vp.classList.add('is-anim');
      setTimeout(() => vp.classList.remove('is-anim'), 800);
    }

    const mo = new MutationObserver(() => animate());
    mo.observe(host, { childList: true, subtree: true });
    setTimeout(animate, 500);

    host.addEventListener('click', (e) => {
      if (
        e.target.closest('.mcc-load-next') ||
        e.target.closest('.mcc-load-prev') ||
        e.target.closest('.mcc-mobile-more')
      ) {
        setTimeout(animate, 30);
      }
    });
  }
})();
