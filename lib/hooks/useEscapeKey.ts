import { useEffect } from 'react';

/**
 * Custom hook to handle ESC key press events
 * @param callback - Function to call when ESC key is pressed
 * @param isActive - Whether the hook should be active (default: true)
 */
export function useEscapeKey(callback: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        callback();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [callback, isActive]);
}

export default useEscapeKey;
