// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import './styles/tailwind.css';
import { AuthProvider } from './lib/auth-context.jsx';
import { Toaster } from 'sonner'; // ⬅️ pasang di root, satu kali

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
