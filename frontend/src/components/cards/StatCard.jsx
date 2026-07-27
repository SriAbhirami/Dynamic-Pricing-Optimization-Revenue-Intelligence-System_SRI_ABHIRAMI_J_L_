function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "text-blue-600",
}) {
  return (
    <div
      className="
        bg-gradient-to-br
        from-blue-50
        via-cyan-50
        to-white
        border
        border-blue-100
        rounded-2xl
        shadow-md
        hover:shadow-2xl
        hover:-translate-y-2
        transition-all
        duration-300
        p-6
      "
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide">
            {title}
          </p>

          <h2 className="text-4xl font-extrabold text-slate-800 mt-3">
            {value}
          </h2>

          <p className="text-blue-600 mt-4 font-semibold">
            {change}
          </p>
        </div>

        <div
          className={`
            p-4
            rounded-2xl
            bg-blue-100
            shadow-sm
            ${iconColor}
          `}
        >
          <Icon size={30} strokeWidth={2.3} />
        </div>
      </div>
    </div>
  );
}

export default StatCard;