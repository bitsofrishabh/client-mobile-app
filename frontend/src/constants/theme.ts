// Theme constants for DietTracker Pro - Fitnest style

export const Colors = {
  // Primary gradient colors (blue)
  primary: '#92A3FD',
  primaryDark: '#9DCEFF',
  
  // Secondary gradient colors (purple/pink)
  secondary: '#C58BF2',
  secondaryLight: '#EEA4CE',
  
  // Background colors
  background: '#FFFFFF',
  backgroundGray: '#F7F8F8',
  
  // Text colors
  textDark: '#1D1617',
  textMedium: '#7B6F72',
  textLight: '#ADA4A5',
  
  // Status colors
  success: '#42D742',
  warning: '#FFA500',
  error: '#FF4757',
  
  // Border colors
  border: '#F7F8F8',
  borderDark: '#DDDADA',
};

export const Gradients = {
  primary: ['#92A3FD', '#9DCEFF'],
  secondary: ['#C58BF2', '#EEA4CE'],
  bluePurple: ['#92A3FD', '#C58BF2'],
};

export const Typography = {
  heading1: {
    fontSize: 26,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 30,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  caption: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 15,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BorderRadius = {
  small: 8,
  medium: 14,
  large: 22,
  full: 99,
};

export const Shadow = {
  light: {
    shadowColor: '#1D1617',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#1D1617',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
};
