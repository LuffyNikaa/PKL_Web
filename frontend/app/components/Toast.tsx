"use client"

import React, { useEffect } from 'react';

export type ToastItem = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number; // ms
};

export default function Toast({ items, onRemove } : { items: ToastItem[]; onRemove: (id: string) => void }) {
  useEffect(() => {
    items.forEach((t) => {
      if (t.duration && t.duration > 0) {
        const id = t.id;
        const timer = setTimeout(() => onRemove(id), t.duration);
        return () => clearTimeout(timer);
      }
    });
  }, [items, onRemove]);

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
      {items.map((t) => (
        <div key={t.id} className={`max-w-xs w-full rounded-lg shadow-lg overflow-hidden border ${t.type === 'success' ? 'border-green-200' : t.type === 'error' ? 'border-red-200' : 'border-gray-200'}`}>
          <div className={`px-4 py-3 ${t.type === 'success' ? 'bg-green-50' : t.type === 'error' ? 'bg-red-50' : 'bg-white'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{t.message}</p>
              </div>
              <button onClick={() => onRemove(t.id)} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
