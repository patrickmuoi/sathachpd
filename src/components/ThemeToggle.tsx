import { useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../lib/store';

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { isDark, toggle } = useThemeStore();
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    toggle(cx, cy);
  };

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent)]"
      aria-label={isDark ? t('common.lightMode', 'Light mode') : t('common.darkMode', 'Dark mode')}
      title={isDark ? t('common.lightMode', 'Light mode') : t('common.darkMode', 'Dark mode')}
    >
      <div
        className={prefersReducedMotion ? '' : 'transition-transform duration-500'}
        style={{
          transform: isDark ? 'rotate(360deg)' : 'rotate(0deg)',
        }}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </div>
    </button>
  );
}
