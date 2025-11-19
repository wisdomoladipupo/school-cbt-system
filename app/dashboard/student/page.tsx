"use client";



import DashboardLayout from "../layout";

export default function StudentDashboardPage() {
  return (
    <DashboardLayout userRole="student">
  <div className="space-y-6">
      <h2 className="text-2xl font-bold">Student Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-blue-500 text-white rounded-xl shadow">
          <h3 className="text-lg font-semibold">Upcoming Exams</h3>
          <p className="text-3xl font-bold mt-2">3</p>
        </div>

        <div className="p-6 bg-green-500 text-white rounded-xl shadow">
          <h3 className="text-lg font-semibold">Completed Exams</h3>
          <p className="text-3xl font-bold mt-2">14</p>
        </div>

        <div className="p-6 bg-pink-500 text-white rounded-xl shadow">
          <h3 className="text-lg font-semibold">Average Score</h3>
          <p className="text-3xl font-bold mt-2">78%</p>
        </div>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>

        <div className="flex gap-4 flex-wrap">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Take Exam
          </button>

          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            View Results
          </button>

          <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
            Study Materials
          </button>
        </div>
      </div>
    </div>
    </DashboardLayout>
  
  );
}
