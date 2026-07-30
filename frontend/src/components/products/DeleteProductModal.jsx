import { X, Trash2, AlertTriangle } from "lucide-react";

function DeleteProductModal({
  isOpen,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900 shadow-2xl shadow-black/50">

        {/* Top Glow */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-red-500 via-orange-400 to-red-500" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
        >
          <X size={20} />
        </button>

        {/* Body */}
        <div className="px-7 pb-7 pt-9">

          <div className="flex justify-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
              <AlertTriangle
                size={30}
                className="text-red-400"
              />
            </div>

          </div>

          <h2 className="mt-6 text-center text-2xl font-bold text-white">
            Delete Product?
          </h2>

          <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-slate-400">
            Are you sure you want to delete this product?
            <br />
            This action cannot be undone.
          </p>

          {/* Warning */}
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">

            <div className="flex items-center gap-3">

              <Trash2
                size={18}
                className="shrink-0 text-red-400"
              />

              <p className="text-xs leading-5 text-red-300">
                The product will be permanently removed
                from your inventory.
              </p>

            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-700/70 bg-slate-950/30 px-7 py-5">

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/10 transition hover:bg-red-400"
          >
            <Trash2 size={17} />
            Delete Product
          </button>

        </div>

      </div>

    </div>
  );
}

export default DeleteProductModal;