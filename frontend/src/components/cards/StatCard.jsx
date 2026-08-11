const StatCard = ({ title, value, subtitle, icon }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mt-2">
            {value}
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            {subtitle}
          </p>
        </div>

        <div className="text-2xl text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;