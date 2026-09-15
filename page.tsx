// src/app/staff/shift/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const SHIFT_TYPES = [
  { code: 'morning', label: '☀️ 朝番 (9:00-17:00)' },
  { code: 'afternoon', label: '🌤 遅番 (17:00-22:00)' },
  { code: 'night', label: '🌙 夜勤 (22:00-5:00)' },
  { code: 'off', label: '❌ 休み希望' }
];

export default function StaffShiftPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedType, setSelectedType] = useState<string>('morning');
  const [myShifts, setMyShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const fetchMyShifts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('shift_requests').select('*').eq('user_id', user.id).order('date', { ascending: true });
    if (data) setMyShifts(data);
  };

  useEffect(() => { fetchMyShifts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('ログインが必要です');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('shift_requests').upsert({
      user_id: user.id,
      date: selectedDate,
      shift_type: selectedType
    }, { onConflict: 'user_id,date' });

    if (error) {
      setMessage(`エラーが発生しました: ${error.message}`);
    } else {
      setMessage('🎉 シフト希望を提出・更新しました！');
      fetchMyShifts();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-10 p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h1 className="text-xl font-bold text-gray-800 mb-6">📅 シフト希望提出</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">希望日</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-1 block w-full rounded-md shadow-sm text-base p-2 border" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">希望シフト</label>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {SHIFT_TYPES.map((type) => (
              <button key={type.code} type="button" onClick={() => setSelectedType(type.code)} className={`p-3 text-left rounded-lg border text-sm font-medium transition-all ${selectedType === type.code ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>{type.label}</button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400">{loading ? '送信中...' : 'シフトを提出する'}</button>
      </form>
      {message && <p className="mt-4 text-center text-sm font-semibold text-indigo-600">{message}</p>}
    </div>
  );
}
