import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const projectData = [
  { status: "Ideation", projects: 5 },
  { status: "In Progress", projects: 6 },
  { status: "Completed", projects: 2 },
  { status: "Published", projects: 1 },
];

const ProjectStatusChart = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Project Progress
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Current status of chapter projects
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={projectData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="status" />

            <YAxis allowDecimals={false} />

            <Tooltip />

            <Bar
              dataKey="projects"
              fill="#2563eb"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectStatusChart;