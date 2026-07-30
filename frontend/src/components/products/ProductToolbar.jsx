import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
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
  isAdmin,
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

      {/* Search */}
      <div className="relative flex-1">

        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="
            w-full
            rounded-xl
            border border-white/10
            bg-[#0b150e]
            py-3
            pl-10
            pr-4
            text-sm
            text-gray-300
            placeholder:text-gray-600
            outline-none
            transition
            focus:border-lime-300/30
            focus:ring-1
            focus:ring-lime-300/10
          "
        />

      </div>


      {/* Category */}
      <div className="relative w-full lg:w-48">

        <Filter
          size={15}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="
            w-full
            appearance-none
            rounded-xl
            border border-white/10
            bg-[#0b150e]
            py-3
            pl-10
            pr-4
            text-sm
            text-gray-400
            outline-none
            transition
            focus:border-lime-300/30
            focus:ring-1
            focus:ring-lime-300/10
          "
        >

          <option value="">
            All Categories
          </option>

          <option value="Electronics">
            Electronics
          </option>

          <option value="Apparel">
            Apparel
          </option>

          <option value="Shoes">
            Shoes
          </option>

          <option value="Accessories">
            Accessories
          </option>

          <option value="Beauty">
            Beauty
          </option>

          <option value="Groceries">
            Groceries
          </option>

          <option value="Home">
            Home
          </option>

        </select>

      </div>


      {/* Sort */}
      <div className="relative w-full lg:w-44">

        <ArrowUpDown
          size={15}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-600"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="
            w-full
            appearance-none
            rounded-xl
            border border-white/10
            bg-[#0b150e]
            py-3
            pl-10
            pr-4
            text-sm
            text-gray-400
            outline-none
            transition
            focus:border-lime-300/30
            focus:ring-1
            focus:ring-lime-300/10
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

        </select>

      </div>


      {/* Order */}
      <div className="flex items-center rounded-xl border border-white/10 bg-[#0b150e] p-1">

        <button
          type="button"
          onClick={() => setOrder("asc")}
          className={`
            rounded-lg
            px-3
            py-2
            text-[10px]
            font-semibold
            tracking-wider
            transition
            ${
              order === "asc"
                ? "bg-lime-300 text-black"
                : "text-gray-600 hover:text-gray-300"
            }
          `}
        >
          ASC
        </button>


        <button
          type="button"
          onClick={() => setOrder("desc")}
          className={`
            rounded-lg
            px-3
            py-2
            text-[10px]
            font-semibold
            tracking-wider
            transition
            ${
              order === "desc"
                ? "bg-lime-300 text-black"
                : "text-gray-600 hover:text-gray-300"
            }
          `}
        >
          DESC
        </button>

      </div>


      {/* Add Product - ADMIN ONLY */}
      {isAdmin && (
        <button
          type="button"
          onClick={onAddProduct}
          className="
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-lime-300
            px-5
            py-3
            text-sm
            font-semibold
            text-black
            transition
            hover:bg-lime-200
            active:scale-[0.98]
            lg:w-auto
          "
        >

          <Plus size={16} />

          Add Product

        </button>
      )}

    </div>
  );
}

export default ProductToolbar;