import { useNavigate } from "react-router-dom";

interface SidebarProps {
  activePage: string;
}

const items = [
  { id: "dashboard", label: "Dashboard", icon: "◉" },
  { id: "processes", label: "Processes", icon: "○" },
  { id: "about", label: "About", icon: "○" },
];

export function Sidebar({ activePage }: SidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="w-48 flex-shrink-0 border-r border-slate-800 bg-slate-900 p-2">
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(`/${item.id}`)}
              className={`flex items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-500"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
