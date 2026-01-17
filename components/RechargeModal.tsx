'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface RechargeModalProps {
    isOpen: boolean
    onClose: () => void
}

export function RechargeModal({ isOpen, onClose }: RechargeModalProps) {
    const [copied, setCopied] = useState(false)
    const wechatId = "Mi70_Support" // Placeholder, user can update

    const handleCopy = () => {
        navigator.clipboard.writeText(wechatId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        {/* Modal Card */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-gold/20"
                            style={{
                                backgroundImage: `url('/assets/styles/ui_recharge_card_bg.png')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white/70 flex items-center justify-center hover:bg-black/80 transition-colors border border-white/10"
                            >
                                <X size={16} />
                            </button>

                            {/* Content Area (Centered in the "QR Space" of the image) */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pt-12">
                                {/* Simulated QR Placeholder if image doesn't have one, 
                                    but our generated image has a circular frame. 
                                    We place the text/QR inside that frame. */}

                                <div className="w-32 h-32 flex items-center justify-center relative">
                                    {/* Placeholder QR Graphic */}
                                    <div className="w-24 h-24 bg-white p-1 rounded-sm">
                                        <div className="w-full h-full bg-black flex flex-wrap content-center justify-center gap-0.5 p-1">
                                            {/* Artsy dots */}
                                            {Array.from({ length: 16 }).map((_, i) => (
                                                <div key={i} className={`w-4 h-4 rounded-sm ${i % 3 === 0 ? 'bg-[#D4AF37]' : 'bg-zinc-800'}`} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Scan Frame Overlay */}
                                    <div className="absolute inset-0 border-2 border-[#D4AF37] rounded-xl opacity-50 animate-pulse" />
                                </div>

                                <div className="mt-6 flex flex-col items-center gap-3">
                                    <p className="text-[#D4AF37] text-xs tracking-[0.2em] font-bold uppercase">WeChat Pay / 微信充值</p>

                                    {/* WeChat ID Copy */}
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-2 bg-black/40 border border-[#D4AF37]/30 px-4 py-2 rounded-full backdrop-blur-md hover:bg-black/60 transition-all active:scale-95"
                                    >
                                        <span className="text-white/90 text-sm font-medium tracking-wide">{wechatId}</span>
                                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-[#D4AF37]" />}
                                    </button>

                                    <p className="text-white/40 text-[10px]">点击复制微信号添加客服</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
