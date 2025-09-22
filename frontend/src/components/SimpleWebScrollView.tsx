import React, { useRef, useEffect } from 'react';
import { Platform, ScrollView, ScrollViewProps } from 'react-native';

interface SimpleWebScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
}

const SimpleWebScrollView: React.FC<SimpleWebScrollViewProps> = ({ 
  children, 
  style, 
  contentContainerStyle, 
  ...props 
}) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Simple fix: just ensure the element is scrollable
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          const element = scrollRef.current as any;
          const nativeElement = element?._nativeTag ? 
            document.querySelector(`[data-tag="${element._nativeTag}"]`) : 
            element;
          
          if (nativeElement) {
            nativeElement.style.overflowY = 'scroll';
            nativeElement.style.height = '100%';
            nativeElement.style.webkitOverflowScrolling = 'touch';
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  if (Platform.OS === 'web') {
    return (
      <div
        style={{
          height: '100%',
          overflowY: 'scroll',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          ...((style as any) || {}),
        }}
      >
        <div style={{
          ...((contentContainerStyle as any) || {}),
          minHeight: '100%',
        }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <ScrollView 
      ref={scrollRef} 
      style={style} 
      contentContainerStyle={contentContainerStyle} 
      {...props}
    >
      {children}
    </ScrollView>
  );
};

export default SimpleWebScrollView;
