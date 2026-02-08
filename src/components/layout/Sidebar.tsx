import { NavLink } from "react-router-dom";
import { Disc, Music, Heart, PlusCircle } from "lucide-react";

const menuItems = [
  { path: "/albums", label: "Albums", icon: Disc },
  { path: "/songs", label: "Bài hát", icon: Music },
  { path: "/favorites", label: "Yêu thích", icon: Heart },
  { path: "/add-song", label: "Thêm bài hát", icon: PlusCircle },
];

export default function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 border-r border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Disc className="w-6 h-6" />
          EzConv
        </h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-black/5 dark:bg-white/5 text-primary"
                  : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
