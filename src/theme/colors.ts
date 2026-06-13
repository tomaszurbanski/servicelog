export const light = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  primary: '#2563EB',
  primaryBg: '#EFF6FF',
  success: '#16A34A',
  successBg: '#F0FDF4',
  danger: '#DC2626',
  tabBar: '#FFFFFF',
  tabBorder: '#E2E8F0',
  inputBg: '#F8FAFC',
  statusBar: 'dark' as 'dark' | 'light',
};

export const dark = {
  bg: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  muted: '#94A3B8',
  border: '#334155',
  primary: '#3B82F6',
  primaryBg: '#1E3A5F',
  success: '#22C55E',
  successBg: '#052E16',
  danger: '#EF4444',
  tabBar: '#1E293B',
  tabBorder: '#334155',
  inputBg: '#0F172A',
  statusBar: 'light' as 'dark' | 'light',
};

export type Colors = typeof light;
