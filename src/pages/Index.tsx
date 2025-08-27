import Logo from "@/components/ui/logo";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <Logo size="xl" />
        </div>
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          Ministry of Innovation & Technology
        </h1>
        <p className="text-xl text-gray-600 mb-6">Record Management System</p>
        <div className="text-lg text-gray-700">
          <p>Welcome to the official document management platform</p>
          <p className="text-sm text-gray-500 mt-2">Please log in to access your dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
