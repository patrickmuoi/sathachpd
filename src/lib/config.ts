// Anti-cheat configuration constants
export const ANTI_CHEAT_CONFIG = {
  MAX_VIOLATIONS: 3,
  MOBILE_GRACE_SECONDS: 30,
  DISABLE_RIGHT_CLICK: true,
  DISABLE_COPY_CUT_PASTE: true,
} as const;

// App configuration
export const APP_CONFIG = {
  APP_NAME: 'Police Exam Portal',
  DEFAULT_PASS_SCORE: 5,
  DEFAULT_TOTAL_SCORE: 10,
  DEFAULT_MIN_WORDS: 20,
  EXAM_CODE_LENGTH: 6,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_MINUTES: 15,
  DEBOUNCE_SAVE_MS: 2000,
  JWT_COOKIE_NAME: 'pd_session',
} as const;

