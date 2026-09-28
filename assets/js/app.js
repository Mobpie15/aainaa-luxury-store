/**
 * AAINAA DESIGNS — CORE CLIENT APPLICATION & COMPLETE E-COMMERCE SUITE
 * The Luxury of Simplicity • Kakkanad, Kochi, Kerala
 * Includes: Bag Drawer, Wishlist Engine, Instant D2C Checkout & Payment Simulator, WhatsApp VIP Bridge
 */

(function () {
  'use strict';

  // --- Persistent State ---
  let cart = JSON.parse(localStorage.getItem('aainaa_cart')) || [];
  let wishlist = JSON.parse(localStorage.getItem('aainaa_wishlist')) || [];
  let currentCategory = 'All';
  let searchQuery = '';
  let activeCoupon = null; // { code: 'AAINAA10', discountPercent: 10 }
  let activeCheckoutItems = [];
  const WHATSAPP_NUMBER = '916282719098';

  // --- DOM Elements ---
  const productsGrid = document.getElementById('products-grid');
  const cartDrawer = document.getElementById('cart-drawer');
  const wishlistDrawer = document.getElementById('wishlist-drawer');
  const checkoutModal = document.getElementById('checkout-modal');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const cartCountBadges = document.querySelectorAll('.cart-count-badge');
  const wishlistCountBadges = document.querySelectorAll('.wishlist-count-badge');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartEmptyState = document.getElementById('cart-empty-state');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartShippingBar = document.getElementById('cart-shipping-bar');
  const shippingText = document.getElementById('shipping-text');
  const quickViewModal = document.getElementById('quick-view-modal');
  const quickViewContent = document.getElementById('quick-view-content');
  const toastContainer = document.getElementById('toast-container');
  const filterPills = document.querySelectorAll('.filter-pill');
  const searchInput = document.getElementById('search-input');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');

  // --- Robust Mobile-Safe Initialization ---
  function initApp() {
    try {
      initNavigationScroll();
      renderProducts();
      updateCartUI();
      updateWishlistUI();
      setupEventListeners();
    } catch (err) {
      console.error('AAINAA App Init Error:', err);
    } finally {
      initScrollObserver();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  // --- Format Currency (INR) ---
  function formatINR(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });
  }
  window.formatINR = formatINR;

  // --- Silk-Smooth Mobile & Desktop Scroll & Reveal Observer ---
  function initScrollObserver() {
    const items = document.querySelectorAll('.appear-on-scroll, .appear-scale, .appear-left, .appear-right, .reveal, .reveal-scale, .reveal-left, .reveal-right');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('appeared', 'visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('appeared', 'visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.01,
      rootMargin: '80px 0px 80px 0px'
    });

    items.forEach((el, index) => {
      if (el.classList.contains('appeared') || el.classList.contains('visible')) return;

      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;

      if (inView) {
        // In viewport on page load: trigger smooth staggered entrance
        setTimeout(() => {
          el.classList.add('appeared', 'visible');
        }, 60 + (index % 4) * 60);
      } else {
        // Below fold: observe as user scrolls
        observer.observe(el);
      }
    });

    // Mobile scroll fallback: checks unrevealed elements only as user actually scrolls
    if (!window._scrollFallbackBound) {
      window._scrollFallbackBound = true;
      let ticking = false;
      const checkPending = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const pending = document.querySelectorAll('.appear-on-scroll:not(.appeared), .appear-scale:not(.appeared), .appear-left:not(.appeared), .appear-right:not(.appeared)');
            const vh = window.innerHeight;
            pending.forEach(el => {
              const r = el.getBoundingClientRect();
              if (r.top < vh + 100) {
                el.classList.add('appeared', 'visible');
              }
            });
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener('scroll', checkPending, { passive: true });
      window.addEventListener('touchmove', checkPending, { passive: true });
    }
  }

  // --- Scroll Effects ---
  function initNavigationScroll() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  // --- Product Filtering & Rendering ---
  function getFilteredProducts() {
    let items = window.AAINAA_PRODUCTS || [];
    if (currentCategory !== 'All') {
      items = items.filter(p => p.category === currentCategory);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      items = items.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q) ||
        p.craft.toLowerCase().includes(q)
      );
    }
    return items;
  }

  function renderProducts() {
    if (!productsGrid) return;
    const items = getFilteredProducts();

    if (items.length === 0) {
      productsGrid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <p class="font-serif text-2xl text-[var(--text-muted)] italic">No silhouettes found matching your selection.</p>
          <button onclick="window.resetFilters()" class="mt-4 px-6 py-2.5 btn-outline-gold rounded-full text-xs uppercase tracking-widest font-semibold">
            Reset Filters
          </button>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = items.map((product, idx) => {
      const originalPriceHtml = product.originalPrice
        ? `<span class="text-[10px] sm:text-xs text-stone-400 line-through ml-1.5">${formatINR(product.originalPrice)}</span>`
        : '';

      const badgeHtml = product.badge
        ? `<span class="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold rounded-full badge-gold shadow-sm">${product.badge}</span>`
        : '';

      const isMobile = window.innerWidth < 768;
      const staggerDelay = isMobile ? (idx % 2) * 110 : (idx % 4) * 80;
      const isWishlisted = wishlist.includes(product.id);

      return `
        <div class="luxury-card appear-on-scroll group bg-[var(--bg-surface)] rounded-2xl overflow-hidden border border-[var(--border-subtle)] hover:border-[var(--border-gold)] transition-all flex flex-col justify-between" style="transition-delay: ${staggerDelay}ms;">
          <div>
            <div class="luxury-image-wrapper relative aspect-[3/4] w-full cursor-pointer">
              ${badgeHtml}
              
              <!-- Wishlist Heart Button -->
              <button onclick="event.stopPropagation(); window.toggleWishlist(${product.id})" class="wishlist-btn absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-stone-200 flex items-center justify-center text-stone-400 hover:text-rose-600 transition-all ${isWishlisted ? 'active text-rose-600' : ''}" title="${isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>

              <!-- Image routes to Product Details -->
              <a href="product.html?id=${product.id}" class="block w-full h-full">
                <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover object-top" loading="lazy">
              </a>
            </div>

            <div class="p-3 sm:p-4 pb-1">
              <span class="text-[9px] sm:text-[10px] text-[var(--accent-gold-dark)] uppercase tracking-wider font-semibold block truncate">${product.fabric} • ${product.craft}</span>
              <h3 class="font-serif text-xs sm:text-sm md:text-base font-medium text-stone-900 leading-snug line-clamp-2 hover:text-[var(--accent-gold-dark)] cursor-pointer mt-0.5">
                <a href="product.html?id=${product.id}">${product.title}</a>
              </h3>
            </div>
          </div>

          <div class="p-3 sm:p-4 pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
            <div class="min-w-0">
              <span class="text-xs sm:text-sm font-bold text-stone-900 block truncate">${formatINR(product.price)}</span>
              ${originalPriceHtml}
            </div>

            <!-- 1-Tap Mobile Shopping Quick-Add Sheet Button -->
            <button onclick="event.stopPropagation(); window.openQuickAddSheet(${product.id})" class="px-2.5 sm:px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-1 shadow-sm transition-transform active:scale-95" title="Quick Add">
              <span>+ Add</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    setTimeout(initScrollObserver, 40);
  }

  // --- Quick-Add Bottom Sheet System ---
  const quickAddSheet = document.getElementById('quick-add-sheet');

  window.openQuickAddSheet = function (productId) {
    const product = (window.AAINAA_PRODUCTS || []).find(p => p.id === productId);
    if (!product) return;

    const sheet = document.getElementById('quick-add-sheet');
    const backdrop = document.getElementById('drawer-backdrop');
    if (!sheet || !backdrop) return;

    let selectedSize = product.sizes && product.sizes.length ? product.sizes[0] : 'Standard';
    window.currentSheetProduct = product;
    window.currentSheetSize = selectedSize;
    window.currentSheetQty = 1;

    sheet.innerHTML = `
      <div class="p-5 sm:p-6 max-w-lg mx-auto">
        <div class="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-4 lg:hidden"></div>

        <div class="flex items-start justify-between pb-4 border-b border-stone-100">
          <div class="flex items-center gap-3">
            <a href="product.html?id=${product.id}">
              <img src="${product.image}" alt="${product.title}" class="w-14 h-18 object-cover rounded-xl bg-stone-100 flex-shrink-0">
            </a>
            <div class="min-w-0">
              <span class="text-[10px] text-[var(--accent-gold-dark)] uppercase tracking-wider font-semibold block truncate">${product.fabric} • ${product.craft}</span>
              <h3 class="font-serif text-sm sm:text-base font-medium text-stone-900 leading-snug line-clamp-2">
                <a href="product.html?id=${product.id}">${product.title}</a>
              </h3>
              <p class="text-sm font-bold text-stone-900 mt-1">${formatINR(product.price)}</p>
            </div>
          </div>
          <button onclick="window.closeQuickAddSheet()" class="p-1.5 text-stone-400 hover:text-stone-900 text-sm">✕</button>
        </div>

        <!-- Size Selector -->
        <div class="py-4">
          <div class="flex items-center justify-between mb-2">
            <label class="text-[11px] font-semibold uppercase tracking-wider text-stone-700">Select Size</label>
            <a href="product.html?id=${product.id}" class="text-[10px] text-[var(--accent-gold-dark)] font-semibold uppercase hover:underline">Size Guide & Specs →</a>
          </div>
          <div class="flex flex-wrap gap-2" id="sheet-sizes-row">
            ${product.sizes.map((s, idx) => `
              <button type="button" onclick="window.selectSheetSize(this, '${s}')" class="sheet-size-pill px-3 py-1.5 rounded-xl text-xs font-semibold border ${idx === 0 ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 text-stone-700 hover:border-stone-400'} transition-all">
                ${s}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Quantity Stepper -->
        <div class="flex items-center justify-between py-2 border-t border-stone-100 mb-4 text-xs">
          <span class="font-semibold uppercase tracking-wider text-stone-700">Quantity</span>
          <div class="flex items-center border border-stone-200 rounded-lg overflow-hidden">
            <button onclick="window.adjustSheetQty(-1)" class="w-8 h-8 flex items-center justify-center font-bold hover:bg-stone-100 transition-colors">-</button>
            <span id="sheet-qty-val" class="w-10 text-center font-bold text-stone-900">1</span>
            <button onclick="window.adjustSheetQty(1)" class="w-8 h-8 flex items-center justify-center font-bold hover:bg-stone-100 transition-colors">+</button>
          </div>
        </div>

        <!-- Primary Action CTAs -->
        <div class="space-y-2 pt-1">
          <button onclick="window.confirmSheetAddToBag(${product.id})" class="w-full py-3.5 btn-gold rounded-xl text-xs font-bold uppercase tracking-widest shadow-md flex items-center justify-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <span>Add to Bag</span>
          </button>

          <button onclick="window.confirmSheetBuyNow(${product.id})" class="w-full py-3 btn-dark rounded-xl text-xs font-bold uppercase tracking-widest shadow-md flex items-center justify-center gap-2">
            <span>Instant Checkout (UPI / Cards)</span>
          </button>

          <button onclick="window.confirmSheetWhatsApp(${product.id})" class="w-full py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
            <span>Order via WhatsApp VIP</span>
          </button>
        </div>

        <p class="text-[10px] text-center text-stone-400 mt-3">Free Express Delivery on orders above ₹2,500 • Kochi Atelier Handcraft</p>
      </div>
    `;

    backdrop.classList.add('active');
    sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.selectSheetSize = function (btn, size) {
    window.currentSheetSize = size;
    document.querySelectorAll('#sheet-sizes-row .sheet-size-pill').forEach(b => {
      b.className = 'sheet-size-pill px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-200 text-stone-700 hover:border-stone-400 transition-all';
    });
    btn.className = 'sheet-size-pill px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-900 bg-stone-900 text-white transition-all';
  };

  window.adjustSheetQty = function (delta) {
    window.currentSheetQty = Math.max(1, Math.min(10, (window.currentSheetQty || 1) + delta));
    const valEl = document.getElementById('sheet-qty-val');
    if (valEl) valEl.textContent = window.currentSheetQty;
  };

  window.closeQuickAddSheet = function () {
    const sheet = document.getElementById('quick-add-sheet');
    const backdrop = document.getElementById('drawer-backdrop');
    if (sheet) sheet.classList.remove('open');
    if (backdrop && (!cartDrawer || !cartDrawer.classList.contains('open')) && (!wishlistDrawer || !wishlistDrawer.classList.contains('open')) && (!mobileMenuDrawer || !mobileMenuDrawer.classList.contains('open'))) {
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  window.confirmSheetAddToBag = function (productId) {
    window.addToCart(productId, window.currentSheetSize || 'Standard', window.currentSheetQty || 1);
    window.closeQuickAddSheet();
  };

  window.confirmSheetBuyNow = function (productId) {
    window.closeQuickAddSheet();
    window.openCheckoutSingle(productId, window.currentSheetSize || 'Standard');
  };

  window.confirmSheetWhatsApp = function (productId) {
    const product = (window.AAINAA_PRODUCTS || []).find(p => p.id === productId);
    if (!product) return;
    const text = `Hello Jaleena / AAINAA Studio,\nI would like to order: *${product.title}*\nSize: *${window.currentSheetSize || 'Standard'}* | Quantity: ${window.currentSheetQty || 1}\nPrice: ${formatINR(product.price * (window.currentSheetQty || 1))}\n\nPlease confirm availability and studio UPI details.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // --- Wishlist System ---
  function saveWishlist() {
    localStorage.setItem('aainaa_wishlist', JSON.stringify(wishlist));
    updateWishlistUI();
  }

  window.toggleWishlist = function (productId) {
    const product = (window.AAINAA_PRODUCTS || []).find(p => p.id === productId);
    if (!product) return;

    const idx = wishlist.indexOf(productId);
    if (idx > -1) {
      wishlist.splice(idx, 1);
      showToast(`Removed "${product.title}" from your wishlist`);
    } else {
      wishlist.push(productId);
      showToast(`Saved "${product.title}" to your wishlist`);
    }
    saveWishlist();
    renderProducts();
  };

  window.isInWishlist = function (productId) {
    return wishlist.includes(productId);
  };

  function updateWishlistUI() {
    wishlistCountBadges.forEach(b => {
      b.textContent = wishlist.length;
      b.style.display = wishlist.length > 0 ? 'inline-flex' : 'none';
    });

    const wishlistContainer = document.getElementById('wishlist-items-container');
    const wishlistEmpty = document.getElementById('wishlist-empty-state');
    if (!wishlistContainer || !wishlistEmpty) return;

    if (wishlist.length === 0) {
      wishlistContainer.classList.add('hidden');
      wishlistEmpty.classList.remove('hidden');
      return;
    }

    wishlistEmpty.classList.add('hidden');
    wishlistContainer.classList.remove('hidden');

    const products = (window.AAINAA_PRODUCTS || []).filter(p => wishlist.includes(p.id));
    wishlistContainer.innerHTML = products.map(item => `
      <div class="flex items-center gap-4 py-4 border-b border-[var(--border-subtle)]">
        <a href="product.html?id=${item.id}">
          <img src="${item.image}" alt="${item.title}" class="w-16 h-20 object-cover rounded-xl bg-stone-100 flex-shrink-0">
        </a>
        <div class="flex-grow min-w-0">
          <h4 class="text-sm font-medium text-[var(--text-ink)] truncate font-serif text-base hover:text-[var(--accent-gold-dark)]">
            <a href="product.html?id=${item.id}">${item.title}</a>
          </h4>
          <p class="text-xs text-[var(--accent-gold-dark)] font-semibold mt-0.5">${formatINR(item.price)}</p>
          <div class="flex items-center gap-2 mt-2">
            <button onclick="window.moveToBagFromWishlist(${item.id})" class="px-3 py-1 btn-gold rounded-lg text-[10px] font-bold uppercase tracking-wider">
              Move to Bag
            </button>
            <button onclick="window.toggleWishlist(${item.id})" class="text-xs text-stone-400 hover:text-rose-500">
              Remove
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.moveToBagFromWishlist = function (productId) {
    window.quickAddToCart(productId);
    const idx = wishlist.indexOf(productId);
    if (idx > -1) {
      wishlist.splice(idx, 1);
      saveWishlist();
    }
  };

  window.openWishlist = function () {
    if (wishlistDrawer && drawerBackdrop) {
      window.closeCart();
      drawerBackdrop.classList.add('active');
      wishlistDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeWishlist = function () {
    if (wishlistDrawer && drawerBackdrop) {
      wishlistDrawer.classList.remove('open');
      drawerBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // --- Cart Drawer System ---
  function saveCart() {
    localStorage.setItem('aainaa_cart', JSON.stringify(cart));
    updateCartUI();
  }

  function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadges.forEach(b => {
      b.textContent = totalCount;
      b.style.display = totalCount > 0 ? 'inline-flex' : 'none';
    });

    if (!cartItemsContainer || !cartEmptyState) return;

    if (cart.length === 0) {
      cartItemsContainer.classList.add('hidden');
      cartEmptyState.classList.remove('hidden');
      if (cartSubtotalEl) cartSubtotalEl.textContent = '₹0';
      if (cartShippingBar) cartShippingBar.style.width = '0%';
      if (shippingText) shippingText.textContent = 'Add ₹2,500 more for Free Worldwide Express Shipping';
      return;
    }

    cartEmptyState.classList.add('hidden');
    cartItemsContainer.classList.remove('hidden');

    let subtotal = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      return `
        <div class="flex items-center gap-4 py-4 border-b border-[var(--border-subtle)]">
          <a href="product.html?id=${item.id}">
            <img src="${item.image}" alt="${item.title}" class="w-16 h-20 object-cover rounded-xl bg-stone-100 flex-shrink-0">
          </a>
          <div class="flex-grow min-w-0">
            <h4 class="text-sm font-medium text-[var(--text-ink)] truncate font-serif text-base hover:text-[var(--accent-gold-dark)]">
              <a href="product.html?id=${item.id}">${item.title}</a>
            </h4>
            <p class="text-xs text-[var(--text-muted)] mt-0.5">Size: <span class="font-medium text-[var(--text-ink)]">${item.size}</span></p>
            <div class="flex items-center justify-between mt-2.5">
              <div class="flex items-center border border-[var(--border-medium)] rounded-lg overflow-hidden">
                <button onclick="window.updateQuantity(${item.id}, '${item.size}', -1)" class="w-7 h-7 flex items-center justify-center text-xs hover:bg-stone-100 transition-colors">-</button>
                <span class="w-8 text-center text-xs font-semibold">${item.quantity}</span>
                <button onclick="window.updateQuantity(${item.id}, '${item.size}', 1)" class="w-7 h-7 flex items-center justify-center text-xs hover:bg-stone-100 transition-colors">+</button>
              </div>
              <span class="text-sm font-semibold text-[var(--text-ink)]">${formatINR(itemTotal)}</span>
            </div>
          </div>
          <button onclick="window.removeFromCart(${item.id}, '${item.size}')" class="text-stone-400 hover:text-red-500 transition-colors p-1" title="Remove">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;
    }).join('');

    if (cartSubtotalEl) {
      cartSubtotalEl.textContent = formatINR(subtotal);
    }

    const threshold = 2500;
    if (cartShippingBar && shippingText) {
      const percent = Math.min(100, (subtotal / threshold) * 100);
      cartShippingBar.style.width = `${percent}%`;
      if (subtotal >= threshold) {
        shippingText.innerHTML = `<span class="text-emerald-700 font-medium">✓ You qualify for Free Worldwide Express Delivery!</span>`;
      } else {
        const remaining = threshold - subtotal;
        shippingText.textContent = `Add ${formatINR(remaining)} more for Free Express Delivery`;
      }
    }
  }

  // --- Cart Operations ---
  window.addToCart = function (productId, size = 'M', quantity = 1) {
    const product = (window.AAINAA_PRODUCTS || []).find(p => p.id === productId);
    if (!product) return;

    const existingIndex = cart.findIndex(i => i.id === productId && i.size === size);
    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        size: size,
        quantity: quantity
      });
    }

    saveCart();
    showToast(`Added to your bespoke bag: "${product.title}" (${size})`);
    window.openCart();
  };

  window.quickAddToCart = function (productId) {
    const product = (window.AAINAA_PRODUCTS || []).find(p => p.id === productId);
    if (!product) return;
    const defaultSize = product.sizes && product.sizes.length ? product.sizes[0] : 'Standard';
    window.addToCart(productId, defaultSize, 1);
  };

  window.updateQuantity = function (productId, size, delta) {
    const itemIndex = cart.findIndex(i => i.id === productId && i.size === size);
    if (itemIndex === -1) return;

    cart[itemIndex].quantity += delta;
    if (cart[itemIndex].quantity <= 0) {
      cart.splice(itemIndex, 1);
    }
    saveCart();
  };

  window.removeFromCart = function (productId, size) {
    cart = cart.filter(i => !(i.id === productId && i.size === size));
    saveCart();
  };

  window.openCart = function () {
    if (cartDrawer && drawerBackdrop) {
      window.closeWishlist();
      drawerBackdrop.classList.add('active');
      cartDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeCart = function () {
    if (cartDrawer && drawerBackdrop) {
      cartDrawer.classList.remove('open');
      if (!wishlistDrawer || !wishlistDrawer.classList.contains('open')) {
        drawerBackdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  };

  // --- WhatsApp Order Bridge ---
  window.checkoutViaWhatsApp = function () {
    if (cart.length === 0) return;

    let subtotal = 0;
    let orderLines = cart.map((item, idx) => {
      const lineCost = item.price * item.quantity;
      subtotal += lineCost;
      return `${idx + 1}. *${item.title}*\n   Size: ${item.size} | Qty: ${item.quantity} | ${formatINR(lineCost)}`;
    }).join('\n\n');

    const message = `*AAINAA DESIGNS — BESPOKE ORDER REQUEST*\n` +
      `----------------------------------------\n\n` +
      `Hello Jaleena / AAINAA Studio Team,\n` +
      `I would like to place an order from your online catalog:\n\n` +
      `${orderLines}\n\n` +
      `----------------------------------------\n` +
      `*Estimated Subtotal:* ${formatINR(subtotal)}\n` +
      `*Delivery:* Pan-India & Worldwide Express\n\n` +
      `Please confirm piece availability, custom sizing options, and your official studio UPI/Bank payment details. Thank you!`;

    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  // --- Quick View Modal ---
  window.openQuickView = function (productId) {
    const product = (window.AAINAA_PRODUCTS || []).find(p => p.id === productId);
    if (!product || !quickViewModal || !quickViewContent) return;

    let selectedSize = product.sizes && product.sizes.length ? product.sizes[0] : 'Standard';

    quickViewContent.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div class="luxury-image-wrapper rounded-2xl overflow-hidden aspect-[3/4] bg-stone-100 shadow-md">
          <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover object-top">
        </div>
        <div class="flex flex-col justify-between h-full">
          <div>
            <div class="flex items-center gap-2 mb-2 text-xs font-semibold tracking-widest text-[var(--accent-gold-dark)] uppercase">
              <span>${product.fabric}</span>
              <span>•</span>
              <span>${product.craft}</span>
            </div>
            <h2 class="font-serif text-2xl md:text-3xl font-medium text-[var(--text-ink)] leading-snug mb-3">
              ${product.title}
            </h2>
            <div class="flex items-baseline gap-3 mb-6">
              <span class="text-2xl font-bold text-[var(--text-ink)]">${formatINR(product.price)}</span>
              ${product.originalPrice ? `<span class="text-sm text-[var(--text-light)] line-through">${formatINR(product.originalPrice)}</span>` : ''}
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">In Stock • Kochi Studio</span>
            </div>
            
            <p class="text-xs text-[var(--text-muted)] leading-relaxed mb-6 line-clamp-4">
              ${product.description}
            </p>

            <div class="mb-6">
              <label class="block text-xs font-semibold uppercase tracking-wider text-[var(--text-ink)] mb-2.5">
                Select Silhouette Size / Cut:
              </label>
              <div class="flex flex-wrap gap-2" id="quick-view-sizes">
                ${product.sizes.map((s, idx) => `
                  <button type="button" onclick="window.selectModalSize(this, '${s}')" class="size-pill px-3.5 py-2 rounded-xl text-xs font-medium border ${idx === 0 ? 'border-[var(--text-ink)] bg-[var(--text-ink)] text-white' : 'border-stone-200 hover:border-stone-400 text-stone-700'} transition-all">
                    ${s}
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="p-3 bg-stone-50 rounded-xl border border-stone-200/60 mb-6 text-xs text-[var(--text-muted)] space-y-1">
              <p>✓ 100% Authentic Handcrafted Fabric with Pure Fall</p>
              <p>✓ Custom Made-to-Measure Alterations available upon request</p>
            </div>
          </div>

          <div class="pt-4 border-t border-[var(--border-subtle)] flex flex-col gap-2.5">
            <div class="flex gap-2">
              <button onclick="window.addToCart(${product.id}, window.currentSelectedModalSize || '${selectedSize}'); window.closeQuickView();" class="flex-1 py-3 btn-gold rounded-xl text-xs font-bold uppercase tracking-widest shadow-md">
                Add to Bag
              </button>
              <button onclick="window.openCheckoutSingle(${product.id}, window.currentSelectedModalSize || '${selectedSize}')" class="flex-1 py-3 btn-dark rounded-xl text-xs font-bold uppercase tracking-widest shadow-md">
                Buy Now
              </button>
            </div>
            <a href="product.html?id=${product.id}" class="text-center text-xs font-semibold text-[var(--accent-gold-dark)] hover:underline pt-1">
              View Complete Product Page with Size Guide & Reviews →
            </a>
          </div>
        </div>
      </div>
    `;

    window.currentSelectedModalSize = selectedSize;
    quickViewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.selectModalSize = function (btn, size) {
    window.currentSelectedModalSize = size;
    document.querySelectorAll('#quick-view-sizes .size-pill').forEach(el => {
      el.className = 'size-pill px-3.5 py-2 rounded-xl text-xs font-medium border border-stone-200 hover:border-stone-400 text-stone-700 transition-all';
    });
    btn.className = 'size-pill px-3.5 py-2 rounded-xl text-xs font-medium border border-[var(--text-ink)] bg-[var(--text-ink)] text-white transition-all';
  };

  window.closeQuickView = function () {
    if (quickViewModal) {
      quickViewModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // --- D2C CHECKOUT & PAYMENT MODAL ENGINE ---
  window.openCheckout = function () {
    if (cart.length === 0) {
      showToast('Your bag is empty. Please add silhouettes to proceed.');
      return;
    }
    activeCheckoutItems = [...cart];
    renderCheckoutModal();
  };

  window.openCheckoutSingle = function (productId, size = 'M') {
    const product = (window.AAINAA_PRODUCTS || []).find(p => p.id === productId);
    if (!product) return;
    activeCheckoutItems = [{
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      size: size,
      quantity: 1
    }];
    window.closeQuickView();
    renderCheckoutModal();
  };

  function renderCheckoutModal() {
    if (!checkoutModal) return;

    window.closeCart();
    let subtotal = activeCheckoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let shipping = subtotal >= 2500 ? 0 : 150;
    let discount = 0;
    if (activeCoupon) {
      discount = Math.round((subtotal * activeCoupon.discountPercent) / 100);
    }
    let total = Math.max(0, subtotal - discount + shipping);

    const itemsSummaryHtml = activeCheckoutItems.map(item => `
      <div class="flex items-center gap-3 py-2 text-xs">
        <img src="${item.image}" alt="${item.title}" class="w-10 h-12 object-cover rounded-lg bg-stone-100 flex-shrink-0">
        <div class="flex-grow min-w-0">
          <p class="font-medium text-stone-900 truncate">${item.title}</p>
          <p class="text-stone-500 text-[11px]">Size: ${item.size} × ${item.quantity}</p>
        </div>
        <span class="font-semibold text-stone-900">${formatINR(item.price * item.quantity)}</span>
      </div>
    `).join('');

    checkoutModal.innerHTML = `
      <div class="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto shadow-2xl border border-[var(--border-subtle)]" id="checkout-modal-inner">
        <button onclick="window.closeCheckout()" class="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-900 rounded-full transition-colors z-10" aria-label="Close Checkout">
          ✕
        </button>

        <div class="flex items-center gap-3 pb-4 border-b border-stone-200">
          <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
            🔒
          </div>
          <div>
            <h2 class="font-serif text-2xl font-medium text-stone-900">Secure Checkout</h2>
            <p class="text-xs text-stone-500">Encrypted 256-bit SSL • Official AAINAA Atelier Gateway</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 mt-6">
          
          <!-- Left: Customer Form & Payment -->
          <div class="md:col-span-7 space-y-6">
            
            <!-- Step 1: Customer Contact -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold uppercase tracking-wider text-stone-900">1. Delivery Address</h3>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <input type="text" id="co-name" placeholder="Full Name *" required class="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900">
                <input type="tel" id="co-phone" placeholder="Phone / WhatsApp *" required class="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900">
              </div>
              <input type="email" id="co-email" placeholder="Email Address (for invoice)" class="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900">
              <input type="text" id="co-address" placeholder="Flat, Street Address *" required class="w-full p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900">
              <div class="grid grid-cols-3 gap-2 text-xs">
                <input type="text" id="co-pincode" placeholder="PIN Code *" value="682030" class="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900">
                <input type="text" id="co-city" placeholder="City" value="Kochi" class="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900">
                <input type="text" id="co-state" placeholder="State" value="Kerala" class="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900">
              </div>
            </div>

            <!-- Step 2: Payment Options -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold uppercase tracking-wider text-stone-900">2. Select Payment Mode</h3>
              
              <div class="space-y-2 text-xs" id="payment-options">
                <label class="payment-card-tab active flex items-center justify-between p-3.5 rounded-xl border" onclick="window.selectPaymentTab(this, 'upi')">
                  <div class="flex items-center gap-2.5">
                    <input type="radio" name="pay_mode" value="upi" checked class="accent-stone-900">
                    <span class="font-semibold text-stone-900">Instant UPI (GPay / PhonePe / Paytm / QR)</span>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Fastest</span>
                </label>

                <div id="upi-details-pane" class="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-stone-600">Scan & Pay via Official Studio UPI:</span>
                    <span class="font-mono font-semibold text-stone-900">aainaa@kotak</span>
                  </div>
                  <input type="text" id="upi-id-input" placeholder="Or enter your UPI ID (e.g. name@okhdfcbank)" class="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs">
                </div>

                <label class="payment-card-tab flex items-center justify-between p-3.5 rounded-xl border" onclick="window.selectPaymentTab(this, 'card')">
                  <div class="flex items-center gap-2.5">
                    <input type="radio" name="pay_mode" value="card" class="accent-stone-900">
                    <span class="font-semibold text-stone-900">Debit / Credit Card (Visa, RuPay, Master)</span>
                  </div>
                  <span class="text-stone-400">💳</span>
                </label>

                <label class="payment-card-tab flex items-center justify-between p-3.5 rounded-xl border" onclick="window.selectPaymentTab(this, 'cod')">
                  <div class="flex items-center gap-2.5">
                    <input type="radio" name="pay_mode" value="cod" class="accent-stone-900">
                    <span class="font-semibold text-stone-900">Cash on Delivery (COD)</span>
                  </div>
                  <span class="text-stone-500 font-mono text-[11px]">+₹50</span>
                </label>
              </div>
            </div>

          </div>

          <!-- Right: Order Summary & Coupon -->
          <div class="md:col-span-5 bg-stone-50 p-5 rounded-2xl border border-stone-200/80 flex flex-col justify-between">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3">Order Summary</h3>
              <div class="divide-y divide-stone-200 mb-4 max-h-40 overflow-y-auto pr-1">
                ${itemsSummaryHtml}
              </div>

              <!-- Coupon Code Input -->
              <div class="pt-3 border-t border-stone-200 mb-4">
                <label class="block text-[11px] font-semibold text-stone-700 mb-1">Have a Coupon?</label>
                <div class="flex gap-1.5">
                  <input type="text" id="coupon-code-input" placeholder="Try AAINAA10" value="${activeCoupon ? activeCoupon.code : ''}" class="flex-1 p-2 uppercase text-xs bg-white border border-stone-300 rounded-lg font-mono focus:outline-none">
                  <button type="button" onclick="window.applyCoupon()" class="px-3 py-2 btn-dark rounded-lg text-xs font-semibold">
                    ${activeCoupon ? 'Applied' : 'Apply'}
                  </button>
                </div>
                ${activeCoupon ? `<p class="text-[11px] text-emerald-700 font-semibold mt-1">✓ ${activeCoupon.discountPercent}% Discount Applied!</p>` : ''}
              </div>

              <!-- Price Breakdown -->
              <div class="space-y-1.5 text-xs text-stone-600 border-t border-stone-200 pt-3">
                <div class="flex justify-between">
                  <span>Subtotal</span>
                  <span>${formatINR(subtotal)}</span>
                </div>
                ${discount > 0 ? `
                  <div class="flex justify-between text-emerald-700 font-medium">
                    <span>Discount (${activeCoupon.code})</span>
                    <span>-${formatINR(discount)}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between">
                  <span>Express Shipping</span>
                  <span>${shipping === 0 ? '<span class="text-emerald-700 font-medium">FREE</span>' : formatINR(shipping)}</span>
                </div>
                <div class="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-300">
                  <span>Grand Total</span>
                  <span class="text-base">${formatINR(total)}</span>
                </div>
              </div>
            </div>

            <!-- Complete Order Action -->
            <div class="pt-6">
              <button onclick="window.processPayment()" id="pay-submit-btn" class="w-full py-3.5 btn-gold rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg">
                Pay ${formatINR(total)} & Confirm Order
              </button>
              <p class="text-[10px] text-center text-stone-400 mt-2">
                7-Day Easy Exchange • Studio Verified Dispatch
              </p>
            </div>

          </div>

        </div>

      </div>
    `;

    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  window.closeCheckout = function () {
    if (checkoutModal) {
      checkoutModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  window.applyCoupon = function () {
    const input = document.getElementById('coupon-code-input');
    if (!input) return;
    const code = input.value.trim().toUpperCase();

    if (code === 'AAINAA10') {
      activeCoupon = { code: 'AAINAA10', discountPercent: 10 };
      showToast('Coupon AAINAA10 applied: 10% off your order!');
    } else if (code === 'FESTIVE15') {
      activeCoupon = { code: 'FESTIVE15', discountPercent: 15 };
      showToast('Coupon FESTIVE15 applied: 15% festive discount!');
    } else {
      showToast('Invalid coupon. Try code AAINAA10');
      return;
    }
    renderCheckoutModal();
  };

  window.selectPaymentTab = function (element, tabName) {
    document.querySelectorAll('.payment-card-tab').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    const upiPane = document.getElementById('upi-details-pane');
    if (upiPane) {
      upiPane.style.display = tabName === 'upi' ? 'block' : 'none';
    }
  };

  window.processPayment = function () {
    const nameEl = document.getElementById('co-name');
    const phoneEl = document.getElementById('co-phone');
    const addrEl = document.getElementById('co-address');

    if (!nameEl || !phoneEl || !addrEl || !nameEl.value.trim() || !phoneEl.value.trim() || !addrEl.value.trim()) {
      showToast('Please enter your full name, phone number, and delivery address.');
      return;
    }

    const customerName = nameEl.value.trim();
    const customerPhone = phoneEl.value.trim();
    const customerAddr = addrEl.value.trim();
    const btn = document.getElementById('pay-submit-btn');

    if (btn) {
      btn.innerHTML = `<span class="inline-flex items-center gap-2"><svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Securing Gateway...</span>`;
      btn.disabled = true;
    }

    setTimeout(() => {
      const orderId = 'AAINAA-' + Math.floor(100000 + Math.random() * 900000);
      let subtotal = activeCheckoutItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      let discount = activeCoupon ? Math.round((subtotal * activeCoupon.discountPercent) / 100) : 0;
      let shipping = subtotal >= 2500 ? 0 : 150;
      let total = subtotal - discount + shipping;

      // Clear Cart if checking out cart
      if (activeCheckoutItems.length === cart.length) {
        cart = [];
        saveCart();
      }

      const modalInner = document.getElementById('checkout-modal-inner');
      if (modalInner) {
        modalInner.innerHTML = `
          <div class="py-12 px-4 text-center max-w-md mx-auto space-y-5">
            <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>

            <div>
              <span class="text-xs uppercase tracking-widest text-[var(--accent-gold-dark)] font-bold">Order Confirmed</span>
              <h2 class="font-serif text-3xl font-medium text-stone-900 mt-1">Thank You, ${customerName}!</h2>
              <p class="text-xs text-stone-500 mt-1 font-mono">Order ID: #${orderId}</p>
            </div>

            <div class="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 text-left space-y-1.5">
              <p><strong>Shipping to:</strong> ${customerAddr}</p>
              <p><strong>Contact:</strong> ${customerPhone}</p>
              <p><strong>Estimated Dispatch:</strong> Within 24-48 Hours via Bluedart</p>
              <p><strong>Total Paid:</strong> <span class="font-bold text-stone-900">${formatINR(total)}</span></p>
            </div>

            <div class="pt-2 space-y-2">
              <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello AAINAA Studio, I just completed Order #${orderId} for ${formatINR(total)}. My Name: ${customerName}. Please confirm dispatch tracking.`)}" target="_blank" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
                <span>Receive Live Updates on WhatsApp</span>
              </a>
              <button onclick="window.closeCheckout(); window.location.href='index.html';" class="w-full py-3 btn-dark rounded-xl text-xs font-semibold">
                Continue Shopping
              </button>
            </div>
          </div>
        `;
      }
    }, 1200);
  };

  // --- Pincode Delivery Checker ---
  window.checkPincode = function () {
    const input = document.getElementById('pincode-input');
    const result = document.getElementById('pincode-result');
    if (!input || !result) return;
    const pin = input.value.trim();

    if (!/^\d{6}$/.test(pin)) {
      result.innerHTML = `<span class="text-rose-600">Please enter a valid 6-digit Indian PIN code.</span>`;
      return;
    }

    if (pin.startsWith('68')) {
      result.innerHTML = `
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
          <p class="font-semibold">✓ 1-Hour Express Local Delivery Available!</p>
          <p class="text-[11px]">Direct dispatch from Kakkanad, Kochi studio atelier. Cash on delivery available.</p>
        </div>
      `;
    } else {
      result.innerHTML = `
        <div class="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 space-y-1">
          <p class="font-semibold text-stone-900">✓ Express Pan-India Delivery Available (2–4 Days)</p>
          <p class="text-[11px]">Fulfilled via Bluedart / Delhivery Air Cargo. Tracking ID sent via SMS/WhatsApp.</p>
        </div>
      `;
    }
  };

  // --- Made to Measure Bespoke Dialog ---
  window.openBespokeDialog = function () {
    const text = `Hello Jaleena / AAINAA Studio,\nI would like to inquire about a *Bespoke Made-to-Measure* outfit with custom sizing and tailoring.\n\nMy Preferred Garment Type: [Kaftan / Suit / Co-ord]\nBust: [Inches]\nWaist: [Inches]\nHips: [Inches]\nHeight: [Feet/Inches]\nSpecial Instructions: [Custom neckline / sleeves]\n\nPlease advise on next steps!`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // --- Toast Notifications ---
  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'luxury-toast bg-[var(--text-ink)] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[var(--accent-gold)] flex items-center gap-3 text-xs';
    toast.innerHTML = `
      <svg class="text-[var(--accent-gold)] flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span class="font-medium">${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 20);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
  window.showToast = showToast;

  // --- Event Listeners ---
  function setupEventListeners() {
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCategory = pill.dataset.category || 'All';
        renderProducts();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderProducts();
      });
    }

    if (quickViewModal) {
      quickViewModal.addEventListener('click', (e) => {
        if (e.target === quickViewModal) window.closeQuickView();
      });
    }

    if (checkoutModal) {
      checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) window.closeCheckout();
      });
    }

    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', () => {
        window.closeCart();
        window.closeWishlist();
        window.closeMobileMenu();
        window.closeQuickAddSheet();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.closeCart();
        window.closeWishlist();
        window.closeQuickView();
        window.closeCheckout();
        window.closeMobileMenu();
        window.closeQuickAddSheet();
      }
    });
  }

  window.filterByCategory = function (category) {
    currentCategory = category;
    filterPills.forEach(p => {
      if ((p.dataset.category || '') === category) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
    renderProducts();
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  window.resetFilters = function () {
    currentCategory = 'All';
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    filterPills.forEach(p => {
      if (p.dataset.category === 'All') p.classList.add('active');
      else p.classList.remove('active');
    });
    renderProducts();
  };

  window.toggleMobileMenu = function () {
    if (mobileMenuDrawer && drawerBackdrop) {
      const willOpen = !mobileMenuDrawer.classList.contains('open');
      if (willOpen) {
        mobileMenuDrawer.classList.add('open');
        drawerBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        window.closeMobileMenu();
      }
    }
  };

  window.closeMobileMenu = function () {
    if (mobileMenuDrawer) {
      mobileMenuDrawer.classList.remove('open');
    }
    if (drawerBackdrop && (!cartDrawer || !cartDrawer.classList.contains('open')) && (!wishlistDrawer || !wishlistDrawer.classList.contains('open'))) {
      drawerBackdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

})();
