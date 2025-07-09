import React, { useEffect, useRef, useState } from 'react';
import { PreparedTransitions } from '@/services/RenderingEngine';

interface TransitionControllerProps {
  transitions: PreparedTransitions;
  isActive: boolean;
  onComplete?: () => void;
  children: React.ReactNode;
}

export const TransitionController: React.FC<TransitionControllerProps> = ({
  transitions,
  isActive,
  onComplete,
  children,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [transitionState, setTransitionState] = useState<'entering' | 'active' | 'exiting' | 'inactive'>('inactive');

  useEffect(() => {
    if (isActive && transitionState !== 'active') {
      setTransitionState('entering');
      playEnterTransition();
    } else if (!isActive && transitionState === 'active') {
      setTransitionState('exiting');
      playExitTransition();
    }
  }, [isActive]);

  const playEnterTransition = () => {
    const element = elementRef.current;
    if (!element || !transitions.type || transitions.type === 'none') {
      setTransitionState('active');
      return;
    }

    const transitionCSS = generateTransitionCSS(transitions, 'enter');
    applyTransition(element, transitionCSS, () => {
      setTransitionState('active');
    });
  };

  const playExitTransition = () => {
    const element = elementRef.current;
    if (!element || !transitions.type || transitions.type === 'none') {
      setTransitionState('inactive');
      onComplete?.();
      return;
    }

    const transitionCSS = generateTransitionCSS(transitions, 'exit');
    applyTransition(element, transitionCSS, () => {
      setTransitionState('inactive');
      onComplete?.();
    });
  };

  const getInitialTransform = (): React.CSSProperties => {
    if (!transitions.type || transitions.type === 'none' || transitionState === 'active') {
      return {};
    }

    const isEntering = transitionState === 'entering';
    const direction = transitions.direction || 'right';

    switch (transitions.type) {
      case 'slide':
        if (isEntering) {
          switch (direction) {
            case 'up': return { transform: 'translateY(100%)' };
            case 'down': return { transform: 'translateY(-100%)' };
            case 'left': return { transform: 'translateX(100%)' };
            case 'right': return { transform: 'translateX(-100%)' };
            default: return { transform: 'translateX(-100%)' };
          }
        } else {
          switch (direction) {
            case 'up': return { transform: 'translateY(-100%)' };
            case 'down': return { transform: 'translateY(100%)' };
            case 'left': return { transform: 'translateX(-100%)' };
            case 'right': return { transform: 'translateX(100%)' };
            default: return { transform: 'translateX(100%)' };
          }
        }
      case 'fade':
        return { opacity: isEntering ? 0 : 1 };
      case 'push':
        return isEntering ? { transform: 'translateX(-100%)' } : { transform: 'translateX(100%)' };
      case 'cover':
        return isEntering ? { transform: 'translateX(100%)' } : { transform: 'translateX(-100%)' };
      case 'uncover':
        return isEntering ? { transform: 'translateX(-100%)' } : { transform: 'translateX(100%)' };
      default:
        return {};
    }
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    transition: transitionState === 'entering' || transitionState === 'exiting' 
      ? `all ${transitions.duration || 300}ms ${transitions.easing || 'ease'}`
      : 'none',
    ...getInitialTransform(),
  };

  return (
    <div
      ref={elementRef}
      className={`transition-controller ${transitionState}`}
      style={containerStyle}
    >
      {children}
    </div>
  );
};

const generateTransitionCSS = (
  transitions: PreparedTransitions,
  phase: 'enter' | 'exit'
): React.CSSProperties => {
  const duration = transitions.duration || 300;
  const easing = transitions.easing || 'ease';
  const direction = transitions.direction || 'right';

  const baseStyle: React.CSSProperties = {
    transition: `all ${duration}ms ${easing}`,
  };

  switch (transitions.type) {
    case 'fade':
      return {
        ...baseStyle,
        opacity: phase === 'enter' ? 1 : 0,
      };
    case 'slide':
      return {
        ...baseStyle,
        transform: phase === 'enter' ? 'translate(0, 0)' : getSlideTransform(direction, phase),
      };
    case 'push':
      return {
        ...baseStyle,
        transform: phase === 'enter' ? 'translateX(0)' : 'translateX(-100%)',
      };
    case 'cover':
      return {
        ...baseStyle,
        transform: phase === 'enter' ? 'translateX(0)' : 'translateX(-100%)',
      };
    case 'uncover':
      return {
        ...baseStyle,
        transform: phase === 'enter' ? 'translateX(0)' : 'translateX(100%)',
      };
    default:
      return baseStyle;
  }
};

const getSlideTransform = (direction: string, phase: 'enter' | 'exit'): string => {
  const isEntering = phase === 'enter';
  
  switch (direction) {
    case 'up':
      return isEntering ? 'translateY(0)' : 'translateY(-100%)';
    case 'down':
      return isEntering ? 'translateY(0)' : 'translateY(100%)';
    case 'left':
      return isEntering ? 'translateX(0)' : 'translateX(-100%)';
    case 'right':
      return isEntering ? 'translateX(0)' : 'translateX(100%)';
    default:
      return 'translate(0, 0)';
  }
};

const applyTransition = (
  element: HTMLElement,
  transitionStyles: React.CSSProperties,
  onComplete: () => void
) => {
  Object.assign(element.style, transitionStyles);
  
  const handleTransitionEnd = () => {
    element.removeEventListener('transitionend', handleTransitionEnd);
    onComplete();
  };

  element.addEventListener('transitionend', handleTransitionEnd);
  
  // Fallback timeout in case transitionend doesn't fire
  setTimeout(() => {
    element.removeEventListener('transitionend', handleTransitionEnd);
    onComplete();
  }, (transitionStyles.transitionDuration as any) || 300);
};

export default TransitionController; 