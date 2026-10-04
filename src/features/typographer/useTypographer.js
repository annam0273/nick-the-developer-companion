import { useState, useEffect } from 'react';

export function useTypographer(isActive) {
  const [fonts, setFonts] = useState({ tags: [], external: [] });

  useEffect(() => {
    if (!isActive) return;

    try {
      const tagsToAnalyze = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'li'];
      const analyzedFonts = [];

      tagsToAnalyze.forEach(tag => {
        const elements = document.querySelectorAll(tag);
        // Find first visible element with text
        const el = Array.from(elements).find(e => {
          const style = window.getComputedStyle(e);
          return style.display !== 'none' && style.visibility !== 'hidden' && e.innerText.trim().length > 0;
        });

        if (el) {
          const style = window.getComputedStyle(el);
          
          // Clean up font-family (get first font in stack)
          let primaryFont = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
          
          analyzedFonts.push({
            tag: tag.toUpperCase(),
            sampleText: el.innerText.substring(0, 40) + (el.innerText.length > 40 ? '...' : ''),
            fontFamily: style.fontFamily,
            primaryFont: primaryFont,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            color: style.color
          });
        }
      });

      // Find custom external font families
      const customFontFamilies = new Set();
      
      // Try to parse Google Font URLs for cleaner names
      document.querySelectorAll('link').forEach(link => {
        const href = link.href;
        if (href && href.includes('fonts.googleapis.com/css')) {
          try {
            const url = new URL(href);
            const familyParam = url.searchParams.get('family');
            if (familyParam) {
              familyParam.split('|').forEach(f => {
                customFontFamilies.add(f.split(':')[0].replace(/\+/g, ' '));
              });
            }
          } catch(e) {}
        }
      });

      // Grab all loaded FontFaces from the native API
      try {
        if (document.fonts) {
          document.fonts.forEach(fontFace => {
            if (fontFace.family) {
              const cleanFamily = fontFace.family.replace(/['"]/g, '');
              customFontFamilies.add(cleanFamily);
            }
          });
        }
      } catch (e) {}

      setFonts({ tags: analyzedFonts, external: Array.from(customFontFamilies) });
    } catch (e) {
      console.error("Typographer error:", e);
    }
  }, [isActive]);

  return fonts;
}
