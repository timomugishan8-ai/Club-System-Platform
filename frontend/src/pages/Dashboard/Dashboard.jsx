import AttendanceChart from "../../components/charts/AttendanceChart";
import ProjectStatusChart from "../../components/charts/ProjectStatusChart";
import {
  FaUsers,
  FaCalendarCheck,
  FaProjectDiagram,
  FaChartLine,
} from "react-icons/fa";

import StatCard from "../../components/cards/StatCard";

const Dashboard = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, Lynn 👋
        </h1>

        <p className="text-gray-500 mt-2">
          Here's what's happening in the Data Science Chapter.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatCard
          title="Total Members"
          value="86"
          subtitle="Active chapter members"
          icon={<FaUsers />}
        />

        <StatCard
          title="Attendance"
          value="82%"
          subtitle="Average attendance"
          icon={<FaCalendarCheck />}
        />

        <StatCard
          title="Projects"
          value="14"
          subtitle="Active projects"
          icon={<FaProjectDiagram />}
        />

        <StatCard
          title="Learning Progress"
          value="68%"
          subtitle="Average progress"
          icon={<FaChartLine />}
        />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
       <AttendanceChart />
       <ProjectStatusChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold">
            Recent Projects
          </h2>

          <div className="mt-6 space-y-4">

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">
                AI & African Jobs Research
              </p>
              <p className="text-sm text-gray-500">
                Research project
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">
                Cybersecurity SIEM Dashboard
              </p>
              <p className="text-sm text-gray-500">
                Data Science × Cybersecurity
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">
                Student Development Platform
              </p>
              <p className="text-sm text-gray-500">
                Chapter platform
              </p>
            </div>

          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold">
            Top Members
          </h2>

          <div className="mt-6 space-y-4">

            {[
              ["Member One", 12, "#1"],
              ["Member Two", 9, "#2"],
              ["Member Three", 7, "#3"],
            ].map(([name, contributions, rank]) => (
              <div
                key={rank}
                className="flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{name}</p>
                  <p className="text-sm text-gray-500">
                    {contributions} contributions
                  </p>
                </div>

                <span className="font-semibold text-blue-600">
                  {rank}
                </span>
              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;