import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost'
    isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: "bg-[#007AFF] text-white hover:bg-[#0071E3] active:scale-95 shadow-lg shadow-blue-500/20",
            secondary: "bg-white/50 text-gray-900 border border-white/20 hover:bg-white active:scale-95 shadow-sm",
            ghost: "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
        }

        return (
            <button
                ref={ref}
                disabled={isLoading || disabled}
                className={twMerge(
                    clsx(
                        "relative flex items-center justify-center px-6 py-3 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                        variants[variant],
                        className
                    )
                )}
                {...props}
            >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {children}
            </button>
        )
    }
)
Button.displayName = 'Button'
