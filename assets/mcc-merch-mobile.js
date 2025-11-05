
/* ===== MCC Merch — Bottom Sheet (free-drag + momentum, snap only at peek) ===== */
(function () {
  const root   = document.querySelector('#product_merch_mobile');
  if (!root || root.__mccSheetFreeInited) return; root.__mccSheetFreeInited = true;

  const drawer = root.querySelector('[data-mm-drawer]');
  const handle = root.querySelector('[data-mm-handle]');
  const peekEl = root.querySelector('[data-mm-peek]');
  const sheet  = root.querySelector('[data-mm-sheet]');
  if (!drawer || !handle || !peekEl || !sheet) return;

  /* ---- knobs ---- */
  const EDGE_PX       = 60;    // start pull from sheet near the top
  const INTERACTIVE_Y = 140;    // y <= this => sheet is interactive
  const PROJ_MS       = 950;   // ← more projection time = more momentum
  const PROJ_GAIN     = 1.7;   // ← smoother glide for free momentum
  const FRICTION_EDGE = 0.2;   // ← reduced rubberband friction
  const THRESHOLD_PX  = 0;     // first-move threshold (zero for instant response)
  const SNAP_PEEK_PX  = 36;    // snap to peek if release is close to bottom
  const SNAP_TOP_PX   = -1;    // ← disable top snap entirely
  const VEL_OPEN      = -0.012; // px/ms; easier up flick (less strict)
  const VEL_CLOSE     =  0.018; // px/ms; easier down flick (less strict)
  const MOMENTUM_DECAY = 0.98; // momentum decay factor (smooth, free momentum)
  const OVERSHOOT_CLAMP = 200; // max overshoot beyond bounds (px)
  const MIN_VELOCITY_THRESHOLD = 0.002; // px/ms - low threshold for free momentum


  /* ---- state ---- */
  let closedY = 0;        // translateY for peek (bottom)
  const OPEN_Y = 0;       // translateY for fully up
  let peekHeight = 0;

  let dragging=false, startY=0, lastY=0, lastT=0, vY=0, moved=false;
  let raf=null;
  let preDragY = 0, preDragTaken = false;  // ← add this right after raf


  const css = (n,v)=> root.style.setProperty(n, v);
  const clamp = (v, lo, hi)=> Math.max(lo, Math.min(hi, v));

  /* ---- geometry ---- */
 function measure(){
  // compute drawer height without current transform
  const prev = drawer.style.transform;
  drawer.style.transform = 'translateY(0) translateZ(0)';
  const h = Math.round(drawer.getBoundingClientRect().height);
  drawer.style.transform = prev || 'translateY(0) translateZ(0)';

  // safe “viewport” for the sheet; expose as CSS var (used by your CSS)
  const vh = Math.round(window.visualViewport ? window.visualViewport.height : window.innerHeight);
  css('--mm-sheet-max', Math.max(320, vh - 12) + 'px');

  // compute peek height
  const safeBottom = parseInt(getComputedStyle(root).getPropertyValue('--mm-safe-bottom')||'0',10) || 0;
  const target = Math.max(64, Math.min(200, Math.max(0, h - 16))); // baseline; your CSS/JS may override via --mm-peek-height
  peekHeight = target + safeBottom;
  css('--mm-peek-height', peekHeight + 'px');

  closedY = Math.max(0, h - peekHeight);
  
  // Verify closedY calculation - drawer height should equal viewport height
  // If there's a mismatch, use viewport height for accuracy
  const viewportHeight = Math.round(window.visualViewport ? window.visualViewport.height : window.innerHeight);
  if (Math.abs(h - viewportHeight) > 20) {
    // Drawer height doesn't match viewport, use viewport-based calculation
    closedY = Math.max(0, viewportHeight - peekHeight);
  }

  // if we’re not open, sit at peek
  drawer.style.transition = 'none';

  // --- one-time gentle boot-in from just below peek ---
  if (!root.__mmBooted) {
    root.__mmBooted = true;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Start slightly below the peek position (e.g., +18px), then ease up to peek
    const startY = closedY + 18;      // tweak 12–24px to taste
    drawer.style.transform = `translateY(${startY}px) translateZ(0)`;
    drawer.classList.add('is-peek');  // ensure correct state on first paint

    // force layout
    drawer.offsetHeight;

    if (!reduce) {
      drawer.style.transition = 'transform 260ms cubic-bezier(.16,1,.3,1)';
    }

    // animate up to true peek (closedY)
    requestAnimationFrame(() => {
      const onEnd = () => { drawer.removeEventListener('transitionend', onEnd); syncInteractive(); };
      drawer.addEventListener('transitionend', onEnd, { once: true });
      drawer.style.transform = `translateY(${closedY}px) translateZ(0)`;
    });

    return; // don't overwrite transition right after scheduling the boot
  }

  // normal non-boot path
  if (!drawer.classList.contains('is-open')) {
    drawer.style.transform = `translateY(${closedY}px) translateZ(0)`;
    drawer.classList.add('is-peek');
  }
  // reflow then restore transition for later animations
  drawer.offsetHeight;
  drawer.style.transition = '';
  syncInteractive();
}


  /* ---- helpers ---- */
  const getY = () => {
    const t = getComputedStyle(drawer).transform;
    if (!t || t === 'none') return 0;
    try {
      const M = ('DOMMatrixReadOnly' in window) ? DOMMatrixReadOnly : (window.WebKitCSSMatrix || null);
      const m = M ? new M(t) : null; return m ? (m.m42 || 0) : 0;
    } catch { return 0; }
  };

  function animateTo(y){
    drawer.style.transition = 'transform 360ms cubic-bezier(.16,1,.3,1)';
    drawer.style.transform  = `translateY(${y}px) translateZ(0)`;
    // Maintain visual integrity during transition
    drawer.style.overflow = 'hidden';
    drawer.style.pointerEvents = 'auto';
    // after any animate, ensure interactive state matches where we landed
    drawer.addEventListener('transitionend', () => {
      // Clear inline styles after transition
      drawer.style.pointerEvents = '';
      drawer.style.overflow = '';
      syncInteractive();
      // Update gallery height after drawer position changes
      if (window.MCCMerchGallery && window.MCCMerchGallery.updateHeight) {
        window.MCCMerchGallery.updateHeight();
      }
    }, { once:true });
  }

  function syncInteractive(){
  const y = getY();
  const openish = y <= INTERACTIVE_Y; // now only when truly at the top
  // Don't update classes during drag or momentum to prevent CSS interference
  if (dragging || raf) {
    return; // Skip updates during drag/momentum to prevent sticking
  }
  drawer.classList.toggle('is-open', openish);
  drawer.classList.toggle('is-peek', !openish);
  document.documentElement.classList.toggle('mm-locked', openish);
  document.body.classList.toggle('mm-locked', openish);
  // Restore pointer-events based on state (will be auto if is-open, none if peek)
  // This is handled by CSS, but we clear inline style to let CSS take over
  drawer.style.pointerEvents = '';
}

  function startDrag(y){
    dragging = true; moved = false;
    startY = lastY = y; lastT = performance.now(); vY = 0;
    
    // Force layout recalculation to prevent content breaking during drag
    drawer.offsetHeight; // force reflow
    
    // Ensure drawer content is visible and properly laid out
    drawer.style.transition = 'none';
    // Enable pointer events during drag to prevent gallery showing through
    drawer.style.pointerEvents = 'auto';
    // Force GPU acceleration to prevent breaking
    drawer.style.transform = `translateY(${getY()}px) translateZ(0)`;
    // Only set background to prevent gallery showing through - let CSS handle overflow
    if (sheet) {
      sheet.style.backgroundColor = '#fff';
    }
    
    cancelAnimationFrame(raf);
  }

  function moveDrag(y){
    const now = performance.now();
    const dy  = y - lastY;
    const dt  = Math.max(1, now - lastT);
    
    // Use instant velocity for better responsiveness (revert smoothing)
    vY = dy / dt; // px/ms
    
    // Mark as moved immediately - no threshold check needed
    moved = true;

    // Ensure transition is disabled during drag
    drawer.style.transition = 'none';
    // Keep pointer-events enabled during drag to prevent breaking
    drawer.style.pointerEvents = 'auto';
    // Only set background to prevent gallery showing through - let CSS handle overflow
    if (sheet) {
      sheet.style.backgroundColor = '#fff';
    }

    let next = getY() + dy;

    // Allow completely free movement - no friction at bounds
    // Only apply resistance when way beyond (150px+)
    const overshootTop = OPEN_Y - next;
    const overshootBottom = next - closedY;
    
    // Only apply resistance when significantly beyond bounds (150px+)
    if (overshootTop > 150) {
      next = OPEN_Y - 150 + (overshootTop - 150) * FRICTION_EDGE;
    } else if (overshootBottom > 150) {
      next = closedY + 150 + (overshootBottom - 150) * FRICTION_EDGE;
    }
    // Otherwise completely free movement - no friction at bounds
    
    // Ensure drawer never goes below closedY (never off screen)
    if (next > closedY) {
      next = closedY;
    }
    
    // Apply transform with GPU acceleration to prevent breaking (after all calculations)
    drawer.style.transform = `translateY(${next}px) translateZ(0)`;

    lastY = y; lastT = now;
    // Don't update interactivity during drag - only at end to prevent sticking
  }

  function continueMomentum(startY, startVel, startTime){
    let currentY = startY;
    let currentVel = startVel;
    let lastFrameTime = startTime;
    let hasOvershot = false;
    
    // Ensure transition is disabled during momentum
    drawer.style.transition = 'none';
    // Ensure pointer-events stays enabled during momentum to prevent gallery showing through
    drawer.style.pointerEvents = 'auto';
    // Only set background to prevent gallery showing through - let CSS handle overflow
    if (sheet) {
      sheet.style.backgroundColor = '#fff';
    }
    
    function animate(){
      const now = performance.now();
      const dt = Math.max(1, now - lastFrameTime);
      lastFrameTime = now;
      
      // Apply velocity with decay
      currentY += currentVel * dt;
      currentVel *= MOMENTUM_DECAY;
      
      // Ensure drawer never goes below closedY (prevent going off screen)
      if (currentY > closedY) {
        currentY = closedY;
        currentVel = 0; // Stop momentum if we hit bottom
      }
      
      // Prevent drawer from breaking during strong downward swipes
      // Don't override sheet overflow - let CSS handle scrolling
      
      // Check bounds and apply gentle resistance when beyond
      let beyondBounds = false;
      if (currentY < OPEN_Y) {
        // Beyond top - allow free movement without resistance
        // Only apply very light resistance when way past (200px+)
        const overshoot = OPEN_Y - currentY;
        if (overshoot > 200) {
          beyondBounds = true;
          hasOvershot = true;
          // Only apply resistance when way past (200px+)
          currentVel *= 0.98; // Very light resistance
        }
      }
      
      // Stop if velocity is very small (allow momentum to continue longer for free feeling)
      if (Math.abs(currentVel) < 0.002) {
        // Determine final target - allow natural stopping
        let finalTarget = currentY;
        
        // Only snap to peek if very close to bottom
        if (Math.abs(currentY - closedY) <= SNAP_PEEK_PX) {
          finalTarget = closedY;
        }
        // Only snap to top if way overshot (200px+) - prevents sticking when momentum stops near top
        else if (currentY < OPEN_Y - 200) {
          // Only return if way past top (200px+) - allow free movement without sticking
          finalTarget = OPEN_Y;
        } else if (currentY > closedY) {
          // Always return to closedY if beyond (prevent off screen)
          finalTarget = closedY;
        }
        // Otherwise, let it stay where momentum stopped naturally - NO FORCED SNAP TO TOP
        // This prevents getting stuck at top when momentum stops near there
        
        drawer.style.transition = 'transform 360ms cubic-bezier(.16,1,.3,1)';
        drawer.style.transform = `translateY(${finalTarget}px) translateZ(0)`;
        
        // Maintain visual integrity during transition - prevent breaking
        drawer.style.overflow = 'hidden'; // Prevent content breaking during transition
        drawer.style.pointerEvents = 'auto'; // Keep enabled during transition
        // Keep sheet background during transition - don't clear until after
        // (sheet.style.backgroundColor already set, keep it)
        
        // Update classes immediately when momentum stops (before transition) so scrolling works
        // Clear raf flag since momentum animation is complete
        raf = null;
        syncInteractive(); // Set is-open class immediately so CSS can enable scrolling
        
        // Update interactivity state and clear styles after transition completes
        const updateAfterTransition = () => {
          // Clear all inline styles after transition completes - let CSS take over
          drawer.style.pointerEvents = '';
          drawer.style.overflow = '';
          if (sheet) {
            sheet.style.backgroundColor = '';
          }
          syncInteractive(); // Ensure state is correct after transition
          if (window.MCCMerchGallery && window.MCCMerchGallery.updateHeight) {
            window.MCCMerchGallery.updateHeight();
          }
        };
        
        // Ensure drawer always reaches closedY properly when snapping to peek
        if (finalTarget === closedY) {
          // Use slightly longer transition for closing to ensure it completes
          drawer.style.transition = 'transform 400ms cubic-bezier(.16,1,.3,1)';
          drawer.addEventListener('transitionend', () => {
            // Force position check after animation to ensure it's at closedY
            const actualY = getY();
            if (Math.abs(actualY - closedY) > 3) {
              // Force to correct position if it didn't reach
              // Maintain visual integrity during force positioning
              drawer.style.overflow = 'hidden';
              drawer.style.pointerEvents = 'auto';
              drawer.style.transition = 'none';
              drawer.style.transform = `translateY(${closedY}px) translateZ(0)`;
              requestAnimationFrame(() => {
                drawer.style.transition = '';
                updateAfterTransition();
              });
            } else {
              updateAfterTransition();
            }
          }, { once: true });
        } else {
          drawer.addEventListener('transitionend', updateAfterTransition, { once: true });
        }
        return;
      }
      
      // Continue momentum animation - ensure pointer-events stays enabled
      drawer.style.transition = 'none';
      drawer.style.pointerEvents = 'auto'; // Keep enabled during momentum
      // Apply transform with GPU acceleration to prevent breaking
      drawer.style.transform = `translateY(${currentY}px) translateZ(0)`;
      raf = requestAnimationFrame(animate);
    }
    
    raf = requestAnimationFrame(animate);
  }

  function endDrag(){
  if (!dragging) return;
  dragging = false;
  drawer.style.transition = '';
  // Don't clear pointer-events here - let continueMomentum or syncInteractive handle it
  // This ensures pointer-events stays enabled during momentum animation
  
  cancelAnimationFrame(raf);

  // tap: toggle toward the nearer state
  if (!moved){
    const y = getY();
    animateTo(y > (closedY * 0.5) ? OPEN_Y : closedY);
    return;
  }

  const yNow = getY();

  // Ensure velocity is valid (not NaN or Infinity)
  if (!isFinite(vY) || isNaN(vY)) {
    // Fallback: snap to nearest state
    const midPoint = closedY * 0.5;
    animateTo(yNow > midPoint ? closedY : OPEN_Y);
    syncInteractive();
    return;
  }

  // Always use momentum continuation - no threshold check for free momentum
  // Even tiny movements get momentum for smooth, free feeling
  const boostedVel = vY * PROJ_GAIN;
  continueMomentum(yNow, boostedVel, performance.now());
  
  // Don't update interactivity state here - let continueMomentum handle it after animation
  // This prevents CSS from interfering with momentum
}

function maybeTakeoverFromSheet(currentY){
  if (preDragTaken) return false;
  const dy = currentY - preDragY;
  const yNow = getY();
  const isOpen = yNow <= INTERACTIVE_Y;
  
  // Only allow takeover when drawer is open and clearly swiping down (higher threshold)
  if (dy > 8 && isOpen && sheet.scrollTop <= 0){
    preDragTaken = true;
    startDrag(currentY);
    return true;
  }
  return false;
}
// when the drawer is peeking, allow an upward swipe from the entire peek header to start
function maybeOpenFromPeek(currentY){
  if (preDragTaken) return false;
  const dy = preDragY - currentY;             // upward is positive here
  const yNow = getY();
  const nearPeek = Math.abs(yNow - closedY) <= 30;   // drawer effectively closed (very tolerant - 30px)
  // Start drag immediately on any upward movement from peek (ultra-sensitive - no threshold)
  if (nearPeek && dy > 0){
    preDragTaken = true;
    startDrag(currentY);
    return true;
  }
  return false;
}

  /* ---- sheet edge gate: only begin pull from very top edge ---- */
  function wantsEdgeDragPointer(e){
    const r = sheet.getBoundingClientRect();
    const atTopEdge = (e.clientY - r.top) <= EDGE_PX;
    return atTopEdge && sheet.scrollTop <= 0;
  }
  function wantsEdgeDragTouch(e){
    const y = (e.touches && e.touches[0]) ? e.touches[0].clientY : 0;
    const r = sheet.getBoundingClientRect();
    const atTopEdge = (y - r.top) <= EDGE_PX;
    return atTopEdge && sheet.scrollTop <= 0;
  }
function onPointerDown(e){
  const t = e.target;
  preDragY = e.clientY; preDragTaken = false;
  
  // Handle/peek always drag - start immediately, no delay (check BEFORE isOpen check)
  // Check if target is inside handle or peek (including buttons inside peek)
  if (handle.contains(t) || peekEl.contains(t) || t.closest('[data-mm-handle]') || t.closest('[data-mm-peek]')){
    e.preventDefault(); 
    startDrag(e.clientY); 
    bindPointerMove(); 
    return;
  }

  const yNow = getY();
  const isOpen = yNow <= INTERACTIVE_Y;
  
  // If drawer is closed and target is in sheet, check for upward swipe to open drawer
  if (!isOpen && sheet.contains(t)) {
    // Watch for upward movement to start drag (allows easy swipe up from peek)
    const gateMove = (ev)=>{
      if (maybeOpenFromPeek(ev.clientY)){
        ev.preventDefault();
        window.removeEventListener('pointermove', gateMove);
        window.removeEventListener('pointerup', gateCleanup);
        window.removeEventListener('pointercancel', gateCleanup);
        bindPointerMove();
      } else {
        // If not an upward swipe, remove listener to allow gallery interaction
        const dy = ev.clientY - preDragY;
        if (Math.abs(dy) > 5) {
          window.removeEventListener('pointermove', gateMove);
          window.removeEventListener('pointerup', gateCleanup);
          window.removeEventListener('pointercancel', gateCleanup);
        }
      }
    };
    const gateCleanup = ()=>{
      window.removeEventListener('pointermove', gateMove);
      window.removeEventListener('pointerup', gateCleanup);
      window.removeEventListener('pointercancel', gateCleanup);
    };
    window.addEventListener('pointermove', gateMove, {passive:false});
    window.addEventListener('pointerup', gateCleanup, {passive:false, once:true});
    window.addEventListener('pointercancel', gateCleanup, {passive:false, once:true});
    return;
  }

  // Inside sheet?
  if (sheet.contains(t)){
    // Drawer must be open at this point (we already returned if closed above)
    // Drawer is open - allow dragging
    if (sheet.scrollTop <= 0){
      // Start drag on downward movement only
      const gateMove = (ev)=>{
        const dy = ev.clientY - preDragY;
        // Only start drag if clearly swiping down (prevent misfires)
        if (dy > 5){
          ev.preventDefault();
          window.removeEventListener('pointermove', gateMove);
          startDrag(ev.clientY);
          bindPointerMove();
        }
      };
      window.addEventListener('pointermove', gateMove, {passive:false});
      return;
    }
    
    // If finger starts within EDGE_PX of top and sheet is at top → pull-down to close
    if (wantsEdgeDragPointer(e)){ e.preventDefault(); startDrag(e.clientY); bindPointerMove(); return; }

    // Otherwise, watch first move for takeover - but only if drawer is open
    const gateMove = (ev)=>{
      // Only allow takeover if swiping down (not peek swipe when drawer is open)
      if (maybeTakeoverFromSheet(ev.clientY)){
        ev.preventDefault();
        window.removeEventListener('pointermove', gateMove);
        bindPointerMove();
      }
    };
    window.addEventListener('pointermove', gateMove, {passive:false});
  }
}

function onTouchStart(e){
  const t = e.target;
  const y = e.touches[0].clientY;
  preDragY = y; preDragTaken = false;
  
  // Handle/peek always drag - start immediately, no delay (check BEFORE isOpen check)
  // Check if target is inside handle or peek (including buttons inside peek)
  if (handle.contains(t) || peekEl.contains(t) || t.closest('[data-mm-handle]') || t.closest('[data-mm-peek]')){
    e.preventDefault(); 
    startDrag(y); 
    bindTouchMove(); 
    return;
  }

  const yNow = getY();
  const isOpen = yNow <= INTERACTIVE_Y;
  
  // If drawer is closed and target is in sheet, check for upward swipe to open drawer
  if (!isOpen && sheet.contains(t)) {
    // Watch for upward movement to start drag (allows easy swipe up from peek)
    const gateMove = (ev)=>{
      const cy = ev.touches[0].clientY;
      if (maybeOpenFromPeek(cy)){
        ev.preventDefault();
        document.removeEventListener('touchmove', gateMove);
        document.removeEventListener('touchend', gateCleanup);
        document.removeEventListener('touchcancel', gateCleanup);
        bindTouchMove();
      } else {
        // If not an upward swipe, remove listener to allow gallery interaction
        const dy = cy - preDragY;
        if (Math.abs(dy) > 5) {
          document.removeEventListener('touchmove', gateMove);
          document.removeEventListener('touchend', gateCleanup);
          document.removeEventListener('touchcancel', gateCleanup);
        }
      }
    };
    const gateCleanup = ()=>{
      document.removeEventListener('touchmove', gateMove);
      document.removeEventListener('touchend', gateCleanup);
      document.removeEventListener('touchcancel', gateCleanup);
    };
    document.addEventListener('touchmove', gateMove, {passive:false});
    document.addEventListener('touchend', gateCleanup, {passive:true, once:true});
    document.addEventListener('touchcancel', gateCleanup, {passive:true, once:true});
    return;
  }

  if (sheet.contains(t)){
    // Drawer must be open at this point (we already returned if closed above)
    // Drawer is open - allow dragging
    if (sheet.scrollTop <= 0){
      // Start drag on downward movement only
      const gateMove = (ev)=>{
        const cy = ev.touches[0].clientY;
        const dy = cy - preDragY;
        // Only start drag if clearly swiping down (prevent misfires)
        if (dy > 5){
          ev.preventDefault();
          document.removeEventListener('touchmove', gateMove);
          startDrag(cy);
          bindTouchMove();
        }
      };
      document.addEventListener('touchmove', gateMove, {passive:false});
      return;
    }
    
    if (wantsEdgeDragTouch(e)){ e.preventDefault(); startDrag(y); bindTouchMove(); return; }

    // Otherwise, watch first move for takeover - but only if drawer is open
    const gateMove = (ev)=>{
      const cy = ev.touches[0].clientY;
      // Only allow takeover if swiping down (not peek swipe when drawer is open)
      if (maybeTakeoverFromSheet(cy)){
        ev.preventDefault();
        document.removeEventListener('touchmove', gateMove);
        bindTouchMove();
      }
    };
    document.addEventListener('touchmove', gateMove, {passive:false});
  }
}



  function bindPointerMove(){
    const pm = (ev)=>{ if (dragging){ moveDrag(ev.clientY); ev.preventDefault(); } };
    const pu = ()=>{ window.removeEventListener('pointermove', pm); window.removeEventListener('pointerup', pu); window.removeEventListener('pointercancel', pu); endDrag(); };
    window.addEventListener('pointermove', pm, {passive:false});
    window.addEventListener('pointerup',   pu, {passive:false, once:true});
    window.addEventListener('pointercancel', pu, {passive:false, once:true});
  }
  function bindTouchMove(){
    const tm = (ev)=>{ if (dragging){ moveDrag(ev.touches[0].clientY); ev.preventDefault(); } };
    const tu = ()=>{ document.removeEventListener('touchmove', tm); document.removeEventListener('touchend', tu); document.removeEventListener('touchcancel', tu); endDrag(); };
    document.addEventListener('touchmove', tm, {passive:false});
    document.addEventListener('touchend',  tu, {passive:true,  once:true});
    document.addEventListener('touchcancel', tu, {passive:true, once:true});
  }

  /* ---- bind starts ---- */
  const usePointer = 'PointerEvent' in window && !(/iP(hone|ad|od)/.test(navigator.platform) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document));
  if (usePointer){
    handle.addEventListener('pointerdown', onPointerDown, {passive:false});
    peekEl.addEventListener('pointerdown', onPointerDown, {passive:false});
    sheet .addEventListener('pointerdown', onPointerDown, {passive:false});
  } else {
    handle.addEventListener('touchstart', onTouchStart, {passive:false});
    peekEl.addEventListener('touchstart', onTouchStart, {passive:false});
    sheet .addEventListener('touchstart', onTouchStart, {passive:false});
  }

  // click toggles for handle/peek (don’t toggle when tapping controls inside peek)
  handle.addEventListener('click', ()=>{ if (!dragging){ const y = getY(); animateTo(y > (closedY*0.5) ? OPEN_Y : closedY); }});
  peekEl.addEventListener('click', (e)=>{
    if (dragging) return;
    if (e.target.closest('button,a,input,select,textarea,[role="button"]')) return;
    const y = getY(); animateTo(y > (closedY*0.5) ? OPEN_Y : closedY);
  });

  /* ---- lifecycle ---- */
  measure();
  if (window.visualViewport){
    window.visualViewport.addEventListener('resize', measure);
    window.visualViewport.addEventListener('scroll',  measure);
  }
  window.addEventListener('resize', measure);
  new MutationObserver(measure).observe(sheet, { childList:true, subtree:true });

  // expose in case you want to open/close programmatically
  window.MCCMerchSheet = {
    open(){ animateTo(OPEN_Y); },
    peek(){ animateTo(closedY); },
    measure
  };
})();



