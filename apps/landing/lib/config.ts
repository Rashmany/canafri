export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const SIGNUP_URL = `${APP_BASE_URL}/?page=Register`;
export const LOGIN_URL = `${APP_BASE_URL}/?page=Login`;
