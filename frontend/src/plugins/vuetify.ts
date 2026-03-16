import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#0B3D91', // Navy Blue from reference
          secondary: '#FFC107', // Yellow Highlight
          accent: '#007BFF',
          background: '#F0F4F7', // Light Blue-Gray background
          surface: '#FFFFFF',
          'surface-variant': '#E8F0F5',
          'on-surface': '#1A202C',
          'on-background': '#1A202C',
          error: '#D32F2F',
          info: '#1976D2',
          success: '#388E3C',
          warning: '#FFA000',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#8AB4F8',
          secondary: '#F28B82',
          accent: '#81C995',
          background: '#121212',
          surface: '#1E1E1E',
          'surface-variant': '#2C2C2C',
          'on-surface': '#E8EAED',
          'on-background': '#E8EAED',
          error: '#F28B82',
          info: '#8AB4F8',
          success: '#81C995',
          warning: '#FDD663',
        },
      },
    },
  },
  defaults: {
    VCard: {
      elevation: 2,
      rounded: 'xl',
    },
    VBtn: {
      rounded: 'lg',
      fontWeight: '600',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
  },
});