/* === Merch Mobile — Coffee-style accordion logic (robust) === */
(function(){
  const root = document.getElementById('product_merch_mobile');
  if (!root || root.__mccMerchAccInited3) return; root.__mccMerchAccInited3 = true;

  const rows = root.querySelectorAll('.coffee-accordion[data-accordion]');
  if (!rows.length) return;

  function openPanel(panel){
    panel.style.height = panel.clientHeight + 'px';
    requestAnimationFrame(()=>{
      const target = panel.scrollHeight || 1;
      panel.style.height = target + 'px';
      panel.setAttribute('data-open','true');
      const te = ()=>{ panel.style.height = ''; panel.removeEventListener('transitionend', te); };
      panel.addEventListener('transitionend', te);
    });
  }

  function closePanel(panel){
    const current = panel.style.height && panel.style.height !== 'auto'
      ? parseFloat(panel.style.height) : panel.scrollHeight;
    panel.style.height = current + 'px';
    requestAnimationFrame(()=>{
      panel.style.height = '0px';
      panel.removeAttribute('data-open');
    });
  }

  rows.forEach(acc=>{
    const btn   = acc.querySelector('.coffee-acc-trigger');
    const panel = acc.querySelector('[data-acc-panel]');
    const head  = acc.querySelector('.coffee-acc-header');
    if (!btn || !panel || !head) return;

    const startOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', startOpen ? 'true' : 'false');
    panel.style.height = startOpen ? (panel.scrollHeight + 'px') : '0px';
    requestAnimationFrame(()=>{ if (startOpen) panel.style.height = ''; });

    head.addEventListener('pointerdown', e => e.stopPropagation(), {passive:true});
    head.addEventListener('touchstart',  e => e.stopPropagation(), {passive:true});
    head.addEventListener('click',       e => e.stopPropagation(), false);

    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      isOpen ? closePanel(panel) : openPanel(panel);
    });
  });

  requestAnimationFrame(()=> requestAnimationFrame(()=> root.classList.add('acc-ready')));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    root.querySelectorAll('.coffee-acc-panel').forEach(p=> p.style.transition = 'none');
  }
})();

