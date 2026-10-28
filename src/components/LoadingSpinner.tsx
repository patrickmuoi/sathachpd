import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-6 w-6 border-2',
  md: 'h-10 w-10 border-3',
  lg: 'h-16 w-16 border-4',
} as const;

export default function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center justify-center p-4"
      role="status"
      aria-label={t('common.loading')}
    >
      <div
        className={`${sizeMap[size]} animate-spin rounded-full border-[var(--color-primary)] border-t-[var(--color-accent)]`}
      />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}
