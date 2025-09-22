import { Platform } from 'react-native';

export const enableSimpleWebScrolling = () => {
  if (Platform.OS !== 'web') return;

  const fixScrolling = () => {
    // Simple approach: just find elements with overflow hidden and fix them
    const elements = document.querySelectorAll('div[style*="overflow: hidden"]');
    
    elements.forEach((element: HTMLElement) => {
      // Only fix if it looks like a scroll container
      if (element.scrollHeight > element.clientHeight) {
        element.style.overflowY = 'auto';
        element.style.webkitOverflowScrolling = 'touch';
      }
    });
  };

  // Run the fix periodically but not too aggressively
  const interval = setInterval(fixScrolling, 1000);
  
  // Initial fix
  setTimeout(fixScrolling, 500);
  
  return () => clearInterval(interval);
};

export const forceElementScrollable = (element: HTMLElement) => {
  if (Platform.OS !== 'web') return;
  
  element.style.overflowY = 'auto';
  element.style.webkitOverflowScrolling = 'touch';
};