/* === Merch Mobile — Vertical gallery (bars + soft snap with busy guard) === */
(function () {
  // Shared function to update gallery height dynamically
  function updateGalleryHeight(){
    // Skip updates if drawer is currently being dragged
    const drawer = document.querySelector('[data-mm-drawer]');
    if (drawer && drawer.classList.contains('is-dragging')) return;
    
    // Target the wrapper gallery container
    const galleryWrapper = document.querySelector('#product_merch_mobile .mm-gallery');
    const gallery = document.querySelector('.mmv-gallery');
    if (!galleryWrapper || !gallery) return;
    
    // Find announcement bar (if present)
    const announcementBar = document.querySelector('.announcement-bar, [data-announcement-bar], #shopify-section-announcement-bar');
    const announcementBottom = announcementBar ? announcementBar.getBoundingClientRect().bottom : 0;
    
    // Find header bottom
    const header = document.querySelector('header.header, .header, [data-header], #shopify-section-header');
    const headerBottom = header ? header.getBoundingClientRect().bottom : announcementBottom;
    
    // Use the lower of the two (header should be below announcement bar)
    const topOffset = Math.max(announcementBottom, headerBottom);
    
    // Find drawer - always use peek position for stable sizing
    let drawerTop;
    
    if (drawer) {
      // Always use the peek position (closed state) for consistent gallery sizing
      // This prevents indicators from shrinking when drawer is dragged
      const peekHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--mm-peek-height') || '200', 10);
      
      // Gallery should always be sized based on drawer's peek position
      // This gives consistent indicator sizing regardless of drawer state
      drawerTop = window.innerHeight - peekHeight;
    } else {
      drawerTop = window.innerHeight;
    }
    
    // Calculate available height with small safety margin
    const availableHeight = Math.max(200, drawerTop - topOffset - 8); // min 200px, 8px margin
    
    // Position gallery wrapper below header/announcement bar
    galleryWrapper.style.top = topOffset + 'px';
    galleryWrapper.style.position = 'absolute';
    
    // Set gallery wrapper height dynamically
    galleryWrapper.style.height = availableHeight + 'px';
    
    // Also set inner gallery to fill wrapper
    gallery.style.height = '100%';
    gallery.style.position = 'relative';
    gallery.style.top = '0';
  }

  function initMerchGallery(galRoot) {
    if (!galRoot || galRoot.__mmvgInit) return;
    galRoot.__mmvgInit = true;

    const section = document.getElementById('product_merch_mobile');
    const track  = galRoot.querySelector('[data-mmvg-track]');
    const slides = Array.from(galRoot.querySelectorAll('[data-mmvg-slide]'));
    const bars   = Array.from(galRoot.querySelectorAll('[data-mmvg-bar]'));
    const rail   = galRoot.querySelector('[data-indicators]');
    
    // Build Media ID → Color lookup map from variant→media mapping
    // This allows us to look up colors even when slides don't have data-color-name attributes
    const mediaToColorMap = {};
    const mediaToColorHexMap = {};
    const variantMediaMapEl = section.querySelector('[id^="VariantMediaMap-"]') || document.querySelector('[id^="VariantMediaMap-"]');
    
    // Try to get variant data from form or product JSON
    const form = section.querySelector('form[action*="/cart/add"]') || section.querySelector('form');
    const variantDataEl = form?.querySelector('script[id^="ProductJSON-"]') || 
                          section.querySelector('script[id^="ProductJSON-"]') ||
                          document.querySelector('script[id^="ProductJSON-"]');
    let variants = [];
    if (variantDataEl) {
      try {
        const productData = JSON.parse(variantDataEl.textContent.trim() || '{}');
        variants = productData.variants || [];
      } catch (e) {
        console.warn('[Gallery] Failed to parse product JSON:', e);
      }
    }
    
    if (variantMediaMapEl) {
      try {
        const mapData = JSON.parse(variantMediaMapEl.textContent.trim() || '{}');
        const byColor = mapData.byColor || {};
        const byVariantId = mapData.byVariantId || {};
        
        // Method 1: Reverse the color → media map (byColor)
        Object.keys(byColor).forEach(colorName => {
          const mediaId = byColor[colorName];
          if (mediaId) {
            const mediaIdStr = String(mediaId);
            // Only set if not already set (first color wins)
            if (!mediaToColorMap[mediaIdStr]) {
              mediaToColorMap[mediaIdStr] = colorName;
            }
          }
        });
        
        // Method 2: Build from variant data (more accurate, includes hex)
        if (variants.length > 0 && Object.keys(byVariantId).length > 0) {
          variants.forEach(variant => {
            if (!variant || !variant.id) return;
            const variantId = String(variant.id);
            const mediaId = byVariantId[variantId];
            if (mediaId) {
              const mediaIdStr = String(mediaId);
              const colorName = variant.option1 || (variant.options && variant.options[0]) || '';
              const colorHex = variant?.metafields?.custom?.color_hex || variant?.color_hex || '';
              
              // Use variant data (more accurate than byColor reverse lookup)
              if (colorName) {
                mediaToColorMap[mediaIdStr] = colorName;
              }
              if (colorHex) {
                mediaToColorHexMap[mediaIdStr] = colorHex;
              }
            }
          });
        }
        
        // Debug logging
        if (window.console && window.console.log) {
          console.log('[Gallery] Built media→color map:', { 
            mapSize: Object.keys(mediaToColorMap).length,
            sample: Object.keys(mediaToColorMap).slice(0, 3).map(k => ({ mediaId: k, color: mediaToColorMap[k] }))
          });
        }
      } catch (e) {
        console.warn('[Gallery] Failed to parse variant media map:', e);
      }
    }

    // Ensure the indicator bars always fit within the visible gallery height
    function sizeIndicators(){
      if (!rail || !bars.length) return;
      const rect = galRoot.getBoundingClientRect();
      // Account for padding at top/bottom (8px each = 16px total)
      const available = Math.max(0, rect.height - 16);
      const count = bars.length;
      const MAX_BAR = 24, MIN_BAR = 8, MIN_GAP = 4;
      const BASE_BAR_HEIGHT = 20;
      
      // Account for active bar being taller (20% taller than base)
      // Use worst-case: one active bar at max height
      const ACTIVE_MULTIPLIER = 1.2;
      const ACTIVE_BAR_HEIGHT = Math.ceil(BASE_BAR_HEIGHT * ACTIVE_MULTIPLIER);

      // Calculate if we need to shrink
      // Worst case: all bars at max height (active state)
      const totalAtMax = (count * ACTIVE_BAR_HEIGHT) + ((count - 1) * MIN_GAP);
      
      let barH, gap, activeBarH;
      if (totalAtMax > available){
        // Need to shrink - calculate bar height that fits
        // Account for one active bar being taller than base
        const extraForActive = Math.ceil(BASE_BAR_HEIGHT * (ACTIVE_MULTIPLIER - 1));
        barH = Math.floor((available - (count - 1) * MIN_GAP - extraForActive) / count);
        barH = Math.max(MIN_BAR, Math.min(BASE_BAR_HEIGHT, barH));
        activeBarH = Math.ceil(barH * ACTIVE_MULTIPLIER);
        const remaining = Math.max(0, available - ((count - 1) * barH + activeBarH));
        gap = Math.max(MIN_GAP, Math.floor(remaining / Math.max(1, (count - 1))));
      } else {
        // Fits at default sizes
        barH = BASE_BAR_HEIGHT;
        activeBarH = ACTIVE_BAR_HEIGHT;
        gap = Math.max(MIN_GAP, Math.floor((available - ((count - 1) * barH + activeBarH)) / Math.max(1, (count - 1))));
        gap = Math.min(8, gap); // cap gap at reasonable max
      }
      
      rail.style.gap = gap + 'px';
      // Set CSS variable for proportional active height
      rail.style.setProperty('--bar-height', barH + 'px');
      
      // Calculate total height needed (accounting for active bar being taller)
      const totalHeight = (count - 1) * barH + activeBarH + (count - 1) * gap;
      
      // Set explicit height on rail container to prevent overflow
      // But ensure it doesn't exceed available space
      const constrainedHeight = Math.min(totalHeight, available);
      rail.style.height = constrainedHeight + 'px';
      rail.style.maxHeight = constrainedHeight + 'px';
      
      bars.forEach(b => { 
        // Set base height, active state will increase it via CSS (20% taller)
        b.style.height = barH + 'px'; 
      });
    }

    // Store sizing function on gallery root for external updates
    galRoot.updateIndicatorSizing = sizeIndicators;

    // Tap a bar => scroll to slide
    bars.forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.getAttribute('data-index') || 0);
        const target = slides[i];
        if (target) target.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    });

    // Active state (debounced to prevent rapid updates)
    let activeTimeout;
    const setActive = (idx) => {
      // Clear any pending updates
      if (activeTimeout) {
        cancelAnimationFrame(activeTimeout);
      }
      
      // Use requestAnimationFrame to batch DOM updates
      activeTimeout = requestAnimationFrame(() => {
        bars.forEach((b,i) => {
          const on = i === idx;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-current', on ? 'true' : 'false');
        });
      });
    };

    // Which slide is most visible (throttled to prevent jitter)
    let lastActiveIdx = null;
    let ioTimeout;
    
    // Function to dispatch color event for a slide
    const dispatchSlideColorEvent = (slide, index) => {
      if (!slide) return;
      let colorName = slide.getAttribute('data-color-name') || '';
      let colorHex = slide.getAttribute('data-color-hex') || '';
      const mediaId = slide.getAttribute('data-media-id');
      const mediaIdStr = mediaId ? String(mediaId) : '';
      
      // If slide doesn't have color data, try to look it up from media→color map
      if (!colorName && mediaIdStr && mediaToColorMap[mediaIdStr]) {
        colorName = mediaToColorMap[mediaIdStr];
      }
      
      // If slide doesn't have hex, try to look it up from media→hex map
      if (!colorHex && mediaIdStr && mediaToColorHexMap[mediaIdStr]) {
        colorHex = mediaToColorHexMap[mediaIdStr];
      }
      
      // Only dispatch if we have color data (name or hex)
      if (colorName || colorHex) {
        // Use requestAnimationFrame to batch DOM updates and prevent jitter
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('gallery:slide', {
            detail: {
              colorName: colorName,
              colorHex: colorHex,
              mediaId: mediaIdStr,
              index: index
            },
            bubbles: true
          }));
        });
      }
    };
    
    // Track scroll state for debouncing color updates (but still update indicators)
    let scrollColorTimer;
    
    const io = new IntersectionObserver((entries) => {
      let bestIdx = null, bestRatio = 0;
      let bestSlide = null;
      for (const e of entries) {
        if (e.intersectionRatio > bestRatio) {
          bestRatio = e.intersectionRatio;
          bestIdx = Number(e.target.getAttribute('data-index') || 0);
          bestSlide = e.target;
        }
      }
      
      // Always update indicators immediately when slide changes (for visual feedback)
      if (bestIdx !== null && bestIdx !== lastActiveIdx && bestRatio >= 0.25) {
        lastActiveIdx = bestIdx;
        
        // Update indicators immediately
        setActive(bestIdx);
        
        // Debounce color updates separately to prevent jitter
        clearTimeout(scrollColorTimer);
        scrollColorTimer = setTimeout(() => {
          if (bestSlide) {
            dispatchSlideColorEvent(bestSlide, bestIdx);
          }
        }, 150); // Wait for scroll to settle before updating color
      }
    }, { root: track, threshold: [0.25, 0.5, 0.75, 0.98] });
    slides.forEach(s => io.observe(s));
    
    // Initial color event dispatch for the first visible slide
    requestAnimationFrame(() => {
      const initialSlide = slides[0];
      if (initialSlide) {
        dispatchSlideColorEvent(initialSlide, 0);
      }
    });

    // Soft snap at rest (skip while busy)
    let settleTimer;
    
    track.addEventListener('scroll', () => {
      const isBusy = section.getAttribute('data-mmvg-busy') === '1';
      
      // Skip soft snap if busy (programmatic scroll in progress)
      if (isBusy) return;
      
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const vh = track.clientHeight;
        const nearest = Math.round(track.scrollTop / vh) * vh;
        track.scrollTo({ top: nearest, behavior: 'smooth' });
      }, 90);
    }, { passive: true });

    // Initial sizing and on resize/viewport changes
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      updateGalleryHeight();
      sizeIndicators();
      // Also run after a short delay to catch any late layout changes
      setTimeout(() => {
        updateGalleryHeight();
        sizeIndicators();
      }, 100);
    });
    
    window.addEventListener('resize', () => {
      requestAnimationFrame(() => {
        updateGalleryHeight();
        sizeIndicators();
      });
    });
    
    if (window.visualViewport){
      window.visualViewport.addEventListener('resize', () => {
        requestAnimationFrame(() => {
          updateGalleryHeight();
          sizeIndicators();
        });
      });
      window.visualViewport.addEventListener('scroll', () => {
        requestAnimationFrame(() => {
          updateGalleryHeight();
          sizeIndicators();
        });
      });
    }

    // Watch for drawer state changes (debounced to avoid updates during drag)
    const drawer = document.querySelector('[data-mm-drawer]');
    let drawerUpdateTimeout;
    if (drawer) {
      const observer = new MutationObserver(() => {
        // Debounce updates - only recalculate after drawer settles
        clearTimeout(drawerUpdateTimeout);
        drawerUpdateTimeout = setTimeout(() => {
          requestAnimationFrame(() => {
            updateGalleryHeight();
            sizeIndicators();
          });
        }, 150); // Wait for drawer animation to settle
      });
      observer.observe(drawer, { attributes: true, attributeFilter: ['class'] });
      
      // Also listen for transition end to ensure we update after animation completes
      drawer.addEventListener('transitionend', () => {
        clearTimeout(drawerUpdateTimeout);
        requestAnimationFrame(() => {
          updateGalleryHeight();
          sizeIndicators();
        });
      }, { passive: true });
    }

    // Helper function to dispatch color event for currently visible slide
    function dispatchColorEventForVisibleSlide() {
      const vh = track.clientHeight;
      const scrollTop = track.scrollTop;
      
      // More accurate calculation: find which slide center is closest to viewport center
      let bestIndex = 0;
      let bestDistance = Infinity;
      
      slides.forEach((slide, idx) => {
        const slideTop = idx * vh;
        const slideCenter = slideTop + (vh / 2);
        const viewportCenter = scrollTop + (vh / 2);
        const distance = Math.abs(slideCenter - viewportCenter);
        
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = idx;
        }
      });
      
      const currentSlide = slides[bestIndex];
      if (currentSlide) {
        dispatchSlideColorEvent(currentSlide, bestIndex);
      }
    }

    // Note: Scroll handler is set up earlier in the function (around line 624)
    // This duplicate has been removed
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-mmvg]').forEach(initMerchGallery);
    // Initial gallery height update
    updateGalleryHeight();
  });
  
  // Expose update function globally
  window.MCCMerchGallery = { 
    init: initMerchGallery,
    updateSizing: function() {
      document.querySelectorAll('[data-mmvg]').forEach(galRoot => {
        if (galRoot.updateIndicatorSizing) {
          galRoot.updateIndicatorSizing();
        }
      });
    },
    updateHeight: updateGalleryHeight
  };
})();

