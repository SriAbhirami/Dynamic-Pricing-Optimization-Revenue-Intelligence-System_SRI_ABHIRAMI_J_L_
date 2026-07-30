import { useEffect, useState } from "react";
import API from "../../api/axios";
import { FaEdit, FaTrash } from "react-icons/fa";
import {
  Package,
} from "lucide-react";

import ProductToolbar from "../products/ProductToolbar";
import AddProductModal from "../products/AddProductModal";
import EditProductModal from "../products/EditProductModal";
import DeleteProductModal from "../products/DeleteProductModal";


function RecentProducts() {

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // ROLE
  // =========================

  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";


  // =========================
  // Toolbar
  // =========================

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("asc");


  // =========================
  // Add Modal
  // =========================

  const [showAddModal, setShowAddModal] = useState(false);


  // =========================
  // Edit Modal
  // =========================

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);


  // =========================
  // Delete Modal
  // =========================

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);


  // =========================
  // Load Products
  // =========================

  useEffect(() => {
    loadProducts();
  }, [search, category, sortBy, order]);


  const loadProducts = async () => {

    try {

      setLoading(true);

      const response = await API.get("/products/", {
        params: {
          name: search || undefined,
          category: category || undefined,
          sort_by: sortBy || undefined,
          order,
        },
      });


      console.log("PRODUCT RESPONSE:", response.data);


      if (
        response.data.items &&
        Array.isArray(response.data.items)
      ) {

        setProducts(response.data.items);

      } else if (Array.isArray(response.data)) {

        setProducts(response.data);

      } else {

        setProducts([]);

      }

    } catch (error) {

      console.error(
        "Error loading products:",
        error.response?.data || error.message
      );

      setProducts([]);

    } finally {

      setLoading(false);

    }

  };


  // =========================
  // Add Product
  // ADMIN ONLY
  // =========================

  const handleProductAdded = () => {

    if (!isAdmin) return;

    loadProducts();
    setShowAddModal(false);

  };


  // =========================
  // Edit Product
  // ADMIN ONLY
  // =========================

  const handleEdit = (product) => {

    if (!isAdmin) return;

    setSelectedProduct(product);
    setShowEditModal(true);

  };


  const handleProductUpdated = () => {

    if (!isAdmin) return;

    loadProducts();
    setShowEditModal(false);

  };


  // =========================
  // Delete Product
  // ADMIN ONLY
  // =========================

  const handleDeleteClick = (id) => {

    if (!isAdmin) return;

    setProductToDelete(id);
    setShowDeleteModal(true);

  };


  const deleteProduct = async () => {

    if (!isAdmin) return;

    try {

      await API.delete(`/products/${productToDelete}`);

      loadProducts();

      setShowDeleteModal(false);
      setProductToDelete(null);

    } catch (error) {

      console.error(
        "Delete error:",
        error.response?.data || error.message
      );

    }

  };


  // =========================
  // Stock Status
  // =========================

  const getStatus = (stock) => {

    if (stock === 0) {

      return {
        text: "OUT OF STOCK",
        className:
          "border-red-400/20 bg-red-400/10 text-red-300",
        dot:
          "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]",
      };

    }


    if (stock <= 10) {

      return {
        text: "LOW STOCK",
        className:
          "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
        dot:
          "bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.8)]",
      };

    }


    return {
      text: "IN STOCK",
      className:
        "border-lime-400/20 bg-lime-400/10 text-lime-300",
      dot:
        "bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.8)]",
    };

  };


  return (
    <>

      <div className="overflow-hidden rounded-3xl border border-lime-400/10 bg-[#080d0a] shadow-[0_0_40px_rgba(163,230,53,0.03)]">


        {/* =========================
            Header
        ========================= */}

        <div className="relative overflow-hidden border-b border-lime-400/10 px-6 py-6 lg:px-8">

          <div className="absolute -right-20 -top-24 h-48 w-48 rounded-full bg-lime-400/5 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-lime-400/20 bg-lime-400/10">

                  <Package className="h-5 w-5 text-lime-300" />

                </div>


                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
                    Inventory Layer
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-white">
                    Product Intelligence
                  </h2>

                </div>

              </div>


              <p className="mt-3 max-w-xl text-sm text-gray-500">

                Monitor products, pricing signals and inventory status
                connected to the PricePilot intelligence system.

              </p>

            </div>


            {/* Product Count */}

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-5 py-3">

              <div className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.9)]" />

              <div>

                <p className="text-[10px] uppercase tracking-widest text-gray-600">
                  Monitored
                </p>

                <p className="text-sm font-semibold text-gray-300">
                  {products.length} Products
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* =========================
            Toolbar
        ========================= */}

        <div className="border-b border-white/5 bg-[#0a100d] px-6 py-5 lg:px-8">

          <ProductToolbar
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
            order={order}
            setOrder={setOrder}
            onAddProduct={() => setShowAddModal(true)}
            isAdmin={isAdmin}
          />

        </div>


        {/* =========================
            Table
        ========================= */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px]">

            <thead>

              <tr className="border-b border-lime-400/10 bg-[#0b110e]">

                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                  Product
                </th>

                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                  Category
                </th>

                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                  Current Price
                </th>

                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                  Stock Level
                </th>

                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                  System Status
                </th>


                {/* Controls - ADMIN ONLY */}

                {isAdmin && (
                  <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Controls
                  </th>
                )}

              </tr>

            </thead>


            <tbody>


              {/* =========================
                  Loading
              ========================= */}

              {loading && (

                <tr>

                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="py-16"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-400/20 border-t-lime-300" />

                      <p className="mt-4 text-sm text-gray-500">
                        Synchronizing inventory...
                      </p>

                    </div>

                  </td>

                </tr>

              )}


              {/* =========================
                  Empty
              ========================= */}

              {!loading && products.length === 0 && (

                <tr>

                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="py-20"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-400/10 bg-lime-400/5">

                        <Package className="h-7 w-7 text-lime-300/50" />

                      </div>

                      <p className="mt-5 text-lg font-semibold text-gray-300">
                        No Products Detected
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        Try changing your search or add a new product.
                      </p>

                    </div>

                  </td>

                </tr>

              )}


              {/* =========================
                  Products
              ========================= */}

              {!loading &&
                products.map((product) => {

                  const status = getStatus(product.stock);

                  return (

                    <tr
                      key={product.id}
                      className="group border-b border-white/5 transition duration-200 hover:bg-lime-400/[0.025]"
                    >


                      {/* Product */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-4">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime-400/10 bg-lime-400/5 text-sm font-bold text-lime-300">

                            {product.name
                              ?.charAt(0)
                              ?.toUpperCase() || "P"}

                          </div>


                          <div>

                            <p className="font-semibold text-gray-200 transition group-hover:text-lime-300">
                              {product.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-600">
                              ID #{product.id}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* Category */}

                      <td className="px-6 py-5">

                        <span className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-gray-400">
                          {product.category}
                        </span>

                      </td>


                      {/* Price */}

                      <td className="px-6 py-5">

                        <div>

                          <p className="font-semibold text-white">

                            ₹
                            {Number(
                              product.current_price
                            ).toLocaleString("en-IN")}

                          </p>

                          <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-600">
                            Current price
                          </p>

                        </div>

                      </td>


                      {/* Stock */}

                      <td className="px-6 py-5">

                        <div className="w-32">

                          <div className="flex items-center justify-between">

                            <span className="text-sm font-semibold text-gray-300">
                              {product.stock}
                            </span>

                            <span className="text-[10px] uppercase text-gray-600">
                              units
                            </span>

                          </div>


                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">

                            <div
                              className={`h-full rounded-full ${
                                product.stock === 0
                                  ? "bg-red-400"
                                  : product.stock <= 10
                                  ? "bg-yellow-300"
                                  : "bg-lime-300"
                              }`}
                              style={{
                                width: `${Math.min(
                                  Number(product.stock),
                                  100
                                )}%`,
                              }}
                            />

                          </div>

                        </div>

                      </td>


                      {/* Status */}

                      <td className="px-6 py-5">

                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-wider ${status.className}`}
                        >

                          <span
                            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                          />

                          {status.text}

                        </span>

                      </td>


                      {/* Controls - ADMIN ONLY */}

                      {isAdmin && (

                        <td className="px-6 py-5">

                          <div className="flex justify-center gap-2">

                            {/* Edit */}

                            <button
                              onClick={() => handleEdit(product)}
                              title="Edit Product"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-lime-400/10 bg-lime-400/5 text-gray-500 transition hover:border-lime-400/30 hover:bg-lime-400/10 hover:text-lime-300"
                            >

                              <FaEdit size={13} />

                            </button>


                            {/* Delete */}

                            <button
                              onClick={() =>
                                handleDeleteClick(product.id)
                              }
                              title="Delete Product"
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/10 bg-red-400/5 text-gray-500 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
                            >

                              <FaTrash size={13} />

                            </button>

                          </div>

                        </td>

                      )}

                    </tr>

                  );

                })}

            </tbody>

          </table>

        </div>


        {/* =========================
            Bottom Status Bar
        ========================= */}

        <div className="flex flex-col gap-3 border-t border-white/5 bg-[#080d0a] px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">

          <div className="flex items-center gap-2">

            <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.8)]" />

            <span className="text-xs text-gray-600">

              {isAdmin
                ? "Admin database access"
                : "Read-only analyst access"}

            </span>

          </div>


          <p className="text-xs text-gray-600">

            {products.length} product records synchronized

          </p>

        </div>

      </div>


      {/* =========================
          Add Product Modal
          ADMIN ONLY
      ========================= */}

      {isAdmin && (

        <AddProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onProductAdded={handleProductAdded}
        />

      )}


      {/* =========================
          Edit Product Modal
          ADMIN ONLY
      ========================= */}

      {isAdmin && (

        <EditProductModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          product={selectedProduct}
          onProductUpdated={handleProductUpdated}
        />

      )}


      {/* =========================
          Delete Product Modal
          ADMIN ONLY
      ========================= */}

      {isAdmin && (

        <DeleteProductModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setProductToDelete(null);
          }}
          onConfirm={deleteProduct}
        />

      )}

    </>
  );
}


export default RecentProducts;