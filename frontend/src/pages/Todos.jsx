import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Todos() {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('');

  const load = () => api.get('/todos').then((r) => setList(r.data.data));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    await api.post('/todos', { title });
    setTitle('');
    load();
  };

  const setStatus = async (id, status) => {
    await api.patch(`/todos/${id}/status`, { status });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">To-do List</h2>
      <form onSubmit={add} className="flex gap-2 mb-4">
        <input className="flex-1 border rounded px-3 py-2" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Tambah tugas..." />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Tambah</button>
      </form>
      <ul className="space-y-2">
        {list.map((t) => (
          <li key={t.id} className="border rounded px-3 py-2 flex justify-between items-center">
            <div>
              <div className="font-medium">{t.title}</div>
              <div className="text-xs text-gray-500">{t.subject || '-'}</div>
            </div>
            <div className="flex gap-2">
              {['pending', 'doing', 'done'].map((s) => (
                <button key={s} onClick={() => setStatus(t.id, s)} className={`px-2 py-1 text-xs rounded ${t.status===s ? 'bg-blue-600 text-white':'bg-gray-100'}`}>
                  {s}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
