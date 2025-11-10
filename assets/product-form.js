


if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
  super();

  // Safely locate the form; if not present (e.g., drawer not mounted), bail early
  this.form = this.querySelector && this.querySelector('form');
  if (!this.form) return;

  this.cart =
    document.querySelector('cart-notification') ||
    document.querySelector('cart-drawer') ||
    null;

  this.submitButton =
    this.querySelector('[type="submit"]') ||
    this.form.querySelector('[type="submit"]') ||
    null;

  this.submitButtonText =
    (this.submitButton && this.submitButton.querySelector('span')) || null;

  const idInput = this.variantIdInput;
  if (idInput) idInput.removeAttribute('disabled');

  if (this.cart && document.querySelector('cart-drawer') && this.submitButton) {
    this.submitButton.setAttribute('aria-haspopup', 'dialog');
  }

  this.hideErrors = this.dataset.hideErrors === 'true';

  // bind once
  this.onSubmitHandler = this.onSubmitHandler.bind(this);
  this.form.addEventListener('submit', this.onSubmitHandler);
}

onSubmitHandler(evt) {
  evt.preventDefault();
  if (!this.form || !this.submitButton) return;

  if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

  this.handleErrorMessage();

  this.submitButton.setAttribute('aria-disabled', true);
  this.submitButton.classList.add('loading');
  const spinner = this.querySelector('.loading__spinner');
  if (spinner) spinner.classList.remove('hidden');

  const config = fetchConfig('javascript');
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  delete config.headers['Content-Type'];

  const formData = new FormData(this.form);
  const variantIdFromFormData = formData.get('id');
  console.log('[Dawn ProductForm] FormData variant ID:', variantIdFromFormData, {
    formId: this.form.id,
    hasCart: !!this.cart,
    cartType: this.cart?.tagName,
    cartId: this.cart?.id,
    allIdInputs: Array.from(this.form.querySelectorAll('input[name="id"], select[name="id"]')).map(el => ({
      type: el.type || el.tagName,
      value: el.value,
      checked: el.checked || false,
      id: el.id
    }))
  });
  if (this.cart) {
    formData.append(
      'sections',
      this.cart.getSectionsToRender().map((section) => section.id)
    );
    formData.append('sections_url', window.location.pathname);
    this.cart.setActiveElement(document.activeElement);
  }
  config.body = formData;

  fetch(`${routes.cart_add_url}`, config)
    .then((response) => response.json())
    .then((response) => {
      console.log('[Dawn ProductForm] Fetch response received:', {
        hasStatus: !!response.status,
        item_count: response.item_count,
        hasCart: !!this.cart,
        cartType: this.cart?.tagName,
        hasQuickAddModal: !!this.closest('quick-add-modal'),
        responseKeys: Object.keys(response).slice(0, 10),
        hasSections: !!response.sections,
        sectionKeys: response.sections ? Object.keys(response.sections) : [],
        responseId: response.id,
        responseVariantId: response.variant_id,
        sectionsCartDrawerLength: response.sections?.['cart-drawer']?.length || 0
      });
      if (response.status) {
        publish(PUB_SUB_EVENTS.cartError, {
          source: 'product-form',
          productVariantId: formData.get('id'),
          errors: response.errors || response.description,
          message: response.message,
        });
        this.handleErrorMessage(response.description);

        if (!this.submitButton) return;
        const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
        if (!soldOutMessage) return;

        this.submitButton.setAttribute('aria-disabled', true);
        if (this.submitButtonText) this.submitButtonText.classList.add('hidden');
        soldOutMessage.classList.remove('hidden');
        this.error = true;
        return;
      } else if (!this.cart) {
        window.location = window.routes.cart_url;
        return;
      }

      const startMarker = CartPerformance.createStartingMarker('add:wait-for-subscribers');
      if (!this.error)
        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'product-form',
          productVariantId: formData.get('id'),
          cartData: response,
        }).then(() => {
          CartPerformance.measureFromMarker('add:wait-for-subscribers', startMarker);
        });

      this.error = false;
      const quickAddModal = this.closest('quick-add-modal');
      if (quickAddModal) {
        document.body.addEventListener(
          'modalClosed',
          () => {
            setTimeout(() => {
              CartPerformance.measure("add:paint-updated-sections", () => {
                this.cart.renderContents(response);
              });
            });
          },
          { once: true }
        );
        quickAddModal.hide(true);
      } else {
        console.log('[Dawn ProductForm] About to render cart contents, variant ID:', formData.get('id'), 'response item_count:', response.item_count);
        CartPerformance.measure("add:paint-updated-sections", () => {
          this.cart.renderContents(response);
          console.log('[Dawn ProductForm] renderContents completed');
        });
      }
    })
    .catch((e) => {
      console.error(e);
    })
    .finally(() => {
      if (this.submitButton) {
        this.submitButton.classList.remove('loading');
        if (!this.error) this.submitButton.removeAttribute('aria-disabled');
      }
      const spinner2 = this.querySelector('.loading__spinner');
      if (spinner2) spinner2.classList.add('hidden');

      CartPerformance.measureFromEvent("add:user-action", evt);
    });
}

handleErrorMessage(errorMessage = false) {
  if (this.hideErrors) return;

  this.errorMessageWrapper =
    this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
  if (!this.errorMessageWrapper) return;

  this.errorMessage =
    this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

  this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);
  if (errorMessage && this.errorMessage) {
    this.errorMessage.textContent = errorMessage;
  }
}

toggleSubmitButton(disable = true, text) {
  if (!this.submitButton || !this.submitButtonText) return;
  if (disable) {
    this.submitButton.setAttribute('disabled', 'disabled');
    if (text) this.submitButtonText.textContent = text;
  } else {
    this.submitButton.removeAttribute('disabled');
    this.submitButtonText.textContent = window.variantStrings.addToCart;
  }
}

get variantIdInput() {
  return this.form ? this.form.querySelector('[name=id]') : null;
}

    }
  );
}
