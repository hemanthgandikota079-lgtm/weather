export function simpleCache() {
  const store = new Map();
  return {
    get(key) {
      const v = store.get(key);
      if (!v) return null;
      const { expires, value } = v;
      if (Date.now() > expires) { store.delete(key); return null; }
      return value;
    },
    set(key, value, ttlSeconds = 300) {
      store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
    },
    del(key) { store.delete(key); }
  };
}
