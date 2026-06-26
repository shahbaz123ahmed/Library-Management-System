"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function Modal({ open, title, children, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col min-h-0"
          >
            {/* Animated gradient border wrapper */}
            <div className="relative overflow-hidden rounded-2xl p-0.75 shadow-2xl flex flex-col flex-1 min-h-0">
              {/* Static base */}
              <div className="absolute inset-0 rounded-2xl bg-slate-200/40" />

              {/* Two-beam conic-gradient spinning border */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-60%]"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, #8b5cf6 10deg, #3b82f6 45deg, #06b6d4 80deg, transparent 90deg, transparent 180deg, #ec4899 190deg, #a855f7 225deg, #3b82f6 260deg, transparent 270deg, transparent 360deg)",
                }}
              />

              {/* Inner card */}
              <div className="relative rounded-[14px] bg-white flex flex-col flex-1 overflow-hidden min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
                  <motion.h3
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.08 }}
                    className="text-lg font-bold bg-linear-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent"
                  >
                    {title}
                  </motion.h3>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.15, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="px-6 py-5 overflow-y-auto flex-1 text-slate-800"
                >
                  {children}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
