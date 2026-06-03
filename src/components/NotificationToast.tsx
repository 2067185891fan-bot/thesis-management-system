/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function NotificationToast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgClass = 'bg-white text-[#161d1f] border-l-4';
          let icon = 'info';
          let iconColor = 'text-blue-500';
          let borderL = 'border-blue-500';

          switch (toast.type) {
            case 'success':
              icon = 'check_circle';
              iconColor = 'text-emerald-500';
              borderL = 'border-emerald-500 font-bold';
              break;
            case 'error':
              icon = 'error';
              iconColor = 'text-rose-500';
              borderL = 'border-rose-500';
              break;
            case 'warning':
              icon = 'warning';
              iconColor = 'text-amber-500';
              borderL = 'border-amber-500';
              break;
            case 'info':
              icon = 'info_outline';
              iconColor = 'text-[#00475e]';
              borderL = 'border-[#00475e]';
              break;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 50, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-white/95 backdrop-blur shadow-lg border border-[#c0c8cd]/40 ${borderL}`}
            >
              <span className={`material-symbols-outlined text-xl shrink-0 ${iconColor}`}>
                {icon}
              </span>
              <div className="flex-1 min-w-0">
                <strong className="block text-xs font-bold text-gray-900 leading-tight">
                  {toast.title}
                </strong>
                <p className="mt-1 text-[11px] text-gray-600 leading-normal">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-gray-400 hover:text-gray-900 focus:outline-none cursor-pointer p-0.5 rounded-full hover:bg-gray-100 shrink-0"
              >
                <span className="material-symbols-outlined text-sm leading-none">close</span>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
