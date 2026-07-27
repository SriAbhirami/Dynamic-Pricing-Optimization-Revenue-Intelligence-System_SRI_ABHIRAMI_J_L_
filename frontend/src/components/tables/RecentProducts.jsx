import { useEffect, useState } from "react";
import API from "../../api/axios";
import { FaEdit, FaTrash } from "react-icons/fa";

function RecentProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Correct endpoint
      const response = await API.get("/products/");
      setProducts(response.data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      // Correct endpoint
      await API.delete(`/products/${id}`);

      // Reload table
      loadProducts();

    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleEdit = (product) => {
    console.log("Edit product:", product);
    // We'll implement Edit Modal next.
  };

  const getStatus = (stock) => {
    if (stock === 0) {
      return {
        text: "Out of Stock",
        className: "bg-red-100 text-red-700",
      };
    }

    if (stock <= 10) {
      return {
        text: "Low Stock",
        className: "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      text: "In Stock",
      className: "bg-green-100 text-green-700",
    };
  };

  return (
    <div className="mt-10 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">

        <h2 className="text-2xl font-bold text-slate-800">
          Recent Products
        </h2>

        <p className="text-slate-500 mt-1">
          Latest products available in your inventory.
        </p>

      </div>

      {/* Table */}
      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr className="text-slate-700">

              <th className="text-left px-6 py-4 font-semibold">
                Product
              </th>

              <th className="text-left px-6 py-4 font-semibold">
                Category
              </th>

              <th className="text-left px-6 py-4 font-semibold">
                Price
              </th>

              <th className="text-left px-6 py-4 font-semibold">
                Stock
              </th>

              <th className="text-left px-6 py-4 font-semibold">
                Status
              </th>

              <th className="text-center px-6 py-4 font-semibold">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {products.length === 0 ? (

              <tr>

                <td
                  colSpan="6"
                  className="text-center py-10 text-slate-500"
                >
                  No products found.
                </td>

              </tr>

            ) : (

              products.map((product) => {

                const status = getStatus(product.stock);

                return (

                  <tr
                    key={product.id}
                    className="border-t border-slate-100 hover:bg-blue-50 transition-all duration-300"
                  >

                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {product.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {product.category}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      ₹{Number(product.current_price).toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4">
                      {product.stock}
                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}
                      >
                        {status.text}
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      <div className="flex justify-center gap-3">

                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2.5 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-110 transition-all duration-300"
                        >
                          <FaEdit />
                        </button>

                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2.5 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 hover:scale-110 transition-all duration-300"
                        >
                          <FaTrash />
                        </button>

                      </div>

                    </td>

                  </tr>

                );
              })

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default RecentProducts;