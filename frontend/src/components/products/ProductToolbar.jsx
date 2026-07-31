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

      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div className="relative flex-1">

        <Search
          size={16}
          className="
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-lime-300/70
            drop-shadow-[0_0_5px_rgba(163,230,53,0.5)]
          "
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="
            w-full
            rounded-xl
            border
            border-lime-300/20
            bg-[#0B1220]
            py-3
            pl-10
            pr-4
            text-sm
            text-white
            placeholder:text-white/30
            outline-none
            shadow-[0_0_7px_rgba(163,230,53,0.05)]
            transition-all
            duration-200
            focus:border-lime-300/60
            focus:shadow-[0_0_8px_rgba(163,230,53,0.35),0_0_18px_rgba(163,230,53,0.10)]
          "
        />

      </div>

      {/* =====================================================
          CATEGORY
      ====================================================== */}

      <div className="relative w-full lg:w-48">

        <Filter
          size={15}
          className="
            pointer-events-none
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-lime-300/65
            drop-shadow-[0_0_5px_rgba(163,230,53,0.4)]
          "
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="
            w-full
            appearance-none
            rounded-xl
            border
            border-lime-300/20
            bg-[#0B1220]
            py-3
            pl-10
            pr-4
            text-sm
            text-white/70
            outline-none
            shadow-[0_0_7px_rgba(163,230,53,0.05)]
            transition-all
            duration-200
            focus:border-lime-300/60
            focus:shadow-[0_0_8px_rgba(163,230,53,0.35),0_0_18px_rgba(163,230,53,0.10)]
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

      {/* =====================================================
          SORT
      ====================================================== */}

      <div className="relative w-full lg:w-44">

        <ArrowUpDown
          size={15}
          className="
            pointer-events-none
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-lime-300/65
            drop-shadow-[0_0_5px_rgba(163,230,53,0.4)]
          "
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="
            w-full
            appearance-none
            rounded-xl
            border
            border-lime-300/20
            bg-[#0B1220]
            py-3
            pl-10
            pr-4
            text-sm
            text-white/70
            outline-none
            shadow-[0_0_7px_rgba(163,230,53,0.05)]
            transition-all
            duration-200
            focus:border-lime-300/60
            focus:shadow-[0_0_8px_rgba(163,230,53,0.35),0_0_18px_rgba(163,230,53,0.10)]
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

      {/* =====================================================
          ORDER
      ====================================================== */}

      <div
        className="
          flex
          items-center
          rounded-xl
          border
          border-lime-300/20
          bg-[#0B1220]
          p-1
          shadow-[0_0_7px_rgba(163,230,53,0.05)]
        "
      >

        <button
          type="button"
          onClick={() => setOrder("asc")}
          className={`
            rounded-lg
            px-3
            py-2
            text-[10px]
            font-bold
            tracking-wider
            transition-all
            duration-200
            ${
              order === "asc"
                ? `
                  bg-lime-300
                  text-black
                  shadow-[0_0_8px_rgba(163,230,53,0.75),0_0_18px_rgba(163,230,53,0.25)]
                `
                : `
                  text-white/35
                  hover:text-lime-300
                `
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
            font-bold
            tracking-wider
            transition-all
            duration-200
            ${
              order === "desc"
                ? `
                  bg-lime-300
                  text-black
                  shadow-[0_0_8px_rgba(163,230,53,0.75),0_0_18px_rgba(163,230,53,0.25)]
                `
                : `
                  text-white/35
                  hover:text-lime-300
                `
            }
          `}
        >
          DESC
        </button>

      </div>

      {/* =====================================================
          ADD PRODUCT
      ====================================================== */}

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
            border
            border-lime-200/70
            bg-lime-300
            px-5
            py-3
            text-sm
            font-bold
            text-black
            shadow-[0_0_10px_rgba(163,230,53,0.5),0_0_22px_rgba(163,230,53,0.18)]
            transition-all
            duration-200
            hover:bg-lime-200
            hover:shadow-[0_0_15px_rgba(163,230,53,0.75),0_0_32px_rgba(163,230,53,0.28)]
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