/* ===== MCC Merch — Variant→Media controller (robust, case-insensitive) ===== */
(function(){
  const root = document.getElementById('product_merch_mobile');
  if (!root || root.__mccMerchVariantMediaInitedV4) return; root.__mccMerchVariantMediaInitedV4 = true;

  // ---- helpers ----
  const qsa = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const qs  = (sel, scope = document) => scope.querySelector(sel);
  const norm = (s) => (s || '').toString().trim().toLowerCase();

  function getMap() {
    const el = root.querySelector('[id^="VariantMediaMap-"]');
    if (!el) return null;
    try {
      const raw = JSON.parse(el.textContent.trim() || '{}');
      // Make a case-insensitive proxy around byColor
      const byColorRaw = raw.byColor || {};
      const byColorCI = {};
      Object.keys(byColorRaw).forEach(k => { byColorCI[norm(k)] = byColorRaw[k]; });
      raw.byColorCI = byColorCI;
      return raw;
    } catch { return null; }
  }

  function slides() {
    return qsa('[data-mmvg-slide][data-media-id]', root);
  }
  function findSlideByMediaId(mediaId) {
    const idStr = String(mediaId);
    return slides().find(s => String(s.getAttribute('data-media-id')) === idStr) || null;
  }
  function setBusy(on) {
    if (on) root.setAttribute('data-mmvg-busy', '1');
    else root.removeAttribute('data-mmvg-busy');
  }
  // Scroll to target and resolve when mostly visible (or after timeout)
  function scrollToMedia(mediaId, behavior, variantColorData) {
    const target = findSlideByMediaId(mediaId);
    const track  = target && target.closest('[data-mmvg-track]');
    if (!target || !track) return Promise.resolve(false);

    return new Promise((resolve) => {
      setBusy(true);
      let done = false;
      const dispatchColorEvent = () => {
        if (target) {
          // Prefer variant color data if provided (more accurate)
          const colorName = variantColorData?.colorName || target.getAttribute('data-color-name') || '';
          const colorHex = variantColorData?.colorHex || target.getAttribute('data-color-hex') || '';
          // Always dispatch event, even if color data is missing
          requestAnimationFrame(() => {
            document.dispatchEvent(new CustomEvent('gallery:slide', {
              detail: {
                colorName: colorName,
                colorHex: colorHex,
                mediaId: String(mediaId),
                index: Number(target.getAttribute('data-index') || 0)
              }
            }));
          });
        }
      };
      
      const io = new IntersectionObserver((entries)=>{
        const e = entries[0];
        if (!done && e?.isIntersecting && e.intersectionRatio >= 0.9) {
          done = true; io.disconnect(); setBusy(false);
          dispatchColorEvent();
          resolve(true);
        }
      }, { root: track, threshold: [0.9] });
      io.observe(target);

      // Force scroll even if already partially visible
      const scrollBehavior = behavior || 'smooth';
      
      // Calculate target scroll position correctly
      // Each slide is 100% of track height (full viewport height)
      const slideIndex = Number(target.getAttribute('data-index') || 0);
      
      // Function to perform the scroll calculation and execution
      const performScroll = () => {
        const trackHeight = track.clientHeight;
        const targetScrollTop = slideIndex * trackHeight;
        
        // Scroll to the target position
        track.scrollTo({ top: targetScrollTop, behavior: scrollBehavior });
        
        // For instant scrolls, also set directly to ensure it happens
        if (scrollBehavior === 'instant') {
          track.scrollTop = targetScrollTop;
        }
      };
      
      // Wait for layout to settle if drawer might be affecting it
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          performScroll();
          // Also use scrollIntoView as backup for smooth scrolls
          if (scrollBehavior !== 'instant') {
            target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: scrollBehavior });
          }
        });
      });

      // don't hang forever if the IO threshold isn't reached
      setTimeout(()=>{ 
        if (!done) { 
          io.disconnect(); 
          setBusy(false);
          dispatchColorEvent();
          resolve(true);
        }
      }, 1000); // Increased timeout for instant scrolls
    });
  }

  function safeJump(mediaId, behavior, variantColorData) {
    // If target not found, don't leave the user staring at whitespace — go to first slide.
    if (findSlideByMediaId(mediaId)) return scrollToMedia(mediaId, behavior, variantColorData);
    const first = slides()[0];
    if (first) first.scrollIntoView({ block:'start', behavior: behavior || 'instant' });
    return Promise.resolve(false);
  }

  function getDrawerOpts() {
    const drawer = qs('[data-mm-drawer]', root);
    return {
      drawer,
      autoMin: drawer ? drawer.dataset.mmAutominimize === 'true' : false,
      autoRestore: drawer ? (parseInt(drawer.dataset.mmAutorestore || '0', 10) || 0) : 0
    };
  }
  const drawerClose = () => window.MCCMerchSheet?.close?.() || (() => {
    const d = qs('[data-mm-drawer]', root); if (d) { d.classList.add('is-peek'); d.classList.remove('is-open'); }
  })();
  const drawerOpen  = () => window.MCCMerchSheet?.open?.()  || (() => {
    const d = qs('[data-mm-drawer]', root); if (d) { d.classList.remove('is-peek'); d.classList.add('is-open'); }
  })();

  const map = getMap();
  if (!map) return;

  // —— Event sources we support ——
  //  A) direct picker inputs/selects (works with Dawn & custom pickers)
  const colorSel = [
    'input[name="options[Color]"]','input[name="options[color]"]',
    'input[data-option-name="Color"]','input[data-option-name="color"]',
    'select[name="options[Color]"]','select[name="options[color]"]'
  ].join(',');

  function handleColorChange(rawValue){
    const v = norm(rawValue);
    if (!v) return;
    const mediaId = map.byColorCI[v]; // case-insensitive
    if (!mediaId) return;

    const { autoMin, autoRestore } = getDrawerOpts();
    safeJump(mediaId, 'instant').then(() => {
      if (autoMin) {
        drawerClose();
        if (autoRestore > 0) setTimeout(drawerOpen, autoRestore);
      }
    });
  }

  function onVariantInput(e){
    const t = e.target;
    if (!t?.matches?.(colorSel)) return;
    const value =
      t.tagName === 'SELECT'
        ? t.value
        : (t.value || t.getAttribute('data-option-value') || t.getAttribute('aria-label') || '');
    handleColorChange(value);
  }

  root.addEventListener('change', onVariantInput, true);
  root.addEventListener('click',  onVariantInput, true);

  //  B) global custom events (cover both spellings)
  document.addEventListener('variant:change',  (ev) => {
    const v = ev.detail && (ev.detail.variant || ev.detail);
    if (!v) return;
    
    // Extract color data from variant
    // Try option1 first (usually color), then check options array
    const colorName = v.option1 || (v.options && v.options[0]) || '';
    const colorHex = v?.metafields?.custom?.color_hex || v?.color_hex || '';
    const variantColorData = { colorName, colorHex };
    
    // Prefer precise variant → media map when available
    const mediaId = map.byVariantId && map.byVariantId[v.id];
    if (mediaId) { 
      safeJump(mediaId, 'instant', variantColorData); 
      return; 
    }
    // else try color
    handleColorChange(v.option1 || v.options?.[0]);
  });

  document.addEventListener('variant:changed', (ev) => {
    const v = ev.detail && (ev.detail.variant || ev.detail);
    if (!v) return;
    
    // Extract color data from variant
    // Try option1 first (usually color), then check options array
    const colorName = v.option1 || (v.options && v.options[0]) || '';
    const colorHex = v?.metafields?.custom?.color_hex || v?.color_hex || '';
    const variantColorData = { colorName, colorHex };
    
    const mediaId = map.byVariantId && map.byVariantId[v.id];
    if (mediaId) { 
      safeJump(mediaId, 'instant', variantColorData); 
      return; 
    }
    handleColorChange(v.option1 || v.options?.[0]);
  });
})();

