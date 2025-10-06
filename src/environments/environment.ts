import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform() && !window.location.hostname.includes('localhost');

export const environment = {
  production: false,
  apiUrl: isNative ? 'http://192.168.50.211:8000' : 'http://localhost:8000'
  // apiUrl: 'https://back-residence.onrender.com'
};
