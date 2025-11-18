import { useState } from 'react';
import api from '../lib/api';

export default function Assessment() {
  const [scores, setScores] = useState({ math: 80, biology: 80, history: 70, economics: 70 });
  const [psych, setPsych] = useState({ openness: 3, conscientiousness: 3, analytical: 3 });
  const [style, setStyle] = useState('consistent');
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/assessments', { scores, psych, learning_style: style });
    const r = await api.post('/predict', { scores, psych, learning_style: style }); // optional: server-side predict
    setResult(r.data.data);
  };

  const set = (obj, key, val) => obj === 'scores'
    ? setScores((s) => ({ ...s, [key]: Number(val) }))
    : setPsych((s) => ({ ...s, [key]: Number(val) }));

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Assessment</h2>
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-4 space-y-4">
        <Section title="Nilai Akademik (0-100)">
          {Object.keys(scores).map((k) => (
            <NumberField key={k} label={k} value={scores[k]} onChange={(v)=>set('scores', k, v)} />
          ))}
        </Section>
        <Section title="Psikologi (1-5)">
          {Object.keys(psych).map((k) => (
            <NumberField key={k} label={k} min="1" max="5" value={psych[k]} onChange={(v)=>set('psych', k, v)} />
          ))}
        </Section>
        <Section title="Gaya Belajar">
          <select className="border rounded px-3 py-2" value={style} onChange={(e)=>setStyle(e.target.value)}>
            <option value="fast">Fast</option>
            <option value="consistent">Consistent</option>
            <option value="reflective">Reflective</option>
          </select>
        </Section>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Kirim & Prediksi</button>
      </form>

      {result && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="font-semibold">Hasil Prediksi Track: {result.track}</div>
          <div className="text-sm">Confidence: {Math.round(result.confidence * 100)}%</div>
          <div className="text-sm mt-2">Top Program: {result.top_programs?.join(', ')}</div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="font-semibold mb-2">{title}</div>
      <div className="grid grid-cols-4 gap-3">{children}</div>
    </div>
  );
}

function NumberField({ label, value, onChange, min=0, max=100 }) {
  return (
    <label className="text-sm">
      <div className="capitalize">{label}</div>
      <input type="number" className="w-full border rounded px-2 py-1" min={min} max={max} value={value} onChange={(e)=>onChange(e.target.value)} />
    </label>
  );
}
