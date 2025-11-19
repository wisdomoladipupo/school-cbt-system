import DashboardLayout from "../layout";

export default function AdminDashboardPage() {
  return (
    <DashboardLayout userRole="admin">
<div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-blue-600 text-white rounded-xl shadow">
          <h3 className="text-lg font-semibold">Total Students</h3>
          <p className="text-3xl font-bold mt-2">1,240</p>
        </div>

        <div className="p-6 bg-green-600 text-white rounded-xl shadow">
          <h3 className="text-lg font-semibold">Total Teachers</h3>
          <p className="text-3xl font-bold mt-2">56</p>
        </div>

        <div className="p-6 bg-purple-600 text-white rounded-xl shadow">
          <h3 className="text-lg font-semibold">Active Exams</h3>
          <p className="text-3xl font-bold mt-2">12</p>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>

        <div className="flex gap-4 flex-wrap">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Create New Exam
          </button>

          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            Register Student
          </button>

          <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
            Manage Users
          </button>
        </div>
      </div>
    </div>
    </DashboardLayout>
    
  );
}
