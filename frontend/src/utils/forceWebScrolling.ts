import { Platform } from 'react-native';

export const forceWebScrolling = () => {
  if (Platform.OS !== 'web') return;

  const enableScrolling = () => {
    // Wait for DOM to be fully loaded
    setTimeout(() => {
      // Get all div elements
      const allDivs = document.querySelectorAll('div');
      
      allDivs.forEach((div: HTMLElement) => {
        const computedStyle = window.getComputedStyle(div);
        
        // Check if this div might be a scroll container
        const hasOverflowHidden = computedStyle.overflow === 'hidden' || 
                                 computedStyle.overflowY === 'hidden';
        const hasHeight = div.scrollHeight > div.clientHeight + 5; // 5px tolerance
        const hasFlexColumn = computedStyle.flexDirection === 'column';
        const hasFlex = computedStyle.flex === '1' || computedStyle.flex === '1 1 0%';
        
        // If it looks like it should scroll, force it
        if (hasOverflowHidden && (hasHeight || hasFlexColumn || hasFlex)) {
          div.style.setProperty('overflow-y', 'auto', 'important');
          div.style.setProperty('overflow-x', 'hidden', 'important');
          div.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
          div.style.setProperty('scroll-behavior', 'smooth', 'important');
          
          // Add touch support
          div.style.setProperty('touch-action', 'pan-y', 'important');
          div.style.setProperty('overscroll-behavior', 'contain', 'important');
          
          // Mark as fixed
          div.setAttribute('data-scroll-fixed', 'true');
          
          console.log('Fixed scrolling for element:', div);
        }
      });
      
      // Also fix the root containers
      const root = document.getElementById('root');
      if (root) {
        root.style.setProperty('height', '100vh', 'important');
        root.style.setProperty('overflow', 'hidden', 'important');
      }
      
      // Fix body
      document.body.style.setProperty('height', '100vh', 'important');
      document.body.style.setProperty('overflow', 'hidden', 'important');
      document.body.style.setProperty('margin', '0', 'important');
      document.body.style.setProperty('padding', '0', 'important');
      
      // Add global CSS override
      const style = document.createElement('style');
      style.innerHTML = `
        /* Force scrolling on React Native Web elements */
        div[style*="overflow: hidden"] {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
        }
        
        /* Specific targeting for common patterns */
        div[style*="flex: 1"][style*="overflow"] {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
        }
        
        /* Mobile specific */
        @media (hover: none) and (pointer: coarse) {
          div {
            -webkit-overflow-scrolling: touch !important;
            touch-action: pan-y !important;
            overscroll-behavior: contain !important;
          }
        }
      `;
      document.head.appendChild(style);
      
    }, 1000); // Wait 1 second for everything to load
  };

  // Run immediately
  enableScrolling();
  
  // Run again after page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enableScrolling);
  }
  
  // Run periodically to catch new elements
  const interval = setInterval(enableScrolling, 3000);
  
  // Also run when window resizes
  window.addEventListener('resize', enableScrolling);
  
  return () => {
    clearInterval(interval);
    window.removeEventListener('resize', enableScrolling);
  };
};

// Function to manually fix a specific element
export const fixElementScrolling = (element: HTMLElement) => {
  if (Platform.OS !== 'web') return;
  
  element.style.setProperty('overflow-y', 'auto', 'important');
  element.style.setProperty('overflow-x', 'hidden', 'important');
  element.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
  element.style.setProperty('touch-action', 'pan-y', 'important');
  element.style.setProperty('overscroll-behavior', 'contain', 'important');
};
