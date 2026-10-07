import { useState, useEffect, useCallback, useRef } from 'react';

// Levenshtein distance for fuzzy string matching
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const FEATURES = [
  { name: 'sniffer', id: 'FORAGER', keywords: ['sniffer', 'extract', 'media', 'sneaker', 'sneeze', 'slipper', 'forager', 'snapper', 'palette', 'color', 'pallet', 'asset', 'svg', 'icon', 'stack', 'framework', 'tech', 'image', 'images'] },
  { name: 'scout', id: 'SCOUT', keywords: ['scout', 'analyze', 'inspect', 'seo', 'stout', 'scald', 'cloud'] },
  { name: 'designer', id: 'TYPOGRAPHER', keywords: ['designer', 'typography', 'font', 'diner', 'design', 'illusionist', 'xray', 'x-ray', 'wireframe', 'wireframer'] },
  { name: 'sketcher', id: 'SKETCHER', keywords: ['sketcher', 'screenshot', 'draw', 'catch', 'stretcher', 'sketch', 'picture'] },
  { name: 'compressor', id: 'COMPRESSOR', keywords: ['compressor', 'compress', 'avif', 'professor'] },
  { name: 'scribe', id: 'SCRIBE', keywords: ['scribe', 'note', 'scratch', 'sky', 'scrape', 'write', 'strike'] },
  { name: 'lab', id: 'LAB', keywords: ['lab', 'settings', 'lap'] }
];

function processTranscript(text) {
  let corrected = text.toLowerCase();
  
  // Direct keyword replacements
  for (const feature of FEATURES) {
    for (const kw of feature.keywords) {
      if (kw === feature.name) continue;
      // Replace whole words only
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      if (regex.test(corrected)) {
        corrected = corrected.replace(regex, feature.name);
      }
    }
  }

  return corrected;
}

export function useVoiceCommand(onCommand) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [voiceFeedback, setVoiceFeedback] = useState(null);
  
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const commandExecutedRef = useRef(false);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    
    // If we stopped listening and no command was triggered, give feedback
    if (!commandExecutedRef.current) {
      setVoiceFeedback("Can you repeat again?");
      setTimeout(() => setVoiceFeedback(null), 2500);
    }
    
    setTimeout(() => setTranscript(''), 2000);
  }, []);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    setError(null);
    setVoiceFeedback(null);
    setTranscript('');
    setIsListening(true);
    isListeningRef.current = true;
    commandExecutedRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new window.webkitSpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true; // Stay on continuously
    recognition.interimResults = true; // Live feedback
    recognition.lang = 'en-US';

    recognition.onstart = () => {};

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }

      // Detect sub-features before autocorrect obliterates the specific words
      const rawText = currentTranscript.toLowerCase();
      
      let foragerPayload = null;
      if (rawText.includes('palette') || rawText.includes('color') || rawText.includes('pallet')) foragerPayload = 'palette';
      else if (rawText.includes('asset') || rawText.includes('svg') || rawText.includes('icon') || rawText.includes('image')) foragerPayload = 'assets';
      else if (rawText.includes('stack') || rawText.includes('framework') || rawText.includes('tech')) foragerPayload = 'stack';

      let typographerPayload = null;
      if (rawText.includes('illusionist') || rawText.includes('xray') || rawText.includes('x-ray')) typographerPayload = 'illusionist';
      else if (rawText.includes('wireframe') || rawText.includes('wireframer')) typographerPayload = 'wireframer';
      else if (rawText.includes('typography') || rawText.includes('font')) typographerPayload = 'typography';

      // Autocorrect the transcript LIVE before displaying it
      const correctedText = processTranscript(currentTranscript);
      setTranscript(correctedText);
      
      let commandExecuted = false;

      // Check if any feature name is explicitly in the autocorrected text
      for (const feature of FEATURES) {
        if (correctedText.includes(feature.name)) {
          let payload = null;
          if (feature.id === 'FORAGER') payload = foragerPayload;
          if (feature.id === 'TYPOGRAPHER') payload = typographerPayload;
          
          onCommand(feature.id, payload);
          commandExecuted = true;
          break; // only trigger one command at a time
        }
      }

      // Handle extra commands not tied to a specific tool panel
      if (!commandExecuted) {
        if (correctedText.includes('sleep') || correctedText.includes('wake') || correctedText.includes('rest')) {
          onCommand('TOGGLE_SLEEP');
          commandExecuted = true;
        } else if (correctedText.includes('close') || correctedText.includes('minimize') || correctedText.includes('hide')) {
          onCommand('CLOSE');
          commandExecuted = true;
        }
      }

      if (commandExecuted) {
        commandExecutedRef.current = true;
        // We must stop the recognition to clear the accumulated transcript 
        // so it doesn't instantly re-trigger the same command on the next word.
        // The onend handler will automatically restart it because isListeningRef is still true!
        try {
          recognition.stop();
        } catch {}
        setTimeout(() => setTranscript(''), 1000);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError("Microphone access denied. Please allow it in the URL bar.");
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError("Voice error: " + event.error);
      }
    };

    recognition.onend = () => {
      // If we are still supposed to be listening (e.g. we just stopped to clear the transcript, 
      // or the browser timed out), start it right back up!
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {}
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setError("Could not start microphone.");
      setIsListening(false);
    }
  }, [onCommand]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  return { isListening, transcript, error, voiceFeedback, startListening, stopListening };
}
