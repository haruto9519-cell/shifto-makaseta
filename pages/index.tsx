"use client";

import React, { useState, useEffect } from 'react';
// エラー原因だった読み込み場所を確実に一番外側の階層（../supabase）へ修正しました
import { supabase } from '../supabase';

export default function OwnerDashboard() {
  const [shopId, setShopId] = useState('固定のテスト用ショップUUID');
  const [ownerEmail, setOwnerEmail] = useState('owner@example.com');
  const [isPremium, setIsPremium] = useState(false);
  const [staffCount, setStaffCount] = useState(0);
  const [shifts, setShifts] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [status, setStatus] = useState('回収中');
  const [toast, setToast] = useState<string | null>(null);

  const targetDates = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'];

  useEffect(() => {
    fetchShopAndStaff();
    fetchShifts();
  }, []);

  const fetchShopAndStaff = async () => {
    const { data: shop } = await supabase.from('shops').select('plan_type').eq('id', shopId).single();
    if (shop && shop.plan_type === 'premium') {
      setIsPremium(true);
    }
    const { count } = await supabase.from('staff').select('*', { count: 'exact', head: true }).eq('shop_id', shopId);
    setStaffCount(count || 0);
  };

  const fetchShifts = async () => {
    const { data } = await supabase.from('shifts').select('*, staff(name, role)').eq('shop_id', shopId);
    if (data) {
      setShifts(data);
      if (data.length > 0) setStatus(data.status);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/submit?shop_id=${shopId}`;
    navigator.clipboard.writeText(link);
    showToast('🔗 LINE用のシフト回答リンクをクリップボードにコピーしました！');
  };

  const handleUpgrade = async () => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, email: ownerEmail }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('決済画面の起動に失敗しました。');
    }
  };

  const handleAiOptimize = async () => {
    if (!isPremium && staffCount > 3) {
      alert('⚠️ スタッフが4名以上の店舗で「AI自動調整」を利用するには、有料プラン（月額1,980円）へのアップグレードが必要です。');
      return;
    }

    setIsOptimizing(true);
    const res = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, targetDates }),
    });
    const data = await res.json();
    setIsOptimizing(false);

    if (data.success) {
      await fetchShifts();
      setStatus('調整済み');
      showToast('✨ AIによるシフトの最適化割り当てが完了しました！');
    } else {
      alert('AI調整に失敗しました。');
    }
  };

  const handlePublish = async () => {
    const { error } = await supabase.from('shifts').update({ status: '確定' }).eq('shop_id', shopId);
    if (!error) {
      setStatus('確定');
      showToast('🚀 シフトを確定しました！LINE経由でスタッフが確認可能です。');
    }
  };

  const getStaffRows = () => {
    const rows: { [key: string]: any } = {};
    shifts.forEach(s => {
      if (s.staff) {
        if (!rows[s.staff_id]) {
          rows[s.staff_id] = { name: s.staff.name, role: s.staff.role, days: {} };
        }
        rows[s.staff_id].days[s.target_date] = s;
      }
    });
    return Object.values(rows);
  };

  return (
    <div className="min-h-screen bg-yellow-50 pb-12 text-gray-800">
      {toast && <div className="fixed top-5 right-5 bg-black text-white px-5 py-3 rounded-xl shadow-2xl z-50 text-xs font-bold">{toast}</div>}
      <header className="bg-green-600 text-white px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold tracking-wider">🗓️ シフト・まかせ太</h1>
        <span className={`text-xs px-3 py-1 rounded-full font-bold ${isPremium ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-gray-300'}`}>
          {isPremium ? '👑 有料プレミアム会員' : '🌱 無料プラン'}
        </span>
      </header>
      <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {!isPremium && staffCount > 3 && (
          <div className="bg-gradient-to-r from-yellow-500 to-red-600 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="font-black text-lg">💡 有料プランへのアップグレードが必要です</h3>
              <p className="text-xs text-yellow-100 mt-1">現在のスタッフ数が無料枠を超えているため、AI自動調整機能がロックされています。</p>
            </div>
            <button onClick={handleUpgrade} className="mt-4 md:mt-0 bg-white text-red-600 font-bold px-6 py-3 rounded-xl text-xs hover:bg-yellow-50 transition-all shadow-md">
              月額1,980円で全機能を解放する
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border">
            <p className="text-xs font-bold text-gray-400">現在のステータス</p>
            <p className={`text-lg font-black mt-1 ${status === '確定' ? 'text-green-600' : 'text-yellow-500'}`}>
              {status === '回収中' && '⏳ スタッフ希望回収中'}
              {status === '調整済み' && '🤖 AI調整済み（未確定）'}
              {status === '確定' && '🎉 シフト確定・配信済み'}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center">
            <button onClick={handleCopyLink} className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-bold py-3 rounded-xl text-xs border border-green-200 transition-colors">
              🔗 回答用LINEリンクをコピー
            </button>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border flex items-center">
            {status === '調整済み' ? (
              <button onClick={handlePublish} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-sm">
                🚀 シフトを確定してスタッフに配信
              </button>
            ) : (
              <button onClick={handleAiOptimize} disabled={isOptimizing} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-sm disabled:bg-gray-300">
                {isOptimizing ? 'AI計算中...' : '✨ AI自動シフト調整を起動'}
              </button>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-bold text-sm">シフトスケジュール</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 font-bold border-b text-gray-600">
                  <th className="p-4">スタッフ</th>
                  <th className="p-4 text-center">月</th>
                  <th className="p-4 text-center">火</th>
                  <th className="p-4 text-center">水</th>
                  <th className="p-4 text-center">木</th>
                  <th className="p-4 text-center">金</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {getStaffRows().map((row: any) => (
                  <tr key={row.name} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{row.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{row.role}</p>
                    </td>
                    {targetDates.map(date => {
                      const dayData = row.days[date];
                      if (!dayData) return <td key={date} className="p-4 text-center text-gray-300">-</td>;
                      return (
                        <td key={date} className="p-4 text-center">
                          {status === '回収中' ? (
                            <span className={`px-3 py-1 rounded-md font-bold text-[10px] ${dayData.wish_status === '不可' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              {dayData.wish_status === '不可' ? '× 不可' : '〇 希望'}
                            </span>
                          ) : (
                            <span className={`px-2 py-1 rounded-md font-medium ${dayData.assigned_time === '休み' ? 'bg-gray-100 text-gray-400' : 'bg-green-600 text-white font-bold'}`}>
                              {dayData.assigned_time}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
