/**
 * MCC Product Functionality Module — native-submit edition
 * Subtotal from allocation, robust plan/variant wiring, wishlist anchoring.
 * We DO NOT post to /cart/add here; Dawn/native product-form handles that.
 */

window.MCCProduct = (function () {
  'use strict';

  /* ------------------------ Config ------------------------ */
  var WISHLIST_ANCHOR_ID = 'mcc-wishlist-anchor';
  var WISHLIST_ANCHOR_SELECTOR = '.product-sidebar .sidebar-content #' + WISHLIST_ANCHOR_ID;
  var WISHLIST_CANDIDATE_SELECTORS = [
    '#wishlisthero-product-page-button-container',
    '[id^="wishlisthero-"][class*="product-page-button-container"]',
    '[class*="wishlisthero"][class*="button-container"]',
    '[data-wishlist][class*="button"]'
  ];

  /* ------------------------ State ------------------------- */
  var state = {
    productId: null,
    sectionId: null,
    selectedVariantId: null,
    quantity: 1,
    isSubscription: false,
    _sellingData: null // from <script id="mcc-selling-data-{{ section.id }}">
  };

  /* ------------------------ Elements ---------------------- */
  var elements = {
    root: null,
    form: null,
    subtotal: null,
    ctaButton: null,
    ctaText: null,
    quantityInput: null,
    variantInputs: [],
    variantSelect: null,
    mainImage: null,
    mobileImage: null
  };

  var wishlistObserver = null;

  /* ------------------------ Utils ------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function shopifyFormat(cents) {
    var mf = (window.Shopify && window.Shopify.money_format) || "${{amount}}";
    if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
      return Shopify.formatMoney(Math.max(0, Math.round(cents)), mf);
    }
    return (Math.max(0, Math.round(cents)) / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  }
  function formatMoney(cents) { return shopifyFormat(cents); }

  function readSellingData(sectionId) {
  // Prefer our MCC blob
  var el = document.getElementById('mcc-selling-data-' + sectionId);
  if (el) { try { return JSON.parse(el.textContent); } catch(e){} }

  // Fallback: Dawn's ProductJson
  el = document.getElementById('ProductJson-' + sectionId) ||
       document.querySelector('script[type="application/json"][data-product-json]') ||
       document.querySelector('script[type="application/json"][id^="ProductJson-"]');
  if (el) { try { return JSON.parse(el.textContent); } catch(e){} }

  return { variants: [] };
}


  function getSelectedVariantData(cache, variantId) {
    if (!cache || !cache.variants) return null;
    for (var i = 0; i < cache.variants.length; i++) {
      if (String(cache.variants[i].id) === String(variantId)) return cache.variants[i];
    }
    return null;
  }

  function findPlanInput(formRoot) {
    var root = formRoot || document;
    return root.querySelector('input[name="selling_plan"]') || root.querySelector('#mcc-selling-plan-input');
  }
  function getSelectedPlanId(formRoot) {
    var inp = findPlanInput(formRoot);
    var val = inp && typeof inp.value === 'string' ? inp.value.trim() : '';
    return val && val !== 'null' ? val : '';
  }

  /* ------------------------ DOM Cache --------------------- */
  function findElements() {
  elements.root = document.querySelector(
    '[data-product-id="' + state.productId + '"][data-section="' + state.sectionId + '"]'
  ) || document;

  elements.form = $('.product-form', elements.root) || document.querySelector('.product-form');

  // Subtotal target: id, data attr, Dawn price container
  elements.subtotal =
      $('#current-subtotal', elements.root) ||
      $('[data-subtotal]', elements.root) ||
      (function(){
        const priceRoot = $('[data-product-price]', elements.root);
        return priceRoot ? priceRoot.querySelector('.current-price, [data-price]') : null;
      })();

  // CTA (optional)
  elements.ctaButton =
      $('#main-cta-button', elements.root) ||
      $('.block-buy-buttons [type="submit"]', elements.root) ||
      $('.product-form [type="submit"]', elements.root) ||
      $('[type="submit"][name="add"]', elements.root);

  elements.ctaText = $('#cart-btn-text', elements.root) || elements.ctaButton;

  elements.quantityInput = $('input[name="quantity"]', elements.form || elements.root);
  elements.variantInputs = $all('input[name="id"]', elements.form || elements.root);
  elements.variantSelect = $('select[name="id"]', elements.form || elements.root);
  elements.mainImage = $('#main-product-image', elements.root);
  elements.mobileImage = $('.product-image-mobile', elements.root);
}


  /* ------------------------ Subtotal ---------------------- */
  function computeSubtotalCents() {
    var cache = state._sellingData;
    var variant = getSelectedVariantData(cache, state.selectedVariantId);
    if (!variant) return 0;

    var qty = Math.max(1, parseInt(state.quantity || 1, 10));
    var planId = getSelectedPlanId(elements.form || document);

    if (planId) {
      var alloc = null;
      if (variant.selling_plan_allocations && variant.selling_plan_allocations.length) {
        for (var i = 0; i < variant.selling_plan_allocations.length; i++) {
          var a = variant.selling_plan_allocations[i];
          if (String(a.selling_plan_id) === String(planId)) { alloc = a; break; }
        }
      }
      var unit = (alloc && typeof alloc.final_price === 'number') ? alloc.final_price : (variant.price || 0);
      return unit * qty;
    }
    return (variant.price || 0) * qty;
  }

  function updatePriceDisplay() {
  var total = computeSubtotalCents();

  // ✅ Always update subtotal when present
  if (elements.subtotal) {
    elements.subtotal.textContent = formatMoney(total);
  }

  // CTA text/state is optional; don't block subtotal
  var subActive = !!getSelectedPlanId(elements.form || document);
  state.isSubscription = subActive;

  if (elements.ctaButton) {
    var target = elements.ctaText && elements.ctaText !== elements.ctaButton
      ? elements.ctaText
      : elements.ctaButton;
    target.textContent = subActive ? 'Subscribe' : 'Add to cart';
    elements.ctaButton.classList.toggle('subscription-mode', subActive);
  }
}


  /* ------------------------ Handlers ---------------------- */
  function handleQuantityChange(delta) {
    if (!elements.quantityInput) return;
    var current = parseInt(elements.quantityInput.value, 10) || 1;
    var next = Math.max(1, current + delta);
    elements.quantityInput.value = next;
    state.quantity = next;
    updatePriceDisplay();
  }

  function handleVariantChange(e) {
    var input = e.target;
    var vId = parseInt(input && input.value, 10);
    if (!vId) return;
    state.selectedVariantId = vId;
    updatePriceDisplay();
    document.dispatchEvent(new CustomEvent('mcc:variant:change', {
      detail: { variantId: state.selectedVariantId }
    }));
  }

  function handleSubscriptionChange() {
    var planId = getSelectedPlanId(elements.form || document);
    state.isSubscription = !!planId;
    updatePriceDisplay();
  }

  /* ---------------- Subscription wiring ------------------- */
  function monitorSubscriptionWidgets() {
    var selectors = [
      'input[name="selling_plan"]',
      'input[name*="subscription"]',
      '.rc-selling-plan input[type="radio"]',
      '.recharge-widget input[type="radio"]'
    ];
    function rebind() {
      selectors.forEach(function (sel) {
        $all(sel).forEach(function (el) {
          el.removeEventListener('change', handleSubscriptionChange);
          el.addEventListener('change', handleSubscriptionChange);
        });
      });
    }
    rebind();
    var obs = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if ((muts[i].addedNodes && muts[i].addedNodes.length) || (muts[i].removedNodes && muts[i].removedNodes.length)) {
          setTimeout(function(){ rebind(); handleSubscriptionChange(); }, 200);
          break;
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    handleSubscriptionChange();
  }

  /* ---------------- Wishlist anchoring -------------------- */
  function getWishlistAnchor() {
    return document.querySelector(WISHLIST_ANCHOR_SELECTOR) || document.getElementById(WISHLIST_ANCHOR_ID);
  }
  function getInjectedWishlistNode() {
    for (var i = 0; i < WISHLIST_CANDIDATE_SELECTORS.length; i++) {
      var node = document.querySelector(WISHLIST_CANDIDATE_SELECTORS[i]);
      if (node) return node;
    }
    return null;
  }
  function moveWishlistIntoAnchor() {
    var anchor = getWishlistAnchor();
    var injected = getInjectedWishlistNode();
    if (anchor && injected && !anchor.contains(injected)) {
      anchor.appendChild(injected);
    }
  }
  function startWishlistEnforcement() {
    moveWishlistIntoAnchor();
    if (wishlistObserver) wishlistObserver.disconnect();
    wishlistObserver = new MutationObserver(moveWishlistIntoAnchor);
    wishlistObserver.observe(document.body, { childList: true, subtree: true });

    [250, 750, 1500].forEach(function (t) { setTimeout(moveWishlistIntoAnchor, t); });
    document.addEventListener('shopify:section:load', moveWishlistIntoAnchor);
    document.addEventListener('shopify:section:select', moveWishlistIntoAnchor);
  }

  /* ------------------------ Bind UI ----------------------- */
  function bindEvents() {
    // Qty buttons (delegated so custom HTML still works)
    document.addEventListener('click', function (e) {
      if (e.target.matches('.qty-btn[data-action="decrease"]') || (e.target.closest && e.target.closest('.qty-btn[data-action="decrease"]'))) {
        e.preventDefault(); handleQuantityChange(-1);
      }
      if (e.target.matches('.qty-btn[data-action="increase"]') || (e.target.closest && e.target.closest('.qty-btn[data-action="increase"]'))) {
        e.preventDefault(); handleQuantityChange(1);
      }
    });

    if (elements.quantityInput) {
      elements.quantityInput.addEventListener('change', function (e) {
        state.quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
        updatePriceDisplay();
      });
    }

    if (elements.variantInputs && elements.variantInputs.length) {
      elements.variantInputs.forEach(function (input) {
        input.addEventListener('change', handleVariantChange);
      });
    }

    if (elements.variantSelect) {
      elements.variantSelect.addEventListener('change', handleVariantChange);
    }

    document.addEventListener('variant:change', function (evt) {
      var id = evt && evt.detail && evt.detail.variant && evt.detail.variant.id;
      if (id) {
        state.selectedVariantId = parseInt(id, 10);
        updatePriceDisplay();
      }
    });

    setTimeout(monitorSubscriptionWidgets, 300);
  }

  /* ------------------ Helpers: initial state --------------- */
  function deriveInitialVariantId() {
    if (elements.variantInputs && elements.variantInputs.length) {
      for (var i = 0; i < elements.variantInputs.length; i++) {
        if (elements.variantInputs[i].checked && elements.variantInputs[i].value) {
          return parseInt(elements.variantInputs[i].value, 10);
        }
      }
    }
    if (elements.variantSelect && elements.variantSelect.value) {
      return parseInt(elements.variantSelect.value, 10);
    }
    return parseInt(state.selectedVariantId || 0, 10);
  }

  function primeSubscriptionState(attemptsLeft) {
    handleSubscriptionChange();
    updatePriceDisplay();
    if (attemptsLeft > 0) {
      setTimeout(function(){ primeSubscriptionState(attemptsLeft - 1); }, 250);
    }
  }

  /* ------------------------ Public API -------------------- */
  return {
    init: function init(config) {
      state.productId = config.productId;
      state.sectionId = config.sectionId;
      state.selectedVariantId = config.selectedVariantId;
      state.quantity = 1;

      state._sellingData = readSellingData(state.sectionId) || { variants: [] };

      findElements();
      state.selectedVariantId = deriveInitialVariantId() || state.selectedVariantId;

      bindEvents();
      startWishlistEnforcement();

      // IMPORTANT: do NOT block native submit; let Dawn/Recharge handle form post.
      // No manual /cart/add here.

      // Launch-time plan detection (covers default "Subscribe" selection)
      primeSubscriptionState(4);

      document.addEventListener('shopify:section:load', function (e) {
        if (!e || !e.detail || !e.detail.sectionId) return;
        if (String(e.detail.sectionId) === String(state.sectionId)) {
          setTimeout(function(){ handleSubscriptionChange(); updatePriceDisplay(); }, 200);
        }
      });
    },

    switchMainImage: function (src, alt) {
      if (elements.mainImage) { elements.mainImage.src = src; elements.mainImage.alt = alt || ''; }
      if (elements.mobileImage) { elements.mobileImage.src = src; elements.mobileImage.alt = alt || ''; }
    },

    cycleHeroImage: function (event, sectionId) {
      event.preventDefault();
      event.stopPropagation();
      const heroGallery = event.currentTarget.closest('[data-gallery-hero]');
      if (!heroGallery) return;
      
      const dataEl = heroGallery.querySelector(`[data-hero-images="${sectionId}"]`);
      if (!dataEl) return;
      
      try {
        const images = JSON.parse(dataEl.textContent);
        if (images.length <= 1) return;
        
        const imgEl = heroGallery.querySelector('img[data-hero-index]');
        if (!imgEl) return;
        
        const currentIndex = parseInt(imgEl.getAttribute('data-hero-index') || '0', 10);
        const nextIndex = (currentIndex + 1) % images.length;
        const nextImage = images[nextIndex];
        
        // Update image
        const isMobile = window.matchMedia('(max-width: 749px)').matches;
        imgEl.src = isMobile && nextImage.mobile_src ? nextImage.mobile_src : nextImage.src;
        imgEl.alt = nextImage.alt || '';
        imgEl.setAttribute('data-hero-index', nextIndex);
        
        // Update picture source if exists
        const picture = imgEl.closest('picture');
        if (picture) {
          const source = picture.querySelector('source');
          if (source && nextImage.mobile_src) {
            source.srcset = nextImage.mobile_src;
          }
        }
        
        // Update indicator
        const indicator = heroGallery.querySelector('[data-hero-indicator]');
        if (indicator) {
          const currentSpan = indicator.querySelector('[data-hero-current]');
          if (currentSpan) {
            currentSpan.textContent = nextIndex + 1;
          }
        }
      } catch (e) {
        console.error('[MCC] Error cycling hero image:', e);
      }
    },

    getState: function () { return JSON.parse(JSON.stringify(state)); }
  };
})();

window.MCC = window.MCCProduct;

/* ===== MCC PDP (universal) — fade-up observer ===== */
(() => {
  if (window.MCCRevealObserverInit) return;
  window.MCCRevealObserverInit = true;

  // Only run on product pages with our wrapper
  if (!document.querySelector('.mcc-product')) return;

  const io = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-inview');
        obs.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -10% 0px' });

  function revealScan(root = document) {
    const nodes = root.querySelectorAll('.mcc-product [data-reveal="fade-up"]:not(.is-inview)');
    nodes.forEach((el, i) => {
      // Auto-stagger if not provided inline
      if (!el.style.getPropertyValue('--stagger-index')) {
        el.style.setProperty('--stagger-index', i);
      }
      io.observe(el);
    });
  }

  // Initial + editor reloads
  if (document.readyState !== 'loading') revealScan();
  else document.addEventListener('DOMContentLoaded', revealScan);
  document.addEventListener('shopify:section:load', (e) => revealScan(e.target));

  // Reviews (Judge.me) content arrives later—watch and tag
  const revRoot = document.getElementById('judgeme_product_reviews');
  if (revRoot && 'MutationObserver' in window) {
    const mo = new MutationObserver(() => {
      // Tag new review tiles with data-reveal
      revRoot.querySelectorAll('.jdgm-rev:not([data-reveal])')
        .forEach((el) => el.setAttribute('data-reveal', 'fade-up'));
      revealScan(revRoot);
    });
    mo.observe(revRoot, { childList: true, subtree: true });
  }

  // Re-scan on review pagination / load more
  document.addEventListener('click', (e) => {
    if (e.target.closest('.jdgm-paginate, .jdgm-rev__showmore, .jdgm-load-more')) {
      setTimeout(() => revealScan(document.getElementById('judgeme_product_reviews')), 80);
    }
  });
})();


/* ===== MCC — Variant Picker compatibility (no <script> tags) ===== */
(() => {
  // Be robust when loaded from <head> (no currentScript.closest)
  const root =
    document.querySelector('.product, .product-merch, .product-coffee') ||
    document;

  const el = root.querySelector('.mcc-variant-picker');
  if (!el || el.__mccCompatInit) return;
  el.__mccCompatInit = true;

  const variants = JSON.parse(el.getAttribute('data-variants') || '[]');
  const optGroups = Array.from(el.querySelectorAll('[data-opt-index]'));
  const idRadios = Array.from(el.querySelectorAll('.mcc-variant-id-radio'));

  const findExact = () => {
    const selected = optGroups.map(g => {
      const c = g.querySelector('.mcc-opt-input:checked');
      return c ? c.value : null;
    });
    if (selected.some(v => v == null)) return null;
    return variants.find(v => v.options.every((val, i) => val === selected[i])) || null;
  };

  const refreshDisabling = () => {
    optGroups.forEach((group, idx) => {
      const others = optGroups.map((g, i) =>
        i === idx ? null : (g.querySelector('.mcc-opt-input:checked')?.value ?? null)
      );
      const inputs = group.querySelectorAll('.mcc-opt-input');
      inputs.forEach(input => {
        const candidate = input.value;
        const possible = variants.some(v => {
          if (!v.available) return false;
          if (v.options[idx] !== candidate) return false;
          for (let i = 0; i < others.length; i++) {
            const sel = others[i];
            if (sel != null && v.options[i] !== sel) return false;
          }
          return true;
        });
        input.disabled = !possible;
        const lab = group.querySelector('label[for="' + input.id + '"]');
        if (lab) {
          lab.classList.toggle('is-disabled', !possible);
          // Add accessibility attributes for disabled options
          if (!possible) {
            lab.setAttribute('aria-label', (lab.textContent.trim() || input.value) + ' - Out of stock');
            lab.setAttribute('title', 'Out of stock');
          } else {
            lab.removeAttribute('aria-label');
            lab.removeAttribute('title');
          }
        }
      });
    });
  };

  const syncLegacyId = () => {
    const exact = findExact();
    idRadios.forEach(r => (r.checked = false));
    const atc = el.closest('form')?.querySelector('[type="submit"], button[name="add"]');

    if (exact) {
      const target = el.querySelector('#legacy-variant-' + exact.id);
      if (target) {
        target.checked = true;
        target.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (atc) atc.disabled = !exact.available;
    } else if (atc) {
      atc.disabled = true;
    }
  };

  el.addEventListener('change', e => {
    if (!e.target.classList.contains('mcc-opt-input')) return;
    refreshDisabling();
    syncLegacyId();
  });

  // initial
  refreshDisabling();
  syncLegacyId();

  // Tap tooltip for disabled variant options (mobile)
  let tooltipTimeout = null;
  let currentTooltipTarget = null;

  const handleTap = (e) => {
    const label = e.target.closest('.variant-option');
    if (!label) return;
    
    const input = el.querySelector(`input[type="radio"][id="${label.getAttribute('for')}"]`);
    if (!input || !input.disabled) return;

    // Clear any existing timeout
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      tooltipTimeout = null;
    }

    // Remove tooltip from any previously active element
    if (currentTooltipTarget && currentTooltipTarget !== label) {
      currentTooltipTarget.classList.remove('show-tooltip');
    }

    // Show tooltip on current element
    currentTooltipTarget = label;
    label.classList.add('show-tooltip');

    // Hide tooltip after 1.2 seconds
    tooltipTimeout = setTimeout(() => {
      if (currentTooltipTarget) {
        currentTooltipTarget.classList.remove('show-tooltip');
        currentTooltipTarget = null;
      }
      tooltipTimeout = null;
    }, 1200);
  };

  // Add tap event listeners to disabled variant options
  const setupTapTooltip = () => {
    const disabledLabels = el.querySelectorAll('input[type="radio"][disabled] + .variant-option');
    disabledLabels.forEach(label => {
      // Remove existing listeners if any
      label.removeEventListener('touchend', handleTap);
      // Add tap listener
      label.addEventListener('touchend', handleTap, { passive: true });
    });
  };

  // Setup initially and after variant changes
  setupTapTooltip();
  el.addEventListener('change', () => {
    // Re-setup after variant state changes
    setTimeout(setupTapTooltip, 0);
  });
})();



/* ===== MCC — Mount WishlistHero into #mcc-wishlist-anchor ===== */
(() => {
  const ROOT = document.querySelector('.mcc-product');
  if (!ROOT || ROOT.__mccWishlistInit) return;
  ROOT.__mccWishlistInit = true;

  const ANCHOR_ID = 'mcc-wishlist-anchor';
  const anchor = document.querySelector('.product-sidebar .sidebar-content #' + ANCHOR_ID);
  if (!anchor) return;

  // Candidates WishlistHero typically renders
  const CANDIDATE_SELECTORS = [
    '#wishlisthero-product-page-button-container',
    '[id^="wishlisthero-"][class*="product-page-button-container"]',
    '[class*="wishlisthero"][class*="button-container"]'
  ];

  function findCandidate() {
    for (const sel of CANDIDATE_SELECTORS) {
      const el = document.querySelector(sel);
      if (el && el.querySelector('button, a')) return el;
    }
    return null;
  }

  function mount() {
    const cand = findCandidate();
    if (!cand) return false;
    if (anchor.contains(cand)) return true;
    anchor.innerHTML = '';                // keep it clean
    anchor.appendChild(cand);             // move the widget
    anchor.classList.add('is-mounted');
    return true;
  }

  // Try now…
  if (mount()) return;

  // …otherwise observe until the app injects its button.
  const mo = new MutationObserver(() => {
    if (mount()) mo.disconnect();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();

