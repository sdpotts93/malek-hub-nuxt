// plugins/gtm.client.js

export default defineNuxtPlugin(() => {
  const GA_MEASUREMENT_ID = 'G-762HDX36WQ';
  const META_PIXEL_ID = '305590140434229';

  const initTrackingOnEvent = (event) => {
    initTrackingScripts();
    event.currentTarget.removeEventListener(event.type, initTrackingOnEvent);
  };

  const initTrackingScripts = () => {
    if (window.trackingDidInit) {
      return false;
    }
    window.trackingDidInit = true;
    initGoogleTag();
    initMetaPixel();
  };

  const initGoogleTag = () => {
    // Check if gtag script already exists
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`)) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
      };

      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID);
      return;
    }

    // Google tag (gtag.js) - matches official snippet
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  };

  const initMetaPixel = () => {
    if (window.fbq) {
      return;
    }

    // Meta Pixel - matches official snippet
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ?
        n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  };

  const trackAddToCart = ({
    price,
    formattedPrice,
    productId,
    variantId,
    currency = 'MXN',
  } = {}) => {
    initTrackingScripts();

    const numericPrice = typeof price === 'number' ? price : Number(price);
    const contentId = variantId?.split('gid://shopify/ProductVariant/')[1] || variantId;
    const totalValue = formattedPrice ?? (Number.isFinite(numericPrice) ? numericPrice : undefined);

    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        value: Number.isFinite(numericPrice) ? numericPrice : undefined,
        currency,
        content_ids: contentId ? [contentId] : undefined,
        content_type: 'product',
      });
    }

    if (window.gtag) {
      window.gtag('event', 'add_to_cart', {
        ecomm_pagetype: 'cart',
        ecomm_prodid: productId && contentId ? `shopify_MX_${productId}_${contentId}` : undefined,
        ecomm_totalvalue: totalValue,
        currency,
        value: totalValue,
      });
    }
  };

  const initOnLoad = () => {
    if (document.readyState === 'complete') {
      setTimeout(initTrackingScripts, 3000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(initTrackingScripts, 3000);
      });
    }
  };

  // Attach event listeners
  initOnLoad();

  document.addEventListener('scroll', initTrackingOnEvent);
  document.addEventListener('mousemove', initTrackingOnEvent);
  document.addEventListener('touchstart', initTrackingOnEvent);

  return {
    provide: {
      trackAddToCart,
    },
  };
});
