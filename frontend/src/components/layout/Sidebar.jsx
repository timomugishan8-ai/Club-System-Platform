const Sidebar = () => {
  return (
    <div className="w-64 bg-slate-900 text-white h-screen p-6">
      <h1 className="text-2xl font-bold">
        DS Chapter
      </h1>

      <div className="mt-10 space-y-4">
        <p>Dashboard</p>
        <p>Members</p>
        <p>Attendance</p>
        <p>Learning</p>
        <p>Projects</p>
        <p>Research</p>
        <p>Analytics</p>
        <p>Reports</p>
      </div>
    </div>
  );
};

export default Sidebar;