import { useState, useEffect } from 'react';

export function useScout(isActive) {
  const [data, setData] = useState({
    title: '',
    description: '',
    url: '',
    image: '',
    siteName: '',
    twitterHandle: '',
    seo: {
      titleLength: 0,
      descLength: 0,
      keywords: '',
      canonical: '',
      robots: '',
      viewport: '',
      language: '',
      h1Count: 0,
      h1Text: '',
      imagesWithoutAlt: 0,
      totalImages: 0,
      favicon: false,
      headings: { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
      schemaOrg: false,
      hasOpenGraph: false,
      hasTwitterCards: false,
      hasIframes: false,
      emailsFound: 0,
      hasInlineCss: false,
      timing: {
        serverRes: 'N/A',
        domLoaded: 'N/A'
      },
      topKeywords: [],
      a11y: {
        inputsWithoutLabels: 0,
        buttonsWithoutText: 0
      },
      storage: {
        cookies: 0,
        cookiesList: [],
        localStorage: 0,
        sessionStorage: 0
      },
      score: 0,
      rawTitle: '',
      rawDesc: '',
      wordCount: 0,
      links: {
        total: 0,
        internal: 0,
        external: 0,
        empty: 0
      },
      isHttps: true,
      loadTime: 'N/A',
      geoRegion: 'Missing',
      geoPlacename: 'Missing'
    },
    missingTags: []
  });

  useEffect(() => {
    if (!isActive) return;

    try {
      const getMetaContent = (nameAttr, nameVal, propAttr = 'name') => {
        const el = document.querySelector(`meta[${propAttr}="${nameVal}" i]`);
        return el ? el.getAttribute('content') : null;
      };

      const rawTitle = document.title || '';
      const rawDesc = getMetaContent('name', 'description', 'name') || '';

      const title = 
        getMetaContent('property', 'og:title', 'property') || 
        getMetaContent('name', 'twitter:title', 'name') || 
        rawTitle;

      const description = 
        getMetaContent('property', 'og:description', 'property') || 
        getMetaContent('name', 'twitter:description', 'name') || 
        rawDesc;

      const image = 
        getMetaContent('property', 'og:image', 'property') || 
        getMetaContent('name', 'twitter:image', 'name');

      const url = 
        getMetaContent('property', 'og:url', 'property') || 
        window.location.href;

      const siteName = 
        getMetaContent('property', 'og:site_name', 'property');

      const twitterHandle = 
        getMetaContent('name', 'twitter:site', 'name') || 
        getMetaContent('name', 'twitter:creator', 'name');

      // Extended SEO Audit
      const keywords = 
        getMetaContent('name', 'keywords', 'name') || 
        getMetaContent('property', 'keywords', 'property') || 
        getMetaContent('itemprop', 'keywords', 'itemprop') || '';
        
      const robots = getMetaContent('name', 'robots', 'name') || 'index, follow (default)';
      const viewport = getMetaContent('name', 'viewport', 'name') || 'Missing';
      
      const canonicalEl = document.querySelector('link[rel="canonical"]');
      const canonical = canonicalEl ? canonicalEl.getAttribute('href') : 'Missing';
      
      const language = document.documentElement.lang || 'Missing';

      const h1Elements = document.querySelectorAll('h1');
      const h1Count = h1Elements.length;
      const h1Text = h1Count === 1 ? h1Elements[0].innerText : (h1Count > 1 ? 'Multiple H1s' : 'Missing');
      
      const headings = {
        h1: h1Count,
        h2: document.querySelectorAll('h2').length,
        h3: document.querySelectorAll('h3').length,
        h4: document.querySelectorAll('h4').length,
        h5: document.querySelectorAll('h5').length,
        h6: document.querySelectorAll('h6').length,
      };

      const images = document.querySelectorAll('img');
      let missingAltCount = 0;
      images.forEach(img => {
        if (!img.hasAttribute('alt') || img.getAttribute('alt').trim() === '') {
          missingAltCount++;
        }
      });

      const faviconEl = document.querySelector('link[rel*="icon"]');
      const faviconUrl = faviconEl ? faviconEl.getAttribute('href') : null;
      let absoluteFavicon = null;
      if (faviconUrl) {
        try {
          absoluteFavicon = new URL(faviconUrl, window.location.href).href;
        } catch {
          absoluteFavicon = faviconUrl;
        }
      }

      // Deep SEO Links and Word Count
      const bodyText = document.body.innerText || '';
      const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

      const links = document.querySelectorAll('a');
      let internalLinks = 0;
      let externalLinks = 0;
      let emptyLinks = 0;
      const currentHost = window.location.hostname;
      
      links.forEach(a => {
        const href = a.getAttribute('href');
        if (!href || href.trim() === '' || href.startsWith('#')) {
          emptyLinks++;
        } else {
          try {
            const urlObj = new URL(href, window.location.origin);
            if (urlObj.hostname === currentHost) {
              internalLinks++;
            } else {
              externalLinks++;
            }
          } catch {
            emptyLinks++;
          }
        }
      });

      // Technical & Geo
      const isHttps = window.location.protocol === 'https:';
      let loadTime = 'N/A';
      let serverRes = 'N/A';
      let domLoaded = 'N/A';
      if (window.performance && window.performance.getEntriesByType) {
        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const nav = navEntries[0];
          loadTime = (nav.loadEventEnd / 1000).toFixed(2) + 's';
          serverRes = (nav.responseEnd / 1000).toFixed(2) + 's';
          domLoaded = (nav.domContentLoadedEventEnd / 1000).toFixed(2) + 's';
        }
      }

      // Advanced Technicals
      const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
      const schemaOrg = schemaScripts.length > 0;
      
      const hasOpenGraph = !!document.querySelector('meta[property^="og:"]');
      const hasTwitterCards = !!document.querySelector('meta[name^="twitter:"]');
      
      const hasIframes = document.querySelectorAll('iframe').length > 0;
      
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
      const emailsFound = (bodyText.match(emailRegex) || []).length;
      
      const hasInlineCss = document.querySelectorAll('[style]').length > 0;

      // Keyword Density (Top 5 words > 4 chars)
      const words = bodyText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 4);
      const wordMap = {};
      words.forEach(w => wordMap[w] = (wordMap[w] || 0) + 1);
      const topKeywords = Object.entries(wordMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }));

      // Accessibility
      let inputsWithoutLabels = 0;
      document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])').forEach(input => {
        if (!input.id || !document.querySelector(`label[for="${input.id}"]`)) {
          if (!input.closest('label') && !input.getAttribute('aria-label')) {
            inputsWithoutLabels++;
          }
        }
      });

      let buttonsWithoutText = 0;
      document.querySelectorAll('button').forEach(btn => {
        if (btn.innerText.trim() === '' && !btn.getAttribute('aria-label')) {
          buttonsWithoutText++;
        }
      });

      // Storage
      let cookiesCount = 0;
      let cookiesList = [];
      try {
        if (document.cookie) {
          const cookiesArr = document.cookie.split(';');
          cookiesCount = cookiesArr.length;
          cookiesList = cookiesArr.map(c => c.split('=')[0].trim()).filter(c => c);
        }
      } catch {}
      
      let localStorageCount = 0;
      try { localStorageCount = window.localStorage.length; } catch {}
      
      let sessionStorageCount = 0;
      try { sessionStorageCount = window.sessionStorage.length; } catch {}

      const geoRegion = getMetaContent('name', 'geo.region', 'name') || 'Missing';
      const geoPlacename = getMetaContent('name', 'geo.placename', 'name') || 'Missing';

      // Score Calculation (Max 100)
      let score = 0;
      if (rawTitle.length >= 30 && rawTitle.length <= 60) score += 15;
      else if (rawTitle.length > 0) score += 5;
      
      if (rawDesc.length >= 120 && rawDesc.length <= 160) score += 15;
      else if (rawDesc.length > 0) score += 5;

      if (h1Count === 1) score += 15;
      if (isHttps) score += 15;
      if (canonicalEl) score += 10;
      if (viewport !== 'Missing') score += 10;
      if (missingAltCount === 0 && images.length > 0) score += 10;
      else if (images.length === 0) score += 10;
      if (wordCount > 300) score += 10;

      const missing = [];
      if (!getMetaContent('property', 'og:title', 'property')) missing.push('og:title');
      if (!getMetaContent('property', 'og:description', 'property')) missing.push('og:description');
      if (!image) missing.push('og:image');
      if (!rawDesc) missing.push('meta desc');
      if (h1Count !== 1) missing.push('1 H1 Tag');
      if (missingAltCount > 0) missing.push('Alt tags');
      if (!canonicalEl) missing.push('Canonical');
      if (!isHttps) missing.push('HTTPS');
      if (wordCount < 300) missing.push('Content Length');

      setData({
        title: title || 'No Title Found',
        description: description || 'No description found for this webpage.',
        url: url || window.location.href,
        image: image || null,
        siteName: siteName || new URL(window.location.href).hostname,
        twitterHandle: twitterHandle || '',
        seo: {
          score,
          rawTitle,
          rawDesc,
          titleLength: rawTitle.length,
          descLength: rawDesc.length,
          keywords,
          canonical,
          robots,
          viewport,
          language,
          h1Count,
          h1Text,
          imagesWithoutAlt: missingAltCount,
          totalImages: images.length,
          favicon: absoluteFavicon,
          wordCount,
          links: {
            total: links.length,
            internal: internalLinks,
            external: externalLinks,
            empty: emptyLinks
          },
          isHttps,
          loadTime,
          geoRegion,
          geoPlacename,
          headings,
          schemaOrg,
          hasOpenGraph,
          hasTwitterCards,
          hasIframes,
          emailsFound,
          hasInlineCss,
          timing: {
            serverRes,
            domLoaded
          },
          topKeywords,
          a11y: {
            inputsWithoutLabels,
            buttonsWithoutText
          },
          storage: {
            cookies: cookiesCount,
            cookiesList: cookiesList,
            localStorage: localStorageCount,
            sessionStorage: sessionStorageCount
          }
        },
        missingTags: missing
      });

    } catch (e) {
      console.error("Scout error:", e);
    }
  }, [isActive]);

  return data;
}
