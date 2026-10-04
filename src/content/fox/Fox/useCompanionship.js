import { useState, useEffect } from 'react';

export function useCompanionship() {
  const [companionMessage, setCompanionMessage] = useState(null);
  const [companionMood, setCompanionMood] = useState(null); // 'happy', 'love', etc.

  useEffect(() => {
    // Hydration reminder every 45 minutes
    const hydrationInterval = setInterval(() => {
      setCompanionMessage("Time for a hydration break! Drink some water 💧");
      setCompanionMood('happy');
      
      setTimeout(() => {
        setCompanionMessage(null);
        setCompanionMood(null);
      }, 6000);
    }, 45 * 60 * 1000); // 45 minutes

    // Eye rest reminder every 20 minutes (20-20-20 rule)
    const eyeRestInterval = setInterval(() => {
      setCompanionMessage("Look at something 20 feet away for 20 seconds! 👀");
      
      setTimeout(() => {
        setCompanionMessage(null);
      }, 6000);
    }, 20 * 60 * 1000); // 20 minutes

    return () => {
      clearInterval(hydrationInterval);
      clearInterval(eyeRestInterval);
    };
  }, []);

  return { companionMessage, companionMood };
}
