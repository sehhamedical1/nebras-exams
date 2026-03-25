import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Library, BarChart2, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'الرئيسية', icon: Home },
    { path: '/create', label: 'إنشاء لعبة', icon: Library },
    { path: '/reports', label: 'التقارير', icon: BarChart2 },
    { path: '/student/login', label: 'تجربة الطالب', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row islamic-pattern">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-dark/80 backdrop-blur-md border-l border-primary/20 sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 border-b border-primary/20">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl">
            ن
          </div>
          <h1 className="text-xl font-bold text-white">نبراس</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary/20">
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all w-full text-right">
            <LogOut size={20} />
            <span className="font-medium">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom Nav for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-dark/95 backdrop-blur-md border-t border-primary/20 z-50">
        <div className="flex justify-around p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                  isActive ? "text-primary" : "text-slate-400"
                )}
              >
                <Icon size={24} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
