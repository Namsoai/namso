import "@testing-library/jest-dom";

// Provide stub Supabase env vars so the client module doesn't throw during
// test imports. Real network calls are still blocked by vi.mock() in tests.
if (!(import.meta as any).env) {
  (import.meta as any).env = {};
}
(import.meta as any).env.VITE_SUPABASE_URL ??= "https://test.supabase.co";
(import.meta as any).env.VITE_SUPABASE_ANON_KEY ??= "test-anon-key";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
