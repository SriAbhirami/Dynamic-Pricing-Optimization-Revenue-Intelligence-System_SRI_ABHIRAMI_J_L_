import { useEffect, useState } from "react";
import API from "../../api/axios";

function EditProductModal({
  isOpen,
  onClose,
  product,
  onProductUpdated,
}) {

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    current_price: "",
    stock: "",
  });

  useEffect(() => {

    if (product) {

      setFormData({
        name: product.name,
        category: product.category,
        current_price: product.current_price,
        stock: product.stock,
      });

    }

  }, [product]);



  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };



  const handleUpdate = async () => {

    try {

      await API.put(`/products/${product.id}`, {
        ...formData,
        current_price: Number(formData.current_price),
        stock: Number(formData.stock),
      });

      onProductUpdated();
      onClose();

    } catch (error) {

      console.error(error);

      alert("Failed to update product.");

    }

  };



  if (!isOpen) return null;



  return (

    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">

      <div className="bg-white rounded-3xl shadow-2xl w-[460px] p-8">

        <h2 className="text-3xl font-bold text-blue-700 mb-6">
          Edit Product
        </h2>

        <div className="space-y-4">

          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />

          <input
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />

          <input
            name="current_price"
            type="number"
            value={formData.current_price}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />

          <input
            name="stock"
            type="number"
            value={formData.stock}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl"
          />

        </div>

        <div className="flex justify-end gap-4 mt-8">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={handleUpdate}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            Save Changes
          </button>

        </div>

      </div>

    </div>

  );

}

export default EditProductModal;