/* === MCC Merch — Peek <-> Picker color sync (single source of truth) === */
(function(){
  const section = document.getElementById('product_merch_mobile');
  if (!section || section.__mmColorSync) return; section.__mmColorSync = true;

  const form   = section.querySelector('[data-product-form]') || document.querySelector('form[action*="/cart/add"]');
  const peek   = section.querySelector('[data-mm-peek]');
  const elName = peek?.querySelector('[data-color-name]');
  const elSw   = peek?.querySelector('[data-swatch]');
  if (!form || !peek || !elName || !elSw) return;

  const norm = s => (s||'').toString().trim();
  const lower = s => norm(s).toLowerCase();

  const MAP = {
    black:'#000', white:'#fff', offwhite:'#f6f6f6', cream:'#efe9dc', natural:'#e7dfcf',
    grey:'#808080', gray:'#808080', charcoal:'#333', silver:'#c9c9c9',
    brown:'#5a402e', tan:'#d2b48c', camel:'#b88a55', khaki:'#c3b091',
    red:'#c62828', orange:'#ef6c00', rust:'#b3572f', copper:'#b87333', cranberry:'#9f1632',
    yellow:'#f2c200', mustard:'#d4a017', gold:'#c49a41',
    green:'#2e7d32', forest:'#205c2d', olive:'#556b2f', mint:'#a6e3c6', evergreen:'#1b5e20', moss:'#8a9a5b',
    teal:'#008080', blue:'#1565c0', navy:'#0d1b3c', sky:'#87ceeb', 'light blue':'#add8e6',
    purple:'#6a1b9a', lavender:'#b57edc', pink:'#e91e63', 'hot pink':'#e91e63',
    caramel:'#af6e4d', 'heather gray':'#b2b2b2', 'heather grey':'#b2b2b2', 'dark gray':'#4a4a4a', 'dark grey':'#4a4a4a'
  };

  function setSwatch(nameOrHex){
    const v = norm(nameOrHex);
    if (!v) return;
    
    // Check for bicolor (contains "/")
    if (v.includes('/')) {
      const parts = v.split('/').map(p => norm(p));
      if (parts.length === 2) {
        const color1 = parts[0];
        const color2 = parts[1];
        const hex1 = MAP[lower(color1)] || '#ddd';
        const hex2 = MAP[lower(color2)] || '#ddd';
        // Use linear gradient for split swatch (left half = color1, right half = color2)
        const gradient = `linear-gradient(to right, ${hex1} 0%, ${hex1} 50%, ${hex2} 50%, ${hex2} 100%)`;
        elSw.style.background = gradient;
        elSw.style.backgroundColor = hex1; // Fallback to first color
        elSw.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,.08)';
        return;
      }
    }
    
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)){
      elSw.style.background = v;
      elSw.style.backgroundColor = v; // Explicit fallback
      elSw.style.setProperty('background-color', v, 'important'); // Force with !important
      const light = ['#fff','#ffffff','#f6f6f6','#efe9dc','#e7dfcf','#c9c9c9'].includes(v.toLowerCase());
      elSw.style.boxShadow = light ? 'inset 0 0 0 1px rgba(0,0,0,.25)' : 'inset 0 0 0 1px rgba(0,0,0,.08)';
      return;
    }
    
    // Normalize color name for lookup (handle case variations)
    const colorKey = lower(v);
    const hex = MAP[colorKey] || '#ddd';
    
    // Special handling for black to ensure it's truly black
    if (colorKey === 'black' || v.toLowerCase().trim() === 'black') {
      elSw.style.background = '#000000';
      elSw.style.backgroundColor = '#000000';
      elSw.style.setProperty('background-color', '#000000', 'important');
      elSw.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,.08)';
      return;
    }
    
    elSw.style.background = hex;
    elSw.style.backgroundColor = hex; // Explicit fallback
    const needsRing = ['white','offwhite','cream','natural','silver'].includes(colorKey);
    elSw.style.boxShadow = needsRing ? 'inset 0 0 0 1px rgba(0,0,0,.25)' : 'inset 0 0 0 1px rgba(0,0,0,.08)';
  }

  function readColorFromPicker(){
    let input = form.querySelector('input[name="options[Color]"]:checked, input[name="options[color]"]:checked');
    if (input) return norm(input.value || input.getAttribute('data-option-value') || input.getAttribute('aria-label'));
    let sel = form.querySelector('select[name="options[Color]"], select[name="options[color]"]');
    if (sel) return norm(sel.value || sel.options[sel.selectedIndex]?.text);
    let any = form.querySelector('[data-option-name="Color"], [data-option-name="color"]');
    if (any) return norm(any.value || any.getAttribute('data-option-value') || any.getAttribute('aria-label'));
    return '';
  }

  function readHexFromVariant(){
    const v = form.dataset?.selectedVariant ? JSON.parse(form.dataset.selectedVariant) : null;
    if (v?.metafields?.custom?.color_hex) return v.metafields.custom.color_hex;
    return '';
  }

  function syncPeek(explicitName, explicitHex){
    // If explicit values provided, use them directly (from gallery or variant)
    // Otherwise fall back to reading from picker
    const name = explicitName !== undefined && explicitName !== null && explicitName !== '' 
      ? norm(explicitName) 
      : readColorFromPicker();
    const hex = explicitHex !== undefined && explicitHex !== null && explicitHex !== ''
      ? norm(explicitHex)
      : readHexFromVariant();
    
    if (!name) return;
    elName.textContent = name;
    setSwatch(hex || name);
  }

  form.addEventListener('change', (e)=>{
    const t = e.target;
    if (!t) return;
    if (t.matches('input[name="options[Color]"], input[name="options[color]"], select[name="options[Color]"], select[name="options[color]"]')){
      syncPeek();
    }
  }, true);

  ['variant:change','variant:changed'].forEach(evt=>{
    document.addEventListener(evt, (e)=>{
      const v = e.detail && (e.detail.variant || e.detail);
      const name = v ? (v.option1 || v.options?.[0] || '') : '';
      const hex  = v?.metafields?.custom?.color_hex || v?.color_hex || '';
      syncPeek(name, hex);
    });
  });

  document.addEventListener('gallery:slide', (e)=>{
    const d = e.detail || {};
    const colorName = d.colorName || '';
    const colorHex = d.colorHex || '';
    // Only update if we have color data from the gallery
    // Don't fall back to picker - let the peek component handle that
    if (colorName || colorHex) {
      syncPeek(colorName, colorHex);
    }
  });

  const idInput = form.querySelector('input[name="id"]');
  if (idInput) {
    const mo = new MutationObserver(()=> syncPeek());
    mo.observe(idInput, { attributes:true, attributeFilter:['value'] });
  }

  requestAnimationFrame(syncPeek);
})();

