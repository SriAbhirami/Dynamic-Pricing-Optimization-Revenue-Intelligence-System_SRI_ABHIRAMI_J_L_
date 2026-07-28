import {
  Search,
  Plus,
  ArrowUpDown,
} from "lucide-react";


function ProductToolbar({
  search,
  setSearch,
  category,
  setCategory,
  sortBy,
  setSortBy,
  order,
  setOrder,
  onAddProduct,
}) {


  return (

    <div className="
      flex
      flex-col
      xl:flex-row
      gap-4
      items-stretch
      xl:items-center
      justify-between
    ">


      {/* Filters Section */}

      <div className="
        flex
        flex-col
        md:flex-row
        flex-wrap
        gap-4
        w-full
      ">


        {/* Search */}

        <div className="
          relative
          flex-1
          min-w-[240px]
        ">


          <Search

            size={18}

            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-slate-400
            "

          />


          <input

            type="text"

            placeholder="Search products..."

            value={search}

            onChange={(e)=>setSearch(e.target.value)}

            className="
              w-full
              pl-10
              pr-4
              py-3
              rounded-xl
              border
              border-slate-300
              bg-white
              text-slate-700
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              transition
            "

          />


        </div>





        {/* Category Filter */}

        <select

          value={category}

          onChange={(e)=>setCategory(e.target.value)}

          className="
            px-4
            py-3
            rounded-xl
            border
            border-slate-300
            bg-white
            text-slate-700
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            cursor-pointer
          "

        >

          <option value="">
            All Categories
          </option>

          <option value="Electronics">
            Electronics
          </option>

          <option value="Fashion">
            Fashion
          </option>

          <option value="Home">
            Home
          </option>

          <option value="Sports">
            Sports
          </option>

          <option value="Books">
            Books
          </option>


        </select>






        {/* Sort */}

        <select

          value={sortBy}

          onChange={(e)=>setSortBy(e.target.value)}

          className="
            px-4
            py-3
            rounded-xl
            border
            border-slate-300
            bg-white
            text-slate-700
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            cursor-pointer
          "

        >

          <option value="">
            Sort By
          </option>


          <option value="name">
            Product Name
          </option>


          <option value="current_price">
            Price
          </option>


          <option value="stock">
            Stock
          </option>


          <option value="created_at">
            Newest
          </option>


        </select>







        {/* Sort Order */}

        <button

          onClick={()=>setOrder(order==="asc" ? "desc":"asc")}

          className="
            flex
            items-center
            justify-center
            gap-2
            px-4
            py-3
            rounded-xl
            border
            border-slate-300
            bg-white
            text-slate-700
            hover:bg-blue-50
            hover:border-blue-300
            transition
          "

        >

          <ArrowUpDown size={18}/>


          {
            order==="asc"
            ?
            "Ascending"
            :
            "Descending"
          }


        </button>



      </div>







      {/* Add Product Button */}

      <button

        onClick={onAddProduct}

        className="
          flex
          items-center
          justify-center
          gap-2
          px-6
          py-3
          rounded-xl
          bg-gradient-to-r
          from-blue-600
          to-cyan-500
          text-white
          font-semibold
          shadow-lg
          hover:scale-105
          hover:shadow-xl
          transition-all
          duration-300
          whitespace-nowrap
        "

      >

        <Plus size={20}/>

        Add Product


      </button>



    </div>


  );

}


export default ProductToolbar;