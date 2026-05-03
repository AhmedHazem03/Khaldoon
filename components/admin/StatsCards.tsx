interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
}

interface StatsCardsProps {
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  totalRevenue: number;
  newCustomers: number;
  topItems: { name: string; count: number }[];
}

export default function StatsCards({
  todayOrders,
  weekOrders,
  monthOrders,
  totalRevenue,
  newCustomers,
  topItems,
}: StatsCardsProps) {
  const cards: StatCard[] = [
    { label: "طلبات اليوم", value: todayOrders },
    { label: "طلبات الأسبوع", value: weekOrders },
    { label: "طلبات الشهر", value: monthOrders },
    {
      label: "إجمالي الإيرادات",
      value: `${totalRevenue.toLocaleString("ar-EG")} ج`,
    },
    { label: "عملاء جدد (الشهر)", value: newCustomers },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-white p-4 shadow-sm border border-gray-100"
          >
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-[#0F293E]">{card.value}</p>
            {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Top 5 items */}
      {topItems.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-[#0F293E] mb-3">
            الأصناف الأكثر طلباً (الشهر)
          </h3>
          <ol className="space-y-2">
            {topItems.map((item, i) => (
              <li
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0F293E] text-white text-xs flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-gray-700">{item.name}</span>
                </span>
                <span className="font-medium text-[#E4570F]">{item.count} مرة</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
