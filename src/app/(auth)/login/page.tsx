import { LoginForm } from "@/components/LoginFormNew";
import { Ship, Anchor, Package, Wrench } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-950 flex items-center justify-center relative overflow-hidden p-0">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-10 left-10 text-blue-400 opacity-20 animate-pulse">
        <Ship size={80} />
      </div>

      <div className="absolute bottom-10 right-10 text-blue-300 opacity-20 animate-bounce">
        <Anchor size={60} />
      </div>
      <div className="absolute top-1/3 right-20 text-cyan-400 opacity-20 animate-spin">
        <Package size={50} />
      </div>
      <div className="absolute bottom-1/3 left-20 text-cyan-500 opacity-20 animate-pulse">
        <Wrench size={50} />
      </div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}
