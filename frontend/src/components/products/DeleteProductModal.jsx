function DeleteProductModal({
  isOpen,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">

      <div className="bg-white rounded-3xl shadow-2xl w-[420px] p-8">

        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-800">
          Delete Product
        </h2>

        <p className="text-center text-slate-500 mt-4">
          Are you sure you want to delete this product?
          <br />
          This action cannot be undone.
        </p>

        <div className="flex justify-center gap-4 mt-8">

          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-slate-200 hover:bg-slate-300"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Delete
          </button>

        </div>

      </div>

    </div>
  );
}

export default DeleteProductModal;