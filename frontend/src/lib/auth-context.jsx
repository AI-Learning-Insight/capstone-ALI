import { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Bootstrap: kalau ada token di localStorage, ambil /me
  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setReady(true);
        return;
      }
      try {
        const res = await api.get('/me');
        const data = res.data?.data ?? null;
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data ?? null));
      } catch (err) {
        console.warn('Bootstrap /me failed', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setReady(true);
      }
    };
    bootstrap();
  }, []);

  // helper untuk sync user dari /me
  const refreshUser = async () => {
    const res = await api.get('/me');
    const data = res.data?.data ?? null;
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data ?? null));
    return data;
  };

  // LOGIN: simpan token + langsung set user
  const login = async (...args) => {
    let email, password;
    if (typeof args[0] === 'object') ({ email, password } = args[0]);
    else [email, password] = args;

    const em = String(email || '').trim().toLowerCase();
    const pw = String(password || '');

    const res = await api.post('/auth/login', { email: em, password: pw });
    const token = res.data?.data?.token;

    if (!token) {
      throw new Error('Token tidak diterima dari server');
    }

    localStorage.setItem('token', token);

    // ⬇️ PENTING: update state user di context
    const data = await refreshUser();

    // biar pemanggil bisa baca role lewat res.user.role
    return { ...(res.data ?? {}), user: data };
  };

  // REGISTER (kalau dipakai)
  const register = async (...args) => {
    let payload;
    if (typeof args[0] === 'object') payload = args[0];
    else payload = { name: args[0], email: args[1], password: args[2] };

    const n = String(payload?.name || '').trim();
    const em = String(payload?.email || '').trim().toLowerCase();
    const pw = String(payload?.password || '');

    if (!n || !em || !pw) {
      throw new Error('Nama, email, dan password wajib diisi');
    }

    const res = await api.post('/auth/register', {
      name: n,
      email: em,
      password: pw,
      ...(payload?.nisn ? { nisn: payload.nisn } : {}),
    });

    const token = res.data?.data?.token;
    if (!token) throw new Error('Token tidak diterima dari server');

    localStorage.setItem('token', token);
    const data = await refreshUser();

    return { ...(res.data ?? {}), user: data };
  };

  const logout = async () => {
    try {
      // kalau /auth/logout belum ada di backend, tidak masalah
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, ready, login, register, logout, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
