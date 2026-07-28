import { useEffect, useState } from "react";
import API from "../../api/axios";
import { FaEdit, FaTrash } from "react-icons/fa";

import ProductToolbar from "../products/ProductToolbar";
import AddProductModal from "../products/AddProductModal";
import EditProductModal from "../products/EditProductModal";
import DeleteProductModal from "../products/DeleteProductModal";


function RecentProducts() {

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);


  // Toolbar
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("asc");


  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);


  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);


  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);




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



      // FIX: Backend sends {items: []}

      if (
        response.data.items &&
        Array.isArray(response.data.items)
      ) {

        setProducts(response.data.items);

      }

      else if (Array.isArray(response.data)) {

        setProducts(response.data);

      }

      else {

        setProducts([]);

      }



    }

    catch(error) {

      console.error(
        "Error loading products:",
        error.response?.data || error.message
      );

      setProducts([]);

    }

    finally {

      setLoading(false);

    }

  };







  // Add Product

  const handleProductAdded = () => {

    loadProducts();
    setShowAddModal(false);

  };






  // Edit Product

  const handleEdit = (product) => {

    setSelectedProduct(product);
    setShowEditModal(true);

  };




  const handleProductUpdated = () => {

    loadProducts();
    setShowEditModal(false);

  };







  // Delete Product

  const handleDeleteClick = (id) => {

    setProductToDelete(id);
    setShowDeleteModal(true);

  };




  const deleteProduct = async () => {

    try {

      await API.delete(`/products/${productToDelete}`);


      loadProducts();


      setShowDeleteModal(false);
      setProductToDelete(null);


    }

    catch(error) {

      console.error(
        "Delete error:",
        error.response?.data || error.message
      );

    }

  };







  // Stock Status

  const getStatus = (stock) => {


    if(stock === 0) {

      return {

        text: "Out of Stock",

        className: "bg-red-100 text-red-700"

      };

    }



    if(stock <= 10) {

      return {

        text: "Low Stock",

        className: "bg-yellow-100 text-yellow-700"

      };

    }



    return {

      text: "In Stock",

      className: "bg-green-100 text-green-700"

    };


  };








  return (

    <>


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






        {/* Toolbar */}

        <div className="p-6 border-b border-slate-200">


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

          />


        </div>







        {/* Table */}

        <div className="overflow-x-auto">


          <table className="w-full">


            <thead className="bg-slate-100">


              <tr className="text-slate-700">


                <th className="text-left px-6 py-4">
                  Product
                </th>


                <th className="text-left px-6 py-4">
                  Category
                </th>


                <th className="text-left px-6 py-4">
                  Price
                </th>


                <th className="text-left px-6 py-4">
                  Stock
                </th>


                <th className="text-left px-6 py-4">
                  Status
                </th>


                <th className="text-center px-6 py-4">
                  Actions
                </th>


              </tr>


            </thead>





            <tbody>


            {

              loading ? (

                <tr>

                  <td colSpan="6" className="text-center py-10">

                    Loading products...

                  </td>

                </tr>


              )


              :

              products.length === 0 ? (


                <tr>

                  <td colSpan="6" className="text-center py-16">


                    <div className="flex flex-col items-center gap-2">


                      <span className="text-5xl">

                        📦

                      </span>


                      <p className="font-semibold text-lg">

                        No Products Found

                      </p>


                    </div>


                  </td>


                </tr>


              )


              :


              products.map((product)=>(


                <tr

                  key={product.id}

                  className="border-t border-slate-100 hover:bg-blue-50 transition"


                >


                  <td className="px-6 py-4 font-semibold">

                    {product.name}

                  </td>



                  <td className="px-6 py-4">

                    {product.category}

                  </td>



                  <td className="px-6 py-4">

                    ₹{Number(product.current_price).toLocaleString("en-IN")}

                  </td>



                  <td className="px-6 py-4">

                    {product.stock}

                  </td>



                  <td className="px-6 py-4">


                    {

                      (() => {

                        const status = getStatus(product.stock);


                        return (

                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>

                            {status.text}

                          </span>

                        );


                      })()

                    }


                  </td>




                  <td className="px-6 py-4">


                    <div className="flex justify-center gap-3">


                      <button

                        onClick={() => handleEdit(product)}

                        className="p-2 rounded-xl bg-blue-100 text-blue-700"

                      >

                        <FaEdit />

                      </button>




                      <button

                        onClick={() => handleDeleteClick(product.id)}

                        className="p-2 rounded-xl bg-red-100 text-red-700"

                      >

                        <FaTrash />

                      </button>


                    </div>


                  </td>


                </tr>


              ))


            }


            </tbody>


          </table>


        </div>


      </div>








      <AddProductModal

        isOpen={showAddModal}

        onClose={() => setShowAddModal(false)}

        onProductAdded={handleProductAdded}

      />






      <EditProductModal

        isOpen={showEditModal}

        onClose={() => setShowEditModal(false)}

        product={selectedProduct}

        onProductUpdated={handleProductUpdated}

      />







      <DeleteProductModal

        isOpen={showDeleteModal}

        onClose={() => {

          setShowDeleteModal(false);

          setProductToDelete(null);

        }}

        onConfirm={deleteProduct}

      />



    </>

  );

}



export default RecentProducts;