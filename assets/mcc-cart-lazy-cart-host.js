// assets/mcc-cart-lazy-cart-host.js
(function attachPatch(){
  function patch(){
    const PF = customElements.get('product-form');
    if (!PF) return false;
    if (PF.prototype.__mccPatched) return true;
    const orig = PF.prototype.onSubmitHandler;
    if (typeof orig !== 'function') return false;

    PF.prototype.onSubmitHandler = function(evt){
      // Re-grab the cart host RIGHT BEFORE submit so it exists
      this.cart =
        document.querySelector('cart-notification') ||
        document.querySelector('cart-drawer') ||
        this.cart;

      return orig.call(this, evt); // keep Dawn’s full flow
    };

    PF.prototype.__mccPatched = true;
    return true;
  }

  // Try now, then retry until product-form is defined
  if (!patch()) {
    document.addEventListener('DOMContentLoaded', patch);
    const iv = setInterval(() => { if (patch()) clearInterval(iv); }, 100);
    setTimeout(() => clearInterval(iv), 5000);
  }
})();
