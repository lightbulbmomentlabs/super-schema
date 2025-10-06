import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const variantStyles = {
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
    info: 'bg-primary text-primary-foreground hover:bg-primary/90'
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="bg-background border border-border rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <p className="text-muted-foreground">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-input hover:bg-accent transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={cn(
                'px-4 py-2 text-sm rounded-md transition-colors',
                variantStyles[variant]
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
