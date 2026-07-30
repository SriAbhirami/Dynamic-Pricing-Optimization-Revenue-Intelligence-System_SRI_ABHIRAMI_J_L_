import { useState } from "react";
import API from "../../api/axios";
import {
  X,
  PackagePlus,
  Tag,
  IndianRupee,
  Boxes,
} from "lucide-react";

function AddProductModal({ isOpen, onClose, onProductAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    current_price: "",
    stock: "",
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      current_price: "",
      stock: "",
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.category ||
      !formData.current_price ||
      !formData.stock
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (
      Number(formData.current_price) < 0 ||
      Number(formData.stock) < 0
    ) {
      alert("Price and Stock cannot be negative.");
      return;
    }

    try {
      setLoading(true);

      await API.post("/products/", {
        ...formData,
        current_price: Number(formData.current_price),
        stock: Number(formData.stock),
      });

      resetForm();

      onProductAdded();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900 shadow-2xl shadow-black/50">

        {/* Top Glow */}
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-lime-300 to-emerald-500" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/70 px-7 py-6">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
              <PackagePlus
                size={24}
                className="text-emerald-400"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                Add New Product
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Add a product to your inventory
              </p>
            </div>

          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X size={21} />
          </button>

        </div>

        {/* Body */}
        <div className="space-y-5 px-7 py-7">

          {/* Product Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Product Name
            </label>

            <div className="relative">

              <PackagePlus
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                name="name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-3.5 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10"
              />

            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Category
            </label>

            <div className="relative">

              <Tag
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                name="category"
                placeholder="Enter product category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-3.5 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10"
              />

            </div>
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Current Price
              </label>

              <div className="relative">

                <IndianRupee
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  name="current_price"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={formData.current_price}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-3.5 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10"
                />

              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Stock Quantity
              </label>

              <div className="relative">

                <Boxes
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  name="stock"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/70 py-3.5 pl-11 pr-4 text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10"
                />

              </div>
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
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-emerald-400 px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-400/10 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Product"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default AddProductModal;