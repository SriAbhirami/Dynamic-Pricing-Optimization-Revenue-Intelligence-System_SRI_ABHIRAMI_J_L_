import { useState } from "react";
import API from "../../api/axios";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">

      <div className="bg-white rounded-3xl w-[460px] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 flex justify-between items-center">

          <h2 className="text-2xl font-bold text-white">
            Add New Product
          </h2>

          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X size={22} />
          </button>

        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          <input
            name="name"
            placeholder="Product Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            name="current_price"
            type="number"
            min="0"
            placeholder="Price (₹)"
            value={formData.current_price}
            onChange={handleChange}
            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            name="stock"
            type="number"
            min="0"
            placeholder="Stock Quantity"
            value={formData.stock}
            onChange={handleChange}
            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
          />

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t bg-slate-50">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Product"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default AddProductModal;