/* ===== Merch Mobile — Auto-open cart drawer on Add to Cart ===== */
(function(){
  // Works for Dawn's native cart drawer or other cart-drawer JS
  function openCartDrawer(){
    // Prevent scroll when opening drawer
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Dawn
    const cartDrawer = document.querySelector('cart-drawer, #CartDrawer, [data-cart-drawer]');
    if (cartDrawer && typeof cartDrawer.open === 'function') {
      cartDrawer.open();
      // Maintain scroll position
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY);
      });
      return true;
    }

    // Other custom drawers (Loop, Recharge, etc.)
    const btn = document.querySelector('[data-cart-toggle], .cart-toggle, [aria-controls="CartDrawer"]');
    if (btn) { 
      btn.click(); 
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY);
      });
      return true; 
    }

    return false;
  }

  // 1️⃣ Catch Dawn's cart events (Shopify's standard)
  document.addEventListener('cart:updated', openCartDrawer);
  document.addEventListener('cart:change', openCartDrawer);

  // 2️⃣ Fallback: intercept form submissions if Dawn doesn't emit events
  // Match merch mobile form specifically
  document.addEventListener('submit', (e)=>{
    const form = e.target;
    if (form && (form.matches('form[action*="/cart/add"]') || form.matches('form[data-product-form]') || form.id === 'mcc-merch-form')) {
      // Prevent scroll
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      // small delay so the item is added first
      setTimeout(() => {
        openCartDrawer();
        // Ensure scroll position is maintained
        requestAnimationFrame(() => {
          window.scrollTo(scrollX, scrollY);
        });
      }, 800);
    }
  });
})();

