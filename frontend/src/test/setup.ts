import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill window.URL.createObjectURL for MapLibre in jsdom
if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => 'blob:mock-url';
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = () => {};
  }

  // Mock matchMedia
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addListener: function () {},
        removeListener: function () {},
      };
    };
}

// Mock MapLibre GL for jsdom environment
vi.mock('maplibre-gl', () => {
  class MockMap {
    addControl = vi.fn();
    on = vi.fn((event, callback) => {
      if (event === 'load') setTimeout(callback, 0);
    });
    remove = vi.fn();
    addSource = vi.fn();
    removeSource = vi.fn();
    getSource = vi.fn();
    addLayer = vi.fn();
    removeLayer = vi.fn();
    getLayer = vi.fn();
    fitBounds = vi.fn();
  }

  class MockMarker {
    setLngLat = vi.fn().mockReturnThis();
    setPopup = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
  }

  class MockPopup {
    setText = vi.fn().mockReturnThis();
  }

  class MockLngLatBounds {
    extend = vi.fn().mockReturnThis();
  }

  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      Popup: MockPopup,
      LngLatBounds: MockLngLatBounds,
      NavigationControl: vi.fn(),
      AttributionControl: vi.fn(),
      setWorkerUrl: vi.fn(),
    },
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    LngLatBounds: MockLngLatBounds,
    NavigationControl: vi.fn(),
    AttributionControl: vi.fn(),
    setWorkerUrl: vi.fn(),
  };
});
