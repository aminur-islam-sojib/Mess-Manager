"use client";
import { useState } from "react";
import {
  Home,
  Search,
  FileQuestion,
  Users,
  Receipt,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";

export default function DashboardNotFound() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mockSession = {
    user: {
      name: "John Doe",
      email: "john@example.com",
      role: "manager",
    },
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:z-50 bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">
              {mockSession.user.role === "manager" ? "Manager" : "Member"}
            </h2>
            <p className="text-xs text-muted-foreground">Dashboard</p>
          </div>
        </div>

        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg">
              {mockSession.user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sidebar-foreground truncate">
                {mockSession.user.name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {mockSession.user.email}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <Home className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <Users className="w-5 h-5" />
            <span className="font-medium">Members</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <Receipt className="w-5 h-5" />
            <span className="font-medium">Expenses</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-72">
        <header className="sticky top-0 z-40 bg-card border-b border-border lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <div className="w-10"></div>
          </div>
        </header>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Home className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sidebar-foreground">
                      {mockSession.user.role === "manager"
                        ? "Manager"
                        : "Member"}
                    </h2>
                    <p className="text-xs text-muted-foreground">Dashboard</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-sidebar-accent"
                >
                  <X className="w-5 h-5 text-sidebar-foreground" />
                </button>
              </div>

              <div className="p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg">
                    {mockSession.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sidebar-foreground truncate">
                      {mockSession.user.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {mockSession.user.email}
                    </p>
                  </div>
                </div>
              </div>

              <nav className="p-4 space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                  <Home className="w-5 h-5" />
                  <span className="font-medium">Overview</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Members</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                  <Receipt className="w-5 h-5" />
                  <span className="font-medium">Expenses</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </button>
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="min-h-screen flex items-center justify-center p-4 md:p-6">
          <div className="max-w-lg w-full text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-40 h-40 rounded-full bg-muted flex items-center justify-center animate-pulse">
                  <FileQuestion className="w-20 h-20 text-muted-foreground" />
                </div>
                <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Page Not Found
            </h1>

            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              The page you are looking for does not exist or you don ot have
              permission to access it.
            </p>

            <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-primary text-xl">💡</span>
                What you can do:
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">1</span>
                  </div>
                  <span>Check the URL for any typos or errors</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">2</span>
                  </div>
                  <span>Navigate back to the dashboard using the sidebar</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-bold">3</span>
                  </div>
                  <span>Verify your account has the necessary permissions</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:opacity-90 transition-all shadow-lg hover:shadow-xl active:scale-95">
                <Home className="w-5 h-5" />
                Back to Dashboard
              </button>

              <button className="flex items-center justify-center gap-2 px-8 py-4 bg-card text-foreground border-2 border-border rounded-xl font-semibold text-base hover:bg-accent transition-all active:scale-95">
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>

            <div className="mt-10 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Still having trouble?
              </p>
              <button className="text-primary font-semibold text-sm hover:underline">
                Contact Support Team →
              </button>
            </div>
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border lg:hidden z-30">
          <div className="grid grid-cols-4 gap-1 p-2">
            <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-primary bg-primary/5">
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
              <Users className="w-6 h-6" />
              <span className="text-xs font-medium">Members</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
              <Receipt className="w-6 h-6" />
              <span className="text-xs font-medium">Expenses</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent">
              <Settings className="w-6 h-6" />
              <span className="text-xs font-medium">Settings</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
