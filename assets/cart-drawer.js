class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    
    // Simple overlay click handler - overlay has pointer-events: none by default
    // We'll enable pointer-events only when drawer is open to detect clicks outside
    const overlay = this.querySelector('#CartDrawer-Overlay');
    if (overlay) {
      const handleOverlayClick = (e) => {
        // Only close if clicking directly on overlay (not inside drawer)
        const drawerInner = this.querySelector('.drawer__inner');
        if (drawerInner && drawerInner.contains(e.target)) {
          // Click is inside drawer - don't close
          return;
        }
        console.log('[Cart Drawer] Overlay clicked - closing drawer');
        e.preventDefault();
        e.stopPropagation();
        this.close();
      };
      overlay.addEventListener('click', handleOverlayClick);
      overlay.addEventListener('touchend', handleOverlayClick);
    }
    
    this.setHeaderCartIconAccessibility();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) {
      console.warn('[Cart Drawer] cart-icon-bubble not found');
      return;
    }

    // Remove existing handlers to avoid duplicates
    const newCartLink = cartLink.cloneNode(true);
    cartLink.parentNode.replaceChild(newCartLink, cartLink);
    const freshCartLink = document.querySelector('#cart-icon-bubble');
    
    // Remove href to prevent navigation
    if (freshCartLink.hasAttribute('href')) {
      freshCartLink.removeAttribute('href');
    }
    
    freshCartLink.setAttribute('role', 'button');
    freshCartLink.setAttribute('aria-haspopup', 'dialog');
    freshCartLink.style.cursor = 'pointer';
    
    freshCartLink.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('[Cart Drawer] Header cart icon clicked');
      this.open(freshCartLink);
    });
    
    freshCartLink.addEventListener('keydown', (event) => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        event.stopPropagation();
        this.open(freshCartLink);
      }
    });
    
    console.log('[Cart Drawer] Cart icon handler attached');
  }

  open(triggeredBy) {
    console.log('[Cart Drawer] open() called, triggeredBy:', triggeredBy);
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    
    // Ensure overlay is visible and clickable (enable pointer-events to detect clicks outside drawer)
    const overlay = this.querySelector('#CartDrawer-Overlay');
    if (overlay) {
      overlay.style.display = 'block';
      overlay.style.setProperty('display', 'block', 'important');
      overlay.style.setProperty('visibility', 'visible', 'important');
      overlay.style.setProperty('opacity', '1', 'important');
      // Enable pointer-events on overlay so we can detect clicks outside drawer
      overlay.setAttribute('data-overlay-clickable', 'true');
    }
    
    // Ensure drawer is visible
    this.style.setProperty('visibility', 'visible', 'important');
    this.style.setProperty('pointer-events', 'auto', 'important');
    this.style.setProperty('opacity', '1', 'important');
    
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add('animate', 'active');
      console.log('[Cart Drawer] Drawer marked as active');
    });

    this.addEventListener(
      'transitionend',
      () => {
        const isEmpty = this.classList.contains('is-empty');
        const containerToTrapFocusOn = isEmpty
          ? this.querySelector('.drawer__inner-empty')
          : (this.querySelector('.drawer__inner') || document.getElementById('CartDrawer') || this);
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        if (containerToTrapFocusOn && focusElement) {
          trapFocus(containerToTrapFocusOn, focusElement);
        } else {
          console.warn('[Cart Drawer] Cannot trap focus - missing container or focus element', {
            isEmpty: isEmpty,
            container: containerToTrapFocusOn,
            focusElement: focusElement,
            hasDrawerInner: !!this.querySelector('.drawer__inner'),
            hasCartDrawer: !!document.getElementById('CartDrawer')
          });
        }
        
        // Ensure cart-drawer-items can scroll even with body overflow-hidden or touch-action: none
        const cartItems = this.querySelector('cart-drawer-items');
        if (cartItems) {
          // Force scrolling styles with !important via setProperty
          cartItems.style.setProperty('overflow', 'auto', 'important');
          cartItems.style.setProperty('overflow-y', 'auto', 'important');
          cartItems.style.setProperty('flex', '1', 'important');
          cartItems.style.setProperty('min-height', '0', 'important');
          cartItems.style.setProperty('height', '100%', 'important');
          cartItems.style.setProperty('max-height', '100%', 'important');
          cartItems.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
          // CRITICAL: Override global touch-action: none from mm-locked class
          cartItems.style.setProperty('touch-action', 'pan-y', 'important');
          cartItems.style.setProperty('pointer-events', 'auto', 'important');
          cartItems.style.setProperty('visibility', 'visible', 'important'); // Ensure it's visible
          console.log('[Cart Drawer] Applied scrolling styles to cart-drawer-items', {
            overflow: cartItems.style.overflow,
            overflowY: cartItems.style.overflowY,
            touchAction: cartItems.style.touchAction,
            visibility: cartItems.style.visibility,
            height: cartItems.style.height
          });
        }
        
        // Also ensure drawer__inner allows scrolling
        const drawerInner = this.querySelector('.drawer__inner');
        if (drawerInner) {
          drawerInner.style.setProperty('overflow', 'visible', 'important');
          drawerInner.style.setProperty('display', 'flex', 'important');
          drawerInner.style.setProperty('flex-direction', 'column', 'important');
          drawerInner.style.setProperty('height', '100%', 'important');
        }
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
  }

  close() {
    console.log('[Cart Drawer] close() called');
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    
    const hideOverlay = () => {
      // Find overlay (it might be recreated, so query each time)
      const overlay = this.querySelector('#CartDrawer-Overlay');
      if (overlay) {
        overlay.style.setProperty('display', 'none', 'important');
        overlay.style.setProperty('visibility', 'hidden', 'important');
        overlay.style.setProperty('opacity', '0', 'important');
        overlay.style.display = 'none';
        overlay.style.visibility = 'hidden';
        overlay.style.opacity = '0';
        // Disable pointer-events on overlay (back to default)
        overlay.removeAttribute('data-overlay-clickable');
      }
    };
    
    // Hide overlay immediately
    hideOverlay();
    
    // Also ensure drawer itself is hidden
    this.style.setProperty('visibility', 'hidden', 'important');
    this.style.setProperty('pointer-events', 'none', 'important');
    this.style.setProperty('opacity', '0', 'important');
    
    // Remove overflow-hidden from both body and html
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.setProperty('overflow', '', 'important');
    document.documentElement.style.setProperty('overflow', '', 'important');
    
    // Watch for overlay recreation and hide it
    const overlayObserver = new MutationObserver(() => {
      if (!this.classList.contains('active')) {
        hideOverlay();
      }
    });
    overlayObserver.observe(this, { childList: true, subtree: true });
    
    // Use setTimeout to ensure overlay stays hidden (in case something tries to show it)
    setTimeout(() => {
      hideOverlay();
      this.style.setProperty('visibility', 'hidden', 'important');
      this.style.setProperty('pointer-events', 'none', 'important');
      this.style.setProperty('opacity', '0', 'important');
    }, 100);
    
    // Also check after a longer delay (mobile might be slower)
    setTimeout(() => {
      hideOverlay();
      this.style.setProperty('visibility', 'hidden', 'important');
      this.style.setProperty('pointer-events', 'none', 'important');
      this.style.setProperty('opacity', '0', 'important');
    }, 500);
    
    const overlay = this.querySelector('#CartDrawer-Overlay');
    console.log('[Cart Drawer] close() completed, overlay display:', overlay?.style.display);
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', (event) => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    // Fixed: empty drawer, delete/quantity controls (with stopImmediatePropagation), scrolling, and gallery scroll restoration
    console.log('[Cart Drawer] renderContents called, item_count:', parsedState.item_count, 'productId:', parsedState.id);
    const inner = this.querySelector('.drawer__inner');
    if (inner && inner.classList.contains('is-empty')) {
      inner.classList.remove('is-empty');
    }
    if (this.classList.contains('is-empty')) {
      this.classList.remove('is-empty');
    }
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) {
        console.warn('[Cart Drawer] Section element not found:', section.id, 'selector:', section.selector);
        return;
      }
      const rawHTML = parsedState.sections[section.id];
      const parsedDoc = new DOMParser().parseFromString(rawHTML, 'text/html');
      
      if (section.id === 'cart-drawer') {
        // For cart-drawer, update the entire .drawer__inner content
        // This ensures proper structure and custom element reinitialization
        const drawerInner = sectionElement.querySelector('.drawer__inner');
        const newDrawerInner = parsedDoc.querySelector('.drawer__inner');
        if (drawerInner && newDrawerInner) {
          // Replace entire inner content - this properly reinitializes custom elements
          drawerInner.innerHTML = newDrawerInner.innerHTML;
          
          // Ensure cart-drawer-items has proper scrolling styles
          const cartItems = drawerInner.querySelector('cart-drawer-items');
          if (cartItems) {
            // Force scrolling styles with !important
            cartItems.style.setProperty('overflow', 'auto', 'important');
            cartItems.style.setProperty('overflow-y', 'auto', 'important');
            cartItems.style.setProperty('flex', '1', 'important');
            cartItems.style.setProperty('min-height', '0', 'important');
            cartItems.style.setProperty('height', '100%', 'important');
            cartItems.style.setProperty('max-height', '100%', 'important');
            cartItems.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
            cartItems.style.setProperty('touch-action', 'pan-y', 'important');
            cartItems.style.setProperty('visibility', 'visible', 'important');
            
            // Ensure the form inside can also scroll
            const form = cartItems.querySelector('form');
            if (form) {
              form.style.height = '100%';
              form.style.display = 'flex';
              form.style.flexDirection = 'column';
            }
            // Ensure the cart items wrapper can scroll
            const cartItemsWrapper = cartItems.querySelector('.drawer__cart-items-wrapper');
            if (cartItemsWrapper) {
              cartItemsWrapper.style.overflow = 'visible';
            }
          }
          
          // Ensure drawer__inner allows scrolling
          drawerInner.style.setProperty('overflow', 'visible', 'important');
          drawerInner.style.setProperty('display', 'flex', 'important');
          drawerInner.style.setProperty('flex-direction', 'column', 'important');
          drawerInner.style.setProperty('height', '100%', 'important');
          
          // No need to prevent clicks inside drawer - overlay has pointer-events: none
          // so clicks inside drawer won't reach the overlay
        } else {
          // Fallback to updating the entire section
          const newHTML = this.getSectionInnerHTML(rawHTML, section.selector);
          sectionElement.innerHTML = newHTML;
        }
      } else {
        // For other sections, use innerHTML as before
        const newHTML = this.getSectionInnerHTML(rawHTML, section.selector);
        sectionElement.innerHTML = newHTML;
      }
      
      // If cart-icon-bubble was updated, reattach the click handler
      if (section.id === 'cart-icon-bubble') {
        this.setHeaderCartIconAccessibility();
      }
      
      console.log('[Cart Drawer] Updated section:', section.id);
    });

    // Wait for custom elements to initialize before opening
    setTimeout(() => {
      // Ensure overlay is visible when drawer opens
      const overlay = this.querySelector('#CartDrawer-Overlay');
      if (overlay) {
        overlay.style.display = 'block';
      }
      
      // Ensure custom elements inside cart-drawer-items are properly initialized
      const cartItems = this.querySelector('cart-drawer-items');
      if (cartItems) {
        // Force reinitialization of custom elements by querying them
        const removeButtons = cartItems.querySelectorAll('cart-remove-button');
        const quantityInputs = cartItems.querySelectorAll('quantity-input');
        // Custom elements should auto-initialize, but this ensures they're ready
        removeButtons.forEach(btn => {
          if (!btn.hasAttribute('data-initialized')) {
            btn.setAttribute('data-initialized', 'true');
          }
        });
        quantityInputs.forEach(input => {
          if (!input.hasAttribute('data-initialized')) {
            input.setAttribute('data-initialized', 'true');
          }
        });
      }
      
      console.log('[Cart Drawer] About to open drawer');
      this.open();
      console.log('[Cart Drawer] Drawer opened');
    }, 50); // Small delay to ensure custom elements are initialized
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
