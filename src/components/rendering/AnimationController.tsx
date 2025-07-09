import React, { useEffect, useRef, useState } from 'react';
import { PreparedAnimations } from '@/services/RenderingEngine';

interface AnimationControllerProps {
  animations: PreparedAnimations;
  isActive: boolean;
  onComplete?: () => void;
  children: React.ReactNode;
}

export const AnimationController: React.FC<AnimationControllerProps> = ({
  animations,
  isActive,
  onComplete,
  children,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [animationState, setAnimationState] = useState<'entering' | 'active' | 'exiting' | 'inactive'>('inactive');

  useEffect(() => {
    if (isActive && animationState === 'inactive') {
      setAnimationState('entering');
      playEntranceAnimation();
    } else if (!isActive && animationState === 'active') {
      setAnimationState('exiting');
      playExitAnimation();
    }
  }, [isActive, animationState]);

  const playEntranceAnimation = () => {
    const element = elementRef.current;
    if (!element || !animations.entrance) {
      setAnimationState('active');
      return;
    }

    const animationCSS = generateAnimationCSS(animations.entrance, animations.duration, animations.delay, animations.easing);
    applyAnimation(element, animationCSS, () => {
      setAnimationState('active');
    });
  };

  const playExitAnimation = () => {
    const element = elementRef.current;
    if (!element || !animations.exit) {
      setAnimationState('inactive');
      onComplete?.();
      return;
    }

    const animationCSS = generateAnimationCSS(animations.exit, animations.duration, 0, animations.easing);
    applyAnimation(element, animationCSS, () => {
      setAnimationState('inactive');
      onComplete?.();
    });
  };

  const playEmphasisAnimation = (emphasisIndex: number = 0) => {
    const element = elementRef.current;
    if (!element || !animations.emphasis || emphasisIndex >= animations.emphasis.length) {
      return;
    }

    const emphasis = animations.emphasis[emphasisIndex];
    const animationCSS = generateAnimationCSS(emphasis, emphasis.duration, 0, animations.easing);
    applyAnimation(element, animationCSS, () => {
      // Play next emphasis animation if available
      if (emphasisIndex + 1 < animations.emphasis!.length) {
        setTimeout(() => playEmphasisAnimation(emphasisIndex + 1), 100);
      }
    });
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    opacity: animationState === 'inactive' ? 0 : 1,
    transition: animationState === 'entering' || animationState === 'exiting' ? 'none' : 'opacity 0.3s ease',
  };

  return (
    <div
      ref={elementRef}
      className={`animation-controller ${animationState}`}
      style={containerStyle}
      onClick={() => {
        if (animationState === 'active' && animations.emphasis) {
          playEmphasisAnimation();
        }
      }}
    >
      {children}
    </div>
  );
};

const generateAnimationCSS = (
  animation: any,
  duration: number = 300,
  delay: number = 0,
  easing: string = 'ease'
): string => {
  const animationName = `${animation.type}-${animation.direction || 'default'}`;
  return `${animationName} ${duration}ms ${easing} ${delay}ms forwards`;
};

const applyAnimation = (
  element: HTMLElement,
  animationCSS: string,
  onComplete: () => void
) => {
  element.style.animation = animationCSS;
  
  const handleAnimationEnd = () => {
    element.removeEventListener('animationend', handleAnimationEnd);
    onComplete();
  };

  element.addEventListener('animationend', handleAnimationEnd);
};

// Add CSS animations to the document head
const addAnimationStyles = () => {
  if (document.getElementById('slide-animations')) return;

  const style = document.createElement('style');
  style.id = 'slide-animations';
  style.textContent = `
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    
    @keyframes slide-up {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    
    @keyframes slide-down {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }
    
    @keyframes slide-left {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    
    @keyframes slide-right {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    
    @keyframes zoom-in {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
    
    @keyframes zoom-out {
      from { transform: scale(1); }
      to { transform: scale(0); }
    }
    
    @keyframes rotate-in {
      from { transform: rotate(-180deg) scale(0); }
      to { transform: rotate(0deg) scale(1); }
    }
    
    @keyframes bounce-in {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    
    @keyframes flip-in {
      from { transform: rotateY(-90deg); }
      to { transform: rotateY(0deg); }
    }
  `;
  
  document.head.appendChild(style);
};

// Initialize animations when component loads
addAnimationStyles();

export default AnimationController; 