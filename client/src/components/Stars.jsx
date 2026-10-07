import Icon from './Icon.jsx';
import { tx } from '../lib/i18n.js';

export default function Stars({ value = 0, size = 16, onChange }) {
  return (
    <span className={`stars ${onChange ? 'stars-input' : ''}`} role={onChange ? 'radiogroup' : 'img'} aria-label={tx(`Hodnocení ${value} z 5`, `Rated ${value} out of 5`)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Icon name="star" size={size} fill="currentColor" strokeWidth={0} />;
        const cls = n <= Math.round(value) ? 'on' : '';
        return onChange ? (
          <button key={n} type="button" className={cls} onClick={() => onChange(n)} aria-label={tx(`${n} z 5`, `${n} out of 5`)} aria-checked={n === value} role="radio">
            {icon}
          </button>
        ) : (
          <span key={n} className={cls}>{icon}</span>
        );
      })}
    </span>
  );
}
