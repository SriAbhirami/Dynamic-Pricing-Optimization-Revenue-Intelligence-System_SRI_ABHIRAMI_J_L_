import { useEffect, useState } from "react";
import API from "../../api/axios";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Package } from "lucide-react";

import ProductToolbar from "../products/ProductToolbar";
import AddProductModal from "../products/AddProductModal";
import EditProductModal from "../products/EditProductModal";
import DeleteProductModal from "../products/DeleteProductModal";

function RecentProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // ROLE
  // ============================================================

  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";

  // ============================================================
  // TOOLBAR
  // ============================================================

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("asc");

  // ============================================================
  // ADD MODAL
  // ============================================================

  const [showAddModal, setShowAddModal] = useState(false);

  // ============================================================
  // EDIT MODAL
  // ============================================================

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ============================================================
  // DELETE MODAL
  // ============================================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

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

  // ============================================================
  // ADD PRODUCT
  // ADMIN ONLY
  // ============================================================

  const handleProductAdded = () => {
    if (!isAdmin) return;

    loadProducts();
    setShowAddModal(false);
  };

  // ============================================================
  // EDIT PRODUCT
  // ADMIN ONLY
  // ============================================================

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

  // ============================================================
  // DELETE PRODUCT
  // ADMIN ONLY
  // ============================================================

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

  // ============================================================
  // STOCK STATUS
  // ============================================================

  const getStatus = (stock) => {
    if (stock === 0) {
      return {
        text: "OUT OF STOCK",
        className:
          "border-red-400/40 bg-red-400/10 text-red-300 shadow-[0_0_12px_rgba(248,113,113,0.08)]",
        dot:
          "bg-red-400 shadow-[0_0_9px_rgba(248,113,113,0.95)]",
      };
    }

    if (stock <= 10) {
      return {
        text: "LOW STOCK",
        className:
          "border-yellow-400/40 bg-yellow-400/10 text-yellow-300 shadow-[0_0_12px_rgba(253,224,71,0.08)]",
        dot:
          "bg-yellow-300 shadow-[0_0_9px_rgba(253,224,71,0.95)]",
      };
    }

    return {
      text: "IN STOCK",
      className:
        "border-lime-400/40 bg-lime-400/10 text-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.08)]",
      dot:
        "bg-lime-300 shadow-[0_0_9px_rgba(163,230,53,0.95)]",
    };
  };

  return (
    <>
      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-lime-300/30
          bg-[#111C2E]
          shadow-[0_0_22px_rgba(163,230,53,0.08),0_0_55px_rgba(163,230,53,0.035)]
        "
      >

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div
          className="
            border-b
            border-lime-300/20
            bg-[#111C2E]
            px-5
            py-5
            shadow-[0_4px_20px_rgba(163,230,53,0.035)]
            lg:px-6
          "
        >
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-lime-300/40
                  bg-lime-300/10
                  shadow-[0_0_18px_rgba(163,230,53,0.13)]
                "
              >
                <Package className="h-5 w-5 text-lime-300" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">
                  Products
                </h2>

                <p className="mt-0.5 text-xs font-semibold text-white/65">
                  Manage your product catalogue
                </p>
              </div>

            </div>

            {/* Product Count */}

            <div
              className="
                flex
                items-center
                gap-2.5
                self-start
                rounded-xl
                border
                border-lime-300/25
                bg-[#0B1220]
                px-4
                py-2.5
                shadow-[0_0_16px_rgba(163,230,53,0.06)]
                lg:self-auto
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-lime-300
                  shadow-[0_0_10px_rgba(163,230,53,1)]
                "
              />

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                  Products
                </p>

                <p className="text-sm font-bold text-white">
                  {products.length}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* =====================================================
            TOOLBAR
        ====================================================== */}

        <div
          className="
            border-b
            border-lime-300/15
            bg-[#0F192A]
            px-5
            py-4
            lg:px-6
          "
        >
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

        {/* =====================================================
            TABLE
        ====================================================== */}

        <div className="w-full overflow-hidden">

          <table className="w-full table-fixed">

            {/* =================================================
                COLUMN WIDTHS
            ================================================== */}

            <colgroup>
              <col className={isAdmin ? "w-[25%]" : "w-[28%]"} />
              <col className={isAdmin ? "w-[16%]" : "w-[18%]"} />
              <col className={isAdmin ? "w-[16%]" : "w-[18%]"} />
              <col className={isAdmin ? "w-[16%]" : "w-[17%]"} />
              <col className={isAdmin ? "w-[17%]" : "w-[19%]"} />

              {isAdmin && (
                <col className="w-[10%]" />
              )}
            </colgroup>

            {/* =================================================
                TABLE HEADER
            ================================================== */}

            <thead>
              <tr
                className="
                  border-b
                  border-lime-300/20
                  bg-[#0D1727]
                  shadow-[0_3px_18px_rgba(163,230,53,0.035)]
                "
              >

                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-white/85 lg:px-5">
                  Product
                </th>

                <th className="px-3 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-white/85">
                  Category
                </th>

                <th className="px-3 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-white/85">
                  Current Price
                </th>

                <th className="px-3 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-white/85">
                  Stock Level
                </th>

                <th className="px-3 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-white/85">
                  Status
                </th>

                {isAdmin && (
                  <th className="px-2 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-white/85">
                    Actions
                  </th>
                )}

              </tr>
            </thead>

            <tbody>

              {/* =================================================
                  LOADING
              ================================================== */}

              {loading && (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="py-16"
                  >
                    <div className="flex flex-col items-center justify-center">

                      <div
                        className="
                          h-8
                          w-8
                          animate-spin
                          rounded-full
                          border-2
                          border-lime-300/15
                          border-t-lime-300
                          shadow-[0_0_16px_rgba(163,230,53,0.35)]
                        "
                      />

                      <p className="mt-4 text-sm font-semibold text-white">
                        Loading products...
                      </p>

                    </div>
                  </td>
                </tr>
              )}

              {/* =================================================
                  EMPTY
              ================================================== */}

              {!loading && products.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="py-16"
                  >
                    <div className="flex flex-col items-center justify-center">

                      <div
                        className="
                          flex
                          h-14
                          w-14
                          items-center
                          justify-center
                          rounded-xl
                          border
                          border-lime-300/25
                          bg-lime-300/10
                          shadow-[0_0_22px_rgba(163,230,53,0.1)]
                        "
                      >
                        <Package className="h-7 w-7 text-lime-300" />
                      </div>

                      <p className="mt-4 text-lg font-bold text-white">
                        No Products Found
                      </p>

                      <p className="mt-1 text-xs font-semibold text-white/60">
                        Try another search or add a new product.
                      </p>

                    </div>
                  </td>
                </tr>
              )}

              {/* =================================================
                  PRODUCTS
              ================================================== */}

              {!loading &&
                products.map((product) => {
                  const status = getStatus(
                    Number(product.stock)
                  );

                  return (
                    <tr
                      key={product.id}
                      className="
                        group
                        border-b
                        border-lime-300/10
                        transition-all
                        duration-200
                        hover:bg-lime-300/[0.025]
                        hover:shadow-[inset_0_0_20px_rgba(163,230,53,0.025)]
                      "
                    >

                      {/* =================================================
                          PRODUCT
                      ================================================== */}

                      <td className="px-4 py-4 lg:px-5">

                        <div className="flex min-w-0 items-center gap-3">

                          <div
                            className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-lime-300/35
                              bg-lime-300/10
                              text-sm
                              font-bold
                              text-lime-300
                              shadow-[0_0_14px_rgba(163,230,53,0.08)]
                              transition
                              group-hover:border-lime-300/55
                              group-hover:shadow-[0_0_18px_rgba(163,230,53,0.14)]
                            "
                          >
                            {product.name
                              ?.charAt(0)
                              ?.toUpperCase() || "P"}
                          </div>

                          <div className="min-w-0">

                            <p
                              className="
                                truncate
                                text-sm
                                font-bold
                                text-white
                                transition
                                group-hover:text-lime-300
                              "
                              title={product.name}
                            >
                              {product.name}
                            </p>

                            <p className="mt-0.5 text-[10px] font-semibold text-white/45">
                              ID #{product.id}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* =================================================
                          CATEGORY
                      ================================================== */}

                      <td className="px-3 py-4">

                        <span
                          className="
                            inline-flex
                            max-w-full
                            truncate
                            rounded-md
                            border
                            border-[#3A4A61]
                            bg-[#18253A]
                            px-2.5
                            py-1.5
                            text-xs
                            font-semibold
                            text-white/85
                          "
                          title={product.category}
                        >
                          {product.category}
                        </span>

                      </td>

                      {/* =================================================
                          PRICE
                      ================================================== */}

                      <td className="px-3 py-4">

                        <p className="text-sm font-bold text-white">
                          ₹
                          {Number(
                            product.current_price
                          ).toLocaleString("en-IN")}
                        </p>

                      </td>

                      {/* =================================================
                          STOCK
                      ================================================== */}

                      <td className="px-3 py-4">

                        <div className="w-full max-w-[120px]">

                          <div className="flex items-center justify-between gap-2">

                            <span className="text-sm font-bold text-white">
                              {product.stock}
                            </span>

                            <span className="text-[10px] font-semibold text-white/45">
                              units
                            </span>

                          </div>

                          <div
                            className="
                              mt-2
                              h-1.5
                              overflow-hidden
                              rounded-full
                              bg-white/[0.08]
                            "
                          >
                            <div
                              className={`
                                h-full
                                rounded-full
                                ${
                                  Number(product.stock) === 0
                                    ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.75)]"
                                    : Number(product.stock) <= 10
                                    ? "bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.75)]"
                                    : "bg-lime-300 shadow-[0_0_9px_rgba(163,230,53,0.85)]"
                                }
                              `}
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    Number(product.stock) || 0,
                                    0
                                  ),
                                  100
                                )}%`,
                              }}
                            />
                          </div>

                        </div>

                      </td>

                      {/* =================================================
                          STATUS
                      ================================================== */}

                      <td className="px-3 py-4">

                        <span
                          className={`
                            inline-flex
                            max-w-full
                            items-center
                            gap-1.5
                            rounded-full
                            border
                            px-2.5
                            py-1.5
                            text-[9px]
                            font-bold
                            tracking-wide
                            ${status.className}
                          `}
                        >

                          <span
                            className={`
                              h-1.5
                              w-1.5
                              shrink-0
                              rounded-full
                              ${status.dot}
                            `}
                          />

                          <span className="truncate">
                            {status.text}
                          </span>

                        </span>

                      </td>

                      {/* =================================================
                          ACTIONS
                      ================================================== */}

                      {isAdmin && (
                        <td className="px-2 py-4">

                          <div className="flex justify-center gap-1.5">

                            <button
                              onClick={() =>
                                handleEdit(product)
                              }
                              title="Edit Product"
                              className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-lime-300/25
                                bg-lime-300/10
                                text-lime-300
                                shadow-[0_0_10px_rgba(163,230,53,0.04)]
                                transition-all
                                duration-200
                                hover:border-lime-300/60
                                hover:bg-lime-300/20
                                hover:shadow-[0_0_16px_rgba(163,230,53,0.2)]
                              "
                            >
                              <FaEdit size={12} />
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteClick(product.id)
                              }
                              title="Delete Product"
                              className="
                                flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-red-400/25
                                bg-red-400/10
                                text-red-300
                                shadow-[0_0_10px_rgba(248,113,113,0.04)]
                                transition-all
                                duration-200
                                hover:border-red-400/60
                                hover:bg-red-400/20
                                hover:shadow-[0_0_16px_rgba(248,113,113,0.18)]
                              "
                            >
                              <FaTrash size={12} />
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

        {/* =====================================================
            BOTTOM STATUS
        ====================================================== */}

        <div
          className="
            flex
            flex-col
            gap-2
            border-t
            border-lime-300/15
            bg-[#0D1727]
            px-5
            py-3.5
            shadow-[0_-4px_18px_rgba(163,230,53,0.025)]
            sm:flex-row
            sm:items-center
            sm:justify-between
            lg:px-6
          "
        >

          <div className="flex items-center gap-2">

            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-lime-300
                shadow-[0_0_8px_rgba(163,230,53,1)]
              "
            />

            <span className="text-xs font-semibold text-white/85">
              {isAdmin
                ? "Admin access"
                : "Read-only analyst access"}
            </span>

          </div>

          <p className="text-xs font-semibold text-white/50">
            {products.length} product records
          </p>

        </div>

      </div>

      {/* =======================================================
          ADD PRODUCT MODAL
      ======================================================== */}

      {isAdmin && (
        <AddProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onProductAdded={handleProductAdded}
        />
      )}

      {/* =======================================================
          EDIT PRODUCT MODAL
      ======================================================== */}

      {isAdmin && (
        <EditProductModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          product={selectedProduct}
          onProductUpdated={handleProductUpdated}
        />
      )}

      {/* =======================================================
          DELETE PRODUCT MODAL
      ======================================================== */}

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