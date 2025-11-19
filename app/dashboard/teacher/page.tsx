import DashboardLayout from "../layout";

export default function TeacherDashboardPage() {
  return (
    <DashboardLayout userRole="teacher">



    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Teacher Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-indigo-600 text-white rounded-xl shadow">
          <h3 className="text-lg font-semibold">Classes Assigned</h3>
          <p className="text-3xl font-bold mt-2">4</p>
        </div>

        <div className="p-6 bg-amber-600 text-white rounded-xl shadow">
          <h3 className="text-lg font-semibold">Exams Created</h3>
          <p className="text-3xl font-bold mt-2">19</p>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-4">Actions</h3>

        <div className="flex gap-4 flex-wrap">
          <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
            Create Exam
          </button>

          <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
            Grade Results
          </button>

          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
            View My Classes
          </button>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
  
}
    
