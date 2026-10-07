import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const SettingsContext = createContext(null);

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  return m ? `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}` : null;
}

/** Push appearance settings into CSS custom properties. */
function applyAppearance(settings) {
  const a = settings.appearance;
  const root = document.documentElement;
  const set = (name, val) => val && root.style.setProperty(name, val);
  set('--primary', a.primaryColor);
  set('--primary-rgb', hexToRgb(a.primaryColor));
  set('--accent', a.accentColor);
  set('--accent-rgb', hexToRgb(a.accentColor));
  set('--dark', a.darkColor);
  set('--bg', a.backgroundColor);
  set('--radius', `${a.radius}px`);
  set('--font', `'${a.fontFamily}', system-ui, sans-serif`);
  document.body.classList.toggle('no-anim', !a.animations);
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  const load = () =>
    api
      .get('/settings')
      .then((d) => {
        setSettings(d.settings);
        applyAppearance(d.settings);
      })
      .catch(setError);

  useEffect(() => {
    load();
  }, []);

  const update = (s) => {
    setSettings(s);
    applyAppearance(s);
  };

  return (
    <SettingsContext.Provider value={{ settings, error, reload: load, update }}>{children}</SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
