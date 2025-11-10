/* cart-ui-anim.js — works with cart-drawer OR cart-notification */
(function () {
  'use strict';

  // ---- Utilities ----
  const raf = (fn) => requestAnimationFrame(fn);

  function markVisible(el) {
    raf(() => el.classList.add('mcc-visible'));
  }

  // ---- Notification (popup) ----
  function enhanceNotification(el) {
    if (!el || el.dataset.mccAnim === '1') return;
    el.dataset.mccAnim = '1';
    el.classList.add('mcc-anim');

    // Patch Dawn's renderContents so each open animates
    if (typeof el.renderContents === 'function' && !el._mccPatched) {
      const orig = el.renderContents;
      el.renderContents = function (sectionsPayload) {
        const ret = orig.call(this, sectionsPayload);
        markVisible(el);
        return ret;
      };
      el._mccPatched = true;
    } else {
      markVisible(el);
    }

    // Graceful close on overlay / close button
    el.addEventListener('click', (e) => {
      const isOverlay = e.target?.classList?.contains('cart-notification__overlay');
      const isCloser  = e.target?.closest?.('[data-cart-notification-close]');
      if (!isOverlay && !isCloser) return;

      e.preventDefault();
      el.classList.add('mcc-closing');
      el.classList.remove('mcc-visible');

      const done = () => {
        el.removeEventListener('transitionend', done);
        el.classList.remove('mcc-closing');
        try { typeof el.hide === 'function' && el.hide(); } catch (_){}
      };
      el.addEventListener('transitionend', done);
      setTimeout(done, 320);
    }, { passive: false });
  }

  // ---- Drawer ----
  function enhanceDrawer(el) {
    if (!el || el.dataset.mccAnim === '1') return;
    el.dataset.mccAnim = '1';
    el.classList.add('mcc-anim');

    const openDrawer = () => {
      // Themes vary; try methods/attributes/classes in a safe order
      try {
        if (typeof el.open === 'function') el.open();
        else if (typeof el.show === 'function') el.show();
        else el.setAttribute('open', '');
      } catch {}
      el.classList.add('is-open');   // harmless if theme doesn't use it
      markVisible(el);
    };

    const closeDrawer = () => {
      el.classList.add('mcc-closing');
      el.classList.remove('mcc-visible');
      const done = () => {
        el.removeEventListener('transitionend', done);
        el.classList.remove('mcc-closing');
        try {
          if (typeof el.close === 'function') el.close();
          else el.removeAttribute('open');
        } catch {}
        el.classList.remove('is-open');
      };
      el.addEventListener('transitionend', done);
      setTimeout(done, 320);
    };

    // Patch renderContents so every add opens/animates the drawer
    if (typeof el.renderContents === 'function' && !el._mccPatched) {
      const orig = el.renderContents;
      el.renderContents = function (sectionsPayload) {
        const ret = orig.call(this, sectionsPayload);
        openDrawer();
        return ret;
      };
      el._mccPatched = true;
    }

    // DISABLED: Click handlers for cart-drawer - let cart-drawer.js handle all click interactions
    // The cart-drawer.js already handles overlay clicks and close button clicks
    // Adding handlers here causes conflicts and prevents proper functionality
    
    // Only prevent clicks inside drawer from bubbling (but don't handle close logic)
    // Don't block touch events - they're needed for scrolling
    const drawerInner = el.querySelector('.drawer__inner');
    if (drawerInner) {
      drawerInner.addEventListener('click', (e) => {
        // Stop all clicks inside drawer from bubbling to cart-drawer element
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }, true); // Use capture phase to catch early
      
      // Only prevent touchend on interactive elements, not for scrolling
      drawerInner.addEventListener('touchend', (e) => {
        // Only prevent if it's on an interactive element (button, link, etc.)
        if (e.target.closest('button, a, input, select, cart-remove-button, quantity-input')) {
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        // Otherwise, allow touch events for scrolling
      }, true);
    }

    // If contents change (some themes re-render internally), ensure it's visible
    const mo = new MutationObserver(() => markVisible(el));
    mo.observe(el, { childList: true, subtree: true });
  }

  // ---- Scan & watch ----
  function scan() {
    document.querySelectorAll('cart-notification').forEach(enhanceNotification);
    document.querySelectorAll('cart-drawer').forEach(enhanceDrawer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }
  document.addEventListener('shopify:section:load', scan);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