/* ===== Auto-open Cart Drawer after add ===== */
(function(){
  function openCartUI(){
    // Prevent scroll when opening drawer
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Dawn v7+ <cart-drawer> component
    const drawer = document.querySelector('cart-drawer');
    if (drawer && typeof drawer.open === 'function') { 
      drawer.open(); 
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY);
      });
      return true; 
    }

    // Older Dawn <cart-notification> component
    const note = document.querySelector('cart-notification');
    if (note && typeof note.open === 'function') { 
      note.open(); 
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY);
      });
      return true; 
    }

    // Common toggles used by themes/apps
    const toggle = document.querySelector('[data-cart-toggle], .cart-toggle, [aria-controls="CartDrawer"]');
    if (toggle) { 
      toggle.click(); 
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY);
      });
      return true; 
    }

    // Last-ditch: emit a custom event some themes listen to
    document.dispatchEvent(new CustomEvent('open:cart'));
    return false;
  }

  // Listen for Shopify/Dawn events
  document.addEventListener('cart:updated', openCartUI);
  document.addEventListener('cart:change',  openCartUI);

  // Fallback: after form submit to /cart/add
  // Match merch mobile form specifically
  document.addEventListener('submit', (e)=>{
    const f = e.target;
    if (f && (f.matches('form[action*="/cart/add"]') || f.matches('form[data-product-form]') || f.id === 'mcc-merch-form')) {
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      setTimeout(() => {
        openCartUI();
        requestAnimationFrame(() => {
          window.scrollTo(scrollX, scrollY);
        });
      }, 700);
    }
  });
})();
