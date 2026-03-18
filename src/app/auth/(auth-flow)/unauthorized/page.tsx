"use client";
import { LockKeyhole, Home, LogIn } from "lucide-react"; // Optional: icon library

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      {/* Icon/Illustration */}
      <div className="bg-red-100 p-4 rounded-full mb-6">
        <LockKeyhole size={48} className="text-red-600" />
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-2">
        Unauthorized Access
      </h1>
      <p className="text-gray-600 max-w-md mb-8">
        Oops! It looks like you don&apos;t have the permissions required to view
        this section of the Mess Manager.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Home size={18} />
          Back to Dashboard
        </button>

        <button
          onClick={() => (window.location.href = "/auth/login")}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          <LogIn size={18} />
          Sign In
        </button>
      </div>

      <p className="mt-12 text-sm text-gray-400">
        If you believe this is an error, please contact your Mess Manager.
      </p>
    </div>
  );
};

export default Unauthorized;
