import { Platform } from 'react-native';

export const enableWebScrolling = () => {
  if (Platform.OS !== 'web') return;

  // Wait for DOM to be ready
  const fixScrolling = () => {
    // Detect if we're on a touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Find all potential scroll containers
    const scrollContainers = document.querySelectorAll('div');
    
    scrollContainers.forEach((element: HTMLElement) => {
      const style = window.getComputedStyle(element);
      
      // Check if this element should be scrollable
      const hasOverflowHidden = style.overflow === 'hidden' || 
                               style.overflowY === 'hidden';
      const hasFlexColumn = style.flexDirection === 'column';
      const hasFlex = style.flex === '1' || style.flex === '1 1 0%';
      const hasHeight = element.scrollHeight > element.clientHeight;
      
      // If it looks like a scroll container, make it scrollable
      if ((hasOverflowHidden && (hasFlexColumn || hasFlex)) || hasHeight) {
        element.style.overflowY = 'auto';
        element.style.overflowX = 'hidden';
        element.style.webkitOverflowScrolling = 'touch';
        
        // Add touch-specific properties for mobile devices
        if (isTouchDevice) {
          element.style.touchAction = 'pan-y';
          element.style.overscrollBehavior = 'contain';
          // Ensure minimum height for scrolling
          if (element.scrollHeight <= element.clientHeight) {
            element.style.minHeight = '101%';
          }
        }
        
        // Add a class for easier targeting
        element.classList.add('web-scrollable');
      }
    });
    
    // Also add global scroll fix
    const style = document.createElement('style');
    const touchStyles = isTouchDevice ? `
      touch-action: pan-y !important;
      overscroll-behavior: contain !important;
    ` : '';
    
    style.textContent = `
      .web-scrollable {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        ${touchStyles}
      }
      
      /* Target React Native Web specific classes */
      .css-view-175oi2r[style*="overflow"] {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        ${touchStyles}
      }
      
      /* Force scrolling on flex containers */
      div[style*="flex: 1"][style*="overflow"] {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        ${touchStyles}
      }
      
      /* Touch device specific styles */
      ${isTouchDevice ? `
        body, #root {
          touch-action: pan-y !important;
          overscroll-behavior: contain !important;
        }
        
        /* Ensure all scroll containers work on touch */
        div[style*="flex-direction: column"] {
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch !important;
          touch-action: pan-y !important;
          overscroll-behavior: contain !important;
        }
      ` : ''}
    `;
    document.head.appendChild(style);
  };

  // Run immediately and also on DOM changes
  fixScrolling();
  
  // Use MutationObserver to catch dynamically added elements
  const observer = new MutationObserver(() => {
    fixScrolling();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  // Also run on resize
  window.addEventListener('resize', fixScrolling);
  
  return () => {
    observer.disconnect();
    window.removeEventListener('resize', fixScrolling);
  };
};

export const forceElementScrollable = (element: HTMLElement) => {
  if (Platform.OS !== 'web') return;
  
  element.style.overflowY = 'auto';
  element.style.overflowX = 'hidden';
  element.style.webkitOverflowScrolling = 'touch';
  element.classList.add('web-scrollable');
};
