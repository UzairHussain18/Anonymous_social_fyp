import React, { useRef, useEffect } from 'react';
import { Platform, ScrollView, ScrollViewProps } from 'react-native';

interface WebScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
}

const WebScrollView: React.FC<WebScrollViewProps> = ({ children, style, contentContainerStyle, ...props }) => {
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && scrollRef.current) {
      // Force proper scrolling on web
      const element = scrollRef.current;
      if (element && element._nativeTag) {
        const domNode = document.querySelector(`[data-tag="${element._nativeTag}"]`);
        if (domNode) {
          (domNode as HTMLElement).style.overflowY = 'auto';
          (domNode as HTMLElement).style.overflowX = 'hidden';
          (domNode as HTMLElement).style.height = '100%';
          (domNode as HTMLElement).style.webkitOverflowScrolling = 'touch';
        }
      }
    }
  }, []);

  if (Platform.OS === 'web') {
    // Detect if we're in mobile emulation or on a touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Use a regular ScrollView but with forced web styling
    return (
      <ScrollView 
        ref={scrollRef}
        style={[
          style,
          {
            flex: 1,
            // @ts-ignore - Web-specific styles
            overflowY: 'auto',
            overflowX: 'hidden',
            height: '100%',
            WebkitOverflowScrolling: 'touch',
            // Additional mobile-specific styles
            ...(isTouchDevice && {
              touchAction: 'pan-y',
              overscrollBehavior: 'contain',
            }),
          }
        ]} 
        contentContainerStyle={[
          contentContainerStyle,
          // Ensure content has minimum height for scrolling
          { minHeight: '100%', paddingBottom: 50 }
        ]} 
        {...props}
        // Force scrolling to be enabled
        scrollEnabled={true}
        showsVerticalScrollIndicator={props.showsVerticalScrollIndicator !== false}
        // Add bounces for iOS-like behavior
        bounces={true}
        // Enable momentum scrolling
        decelerationRate="normal"
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <ScrollView ref={scrollRef} style={style} contentContainerStyle={contentContainerStyle} {...props}>
      {children}
    </ScrollView>
  );
};

export default WebScrollView;
