import { defaultOptions } from '@jsquash/avif/meta';
import { initEmscriptenModule } from '@jsquash/avif/utils';
import avifEncoder from '@jsquash/avif/codec/enc/avif_enc';

let encoderPromise = null;
let recognition = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OFFSCREEN_ENCODE_AVIF') {
    if (!encoderPromise) {
      encoderPromise = initEmscriptenModule(avifEncoder, null, {
        locateFile: () => chrome.runtime.getURL('avif_enc.wasm')
      }).catch(err => {
        console.error("Failed to init AVIF encoder", err);
        encoderPromise = null;
        throw err;
      });
    }
    
    encoderPromise.then(module => {
      const { data, width, height, quality } = message.payload;
      
      const _options = { ...defaultOptions };
      _options.cqLevel = Math.round(63 - (quality * 0.63));
      
      const output = module.encode(new Uint8Array(data), width, height, _options);
      if (!output) {
         throw new Error('Encoding returned null');
      }
      
      sendResponse({ buffer: Array.from(output) });
    }).catch(err => {
      console.error('AVIF encode error:', err);
      sendResponse({ error: err.toString() });
    });
    
    return true; 
  }

});
