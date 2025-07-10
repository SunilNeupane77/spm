import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
    };
  },
  useParams() {
    return { id: 'test-id' };
  },
  usePathname() {
    return '';
  },
}));

// Mock ResizeObserver which is not available in Jest DOM environment
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock the fetch function
global.fetch = jest.fn();
