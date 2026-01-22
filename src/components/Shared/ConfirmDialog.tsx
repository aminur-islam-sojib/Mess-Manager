import React from "react";
import { AlertTriangle, X } from "lucide-react";

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "warning" | "danger";
};

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Continue",
  cancelText = "Cancel",
  variant = "warning",
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const variants = {
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
      confirmBg: "bg-amber-500 hover:bg-amber-600",
      iconBg: "bg-amber-50",
    },
    danger: {
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      confirmBg: "bg-red-500 hover:bg-red-600",
      iconBg: "bg-red-50",
    },
  };

  const style = variants[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${style.iconBg}`}
          >
            {style.icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-center text-xl font-semibold text-gray-900">
          {title}
        </h3>

        {/* Message */}
        <p className="mb-6 text-center text-gray-600 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 font-medium text-white transition-colors ${style.confirmBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
