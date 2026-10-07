import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

/** Load JSON from the API and re-load whenever `path` changes. */
export function useFetch(path, deps = []) {
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null });
  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api.get(path);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => {
    load();
  }, [load]);
  return { ...state, reload: load, setData: (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })) };
}
