import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { useDisplayInfo, useDisplayById, useDisplayBounds } from '@/hooks/useDisplayInfo';
import { setDisplays } from '@/lib/displaySlice';
import { mockDisplays } from '../utils/test-utils';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useDisplayInfo', () => {
  beforeEach(() => {
    // Set up mock displays in the store
    store.dispatch(setDisplays(mockDisplays));
  });

  it('should return all displays', () => {
    const { result } = renderHook(() => useDisplayInfo(), { wrapper });

    expect(result.current.displays).toEqual(mockDisplays);
    expect(result.current.primaryDisplay).toEqual(mockDisplays[0]);
    expect(result.current.secondaryDisplay).toEqual(mockDisplays[1]);
    expect(result.current.hasMultipleDisplays).toBe(true);
  });

  it('should provide getDisplayById function', () => {
    const { result } = renderHook(() => useDisplayInfo(), { wrapper });

    expect(result.current.getDisplayById(1)).toEqual(mockDisplays[0]);
    expect(result.current.getDisplayById(999)).toBeNull();
  });
});

describe('useDisplayById', () => {
  beforeEach(() => {
    store.dispatch(setDisplays(mockDisplays));
  });

  it('should return display by id', () => {
    const { result } = renderHook(() => useDisplayById(1), { wrapper });
    expect(result.current).toEqual(mockDisplays[0]);
  });

  it('should return null for non-existent id', () => {
    const { result } = renderHook(() => useDisplayById(999), { wrapper });
    expect(result.current).toBeNull();
  });

  it('should return null for null id', () => {
    const { result } = renderHook(() => useDisplayById(null), { wrapper });
    expect(result.current).toBeNull();
  });
});

describe('useDisplayBounds', () => {
  beforeEach(() => {
    store.dispatch(setDisplays(mockDisplays));
  });

  it('should return display bounds for valid id', () => {
    const { result } = renderHook(() => useDisplayBounds(1), { wrapper });

    expect(result.current.bounds).toEqual(mockDisplays[0].bounds);
    expect(result.current.workArea).toEqual(mockDisplays[0].workArea);
    expect(result.current.scaleFactor).toBe(mockDisplays[0].scaleFactor);
  });

  it('should return null bounds for invalid id', () => {
    const { result } = renderHook(() => useDisplayBounds(999), { wrapper });

    expect(result.current.bounds).toBeNull();
    expect(result.current.workArea).toBeNull();
    expect(result.current.scaleFactor).toBe(1); // Default fallback
  });

  it('should return null bounds for null id', () => {
    const { result } = renderHook(() => useDisplayBounds(null), { wrapper });

    expect(result.current.bounds).toBeNull();
    expect(result.current.workArea).toBeNull();
    expect(result.current.scaleFactor).toBe(1); // Default fallback
  });
}); 