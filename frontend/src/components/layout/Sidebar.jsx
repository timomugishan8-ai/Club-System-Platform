import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaCalendarCheck,
  FaBook,
  FaProjectDiagram,
  FaFileAlt,
  FaTrophy,
  FaChartBar,
  FaClipboardList,
} from "react-icons/fa";

const menuItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: <FaHome />,
  },
  {
    name: "Members",
    path: "/members",
    icon: <FaUsers />,
  },
  {
    name: "Attendance",
    path: "/attendance",
    icon: <FaCalendarCheck />,
  },
  {
    name: "Learning",
    path: "/learning",
    icon: <FaBook />,
  },
  {
    name: "Projects",
    path: "/projects",
    icon: <FaProjectDiagram />,
  },
  {
    name: "Research",
    path: "/research",
    icon: <FaFileAlt />,
  },
  {
    name: "Rankings",
    path: "/rankings",
    icon: <FaTrophy />,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: <FaChartBar />,
  },
  {
    name: "Reports",
    path: "/reports",
    icon: <FaClipboardList />,
  },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-6">
      <h1 className="text-2xl font-bold">
        DS Chapter
      </h1>

      <nav className="mt-10 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? "bg-blue-600"
                  : "hover:bg-slate-800"
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;