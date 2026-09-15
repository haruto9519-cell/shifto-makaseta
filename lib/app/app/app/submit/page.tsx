"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function StaffSubmitForm() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [wishes, setWishes] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const nextWeekDays = [
    { label: '月 (9/21)', date: '2026-09-21' },
    { label: '火 (9/22)', date: '2026-09-22' },
    { label: '水 (9/23)', date: '2026-09-23' },
    { label: '木 (9/24)', date: '2026-09-24' },
    { label: '金 (9/25)', date: '2026-09-25' },
  ];

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('shop_id') || '固定のテスト用ショップUUID';
    setShopId(id);
    fetchStaff(id);
  }, []);

  const fetchStaff = async (id: string) => {
    const { data } = await supabase.from('staff').select('*').eq('shop_id', id);
    if (data) setStaffList(data);
  };

  const handleSelectWish = (date: string, status: string) => {
    setWishes(prev => ({ ...prev, [date]: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return alert('名前を選択してください');
    setIsSubmitting(true);

    const insertData = nextWeekDays.map(day => ({
      shop_id: shopId,
      staff_id: selectedStaff,
      target_date: day.date,
      wish_status: wishes[day.date] || '希望',
      status: '回収中'
    }));

    const { error } = await supabase.from('shifts').upsert(insertData, { onConflict: 'staff_id,target_date' });
    setIsSubmitting(false);

    if (!error) {
      setMessage('🎉 シフトの提出が完了しました！LINEを閉じて大丈夫です。');
    } else {
      alert('エラーが発生しました。');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
        <div className="bg-emerald-600 text-white p-5 text-center">
          <h1 className="font-bold text-lg">希望シフト提出</h1>
        </div>
        {message ? (
          <div className="p-8 text-center text-emerald-600 font-bold">{message}</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">1. 名前を選択</label>
              <select 
                value={selectedStaff} 
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- 選択してください --</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-3">2. スケジュール希望</label>
              <div className="space-y-3">
                {nextWeekDays.map(day => (
                  <div key={day.date} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">{day.label}</span>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSelectWish(day.date, '希望')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${wishes[day.date] !== '不可' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-400 border'}`}
                      >
                        〇 出れる
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectWish(day.date, '不可')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${wishes[day.date] === '不可' ? 'bg-rose-50 text-white shadow-sm' : 'bg-white text-slate-400 border'}`}
                      >
                        × 不可
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-sm">
              {isSubmitting ? '送信中...' : 'シフトを提出する'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
