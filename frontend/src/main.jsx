// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import './styles/tailwind.css';
import { AuthProvider } from './lib/auth-context.jsx';
import { ThemeProvider } from './lib/theme-context.jsx';
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        {/* Toaster global (cukup sekali) */}
        <Toaster
          richColors
          position="top-center"
          expand
          toastOptions={{ className: 'rounded-xl shadow-lg' }}
        />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
