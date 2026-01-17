import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, id, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label htmlFor={id} className="text-sm font-medium text-gray-500 ml-1">
                        {label}
                    </label>
                )}
                <input
                    id={id}
                    ref={ref}
                    className={twMerge(
                        clsx(
                            "w-full px-4 py-3 rounded-2xl bg-white/50 border border-transparent focus:border-blue-500/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 outline-none placeholder:text-gray-400 text-gray-900",
                            className
                        )
                    )}
                    {...props}
                />
            </div>
        )
    }
)
Input.displayName = 'Input'
