// frontend/src/lib/notify.js
import { toast } from 'sonner';

const base = { duration: 2500, className: 'rounded-xl' };

export const notify = {
  success: (msg, opts={}) => toast.success(msg, { ...base, ...opts }),
  error:   (msg, opts={}) => toast.error(msg,   { ...base, ...opts }),
  info:    (msg, opts={}) => toast(msg,         { ...base, ...opts }),
  loading: (msg, opts={}) => toast.loading(msg, { ...base, ...opts }),
  // helper untuk request async
  promise: (p, { loading='Memproses…', success='Berhasil', error='Terjadi kesalahan' }, opts={}) =>
    toast.promise(p, { loading, success, error }, { ...base, ...opts })
};
