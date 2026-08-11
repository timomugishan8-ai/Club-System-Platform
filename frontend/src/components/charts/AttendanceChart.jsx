import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const attendanceData = [
  { week: "Week 1", attendance: 72 },
  { week: "Week 2", attendance: 78 },
  { week: "Week 3", attendance: 81 },
  { week: "Week 4", attendance: 76 },
  { week: "Week 5", attendance: 84 },
  { week: "Week 6", attendance: 88 },
];

const AttendanceChart = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">

      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Attendance Overview
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Chapter attendance across recent sessions
        </p>
      </div>

      <div className="h-72">

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={attendanceData}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="week" />

            <YAxis domain={[0, 100]} />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="attendance"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4 }}
            />

          </LineChart>
        </ResponsiveContainer>

      </div>

    </div>
  );
};

export default AttendanceChart;