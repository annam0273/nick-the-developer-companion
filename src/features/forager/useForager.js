import { useState, useEffect } from 'react';

export function useForager(isActive) {
  const [data, setData] = useState({ colors: [], svgs: [], frameworks: [] });
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    
    setIsScanning(true);
    // Use timeout to let sniffing animation start before blocking thread
    const timer = setTimeout(() => {
      const colors = new Set();
      const svgs = [];

      try {
        // 1. Gather colors
        const elements = document.querySelectorAll('*');
        const len = elements.length;
        // Sample throughout the page to find colors
        const step = Math.max(1, Math.floor(len / 400)); 
        for (let i = 0; i < len; i += step) {
          const el = elements[i];
          const style = window.getComputedStyle(el);
          const bg = style.backgroundColor;
          const col = style.color;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') colors.add(bg);
          if (col && col !== 'rgba(0, 0, 0, 0)' && col !== 'transparent') colors.add(col);
        }
        
        const hexColors = Array.from(colors).map(rgb2hex).filter(c => c);
        const uniqueHexColors = [...new Set(hexColors)];

        // 2. Gather SVGs
        const svgElements = document.querySelectorAll('svg');
        // Filter out mochi svgs
        const pageSvgs = Array.from(svgElements).filter(svg => !svg.closest('.mochi-fox-corner') && !svg.closest('#focus-companion-root'));
        
        pageSvgs.forEach(svg => {
          if (svg.clientWidth > 8 || svg.clientHeight > 8) {
            const clone = svg.cloneNode(true);
            clone.setAttribute('width', '100%');
            clone.setAttribute('height', '100%');
            
            // Basic sanitization: remove scripts and event handlers to prevent reflection XSS
            const scripts = clone.querySelectorAll('script');
            scripts.forEach(s => s.remove());
            const allNodes = clone.querySelectorAll('*');
            allNodes.forEach(node => {
              Array.from(node.attributes).forEach(attr => {
                if (attr.name.toLowerCase().startsWith('on')) {
                  node.removeAttribute(attr.name);
                }
              });
            });
            
            svgs.push(clone.outerHTML);
          }
        });
        const uniqueSvgs = [...new Set(svgs)];

        // 3. Detect Frameworks (DOM-based robust fallback)
        const domFw = [];
        
        // Next.js (usually very easy to detect)
        if (document.getElementById('__NEXT_DATA__') || document.getElementById('__next') || document.querySelector('script[src*="/_next/"]') || document.querySelector('link[href*="/_next/"]')) {
          domFw.push('Next.js');
          domFw.push('React'); // Next.js implies React
        }
        
        // React (if not already found via Next.js)
        if (!domFw.includes('React') && (document.querySelector('[data-reactroot], [data-reactid], script[src*="react"]') || document.getElementById('root') || document.querySelector('script[src*="static/js/main"]'))) {
          domFw.push('React');
        }

        if (document.querySelector('[data-v-app], [data-v-1]') || document.getElementById('app')) domFw.push('Vue.js');
        if (document.querySelector('[ng-version], [ng-app]')) domFw.push('Angular');
        if (document.querySelector('.svelte-1, [id="svelte"]')) domFw.push('Svelte');
        if (document.querySelector('link[href*="tailwind"], style[id*="tailwind"]')) domFw.push('Tailwind CSS');
        if (document.getElementById('gatsby-focus-wrapper')) domFw.push('Gatsby');
        if (document.querySelector('meta[name="generator"][content*="WordPress"]') || document.querySelector('link[href*="wp-content"]')) domFw.push('WordPress');
        if (document.querySelector('script[src*="jquery"]') || window.jQuery) domFw.push('jQuery');
        if (document.querySelector('link[href*="bootstrap"]')) domFw.push('Bootstrap');

        // 4. Inject script to synchronously read host window variables by writing to body attributes
        try {
          const script = document.createElement('script');
          script.textContent = `
            (function() {
              if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) document.body.setAttribute('data-mochi-react', 'true');
              if (window.next) document.body.setAttribute('data-mochi-next', 'true');
              if (window.Vue || window.__VUE__) document.body.setAttribute('data-mochi-vue', 'true');
              if (window.angular) document.body.setAttribute('data-mochi-angular', 'true');
              if (window.Svelte || window.__svelte) document.body.setAttribute('data-mochi-svelte', 'true');
              if (window.jQuery) document.body.setAttribute('data-mochi-jquery', 'true');
            })();
          `;
          document.documentElement.appendChild(script);
          script.remove();

          // Read the attributes immediately
          if (document.body.hasAttribute('data-mochi-react')) { domFw.push('React'); document.body.removeAttribute('data-mochi-react'); }
          if (document.body.hasAttribute('data-mochi-next')) { domFw.push('Next.js'); domFw.push('React'); document.body.removeAttribute('data-mochi-next'); }
          if (document.body.hasAttribute('data-mochi-vue')) { domFw.push('Vue.js'); document.body.removeAttribute('data-mochi-vue'); }
          if (document.body.hasAttribute('data-mochi-angular')) { domFw.push('Angular'); document.body.removeAttribute('data-mochi-angular'); }
          if (document.body.hasAttribute('data-mochi-svelte')) { domFw.push('Svelte'); document.body.removeAttribute('data-mochi-svelte'); }
          if (document.body.hasAttribute('data-mochi-jquery')) { domFw.push('jQuery'); document.body.removeAttribute('data-mochi-jquery'); }
        } catch {
          // CSP might block the script, that's fine, we fallback to our strong DOM checks.
          console.warn("Mochi: CSP blocked global variable checks, relying on DOM scanning.");
        }

        setData({
          colors: uniqueHexColors.slice(0, 24),
          svgs: uniqueSvgs.slice(0, 16),
          frameworks: [...new Set(domFw)]
        });
        setIsScanning(false);
        
      } catch (e) {
        console.error("Forager error:", e);
        setIsScanning(false);
      }
    }, 800);
    
    return () => clearTimeout(timer);
  }, [isActive]);

  return { data, isScanning };
}

function rgb2hex(rgb) {
  const res = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!res) return null;
  return "#" +
    ("0" + parseInt(res[1], 10).toString(16)).slice(-2) +
    ("0" + parseInt(res[2], 10).toString(16)).slice(-2) +
    ("0" + parseInt(res[3], 10).toString(16)).slice(-2);
}
