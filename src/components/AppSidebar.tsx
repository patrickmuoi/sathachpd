/* Lumen · UX/UI Prompt #040 */
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, GraduationCap, type LucideIcon } from 'lucide-react';
import './AppSidebar.css';

type SidebarItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

type AppSidebarProps = {
  items: SidebarItem[];
  roleLabel: string;
};

export default function AppSidebar({ items, roleLabel }: AppSidebarProps) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const activeIndex = Math.max(items.findIndex((item) => location.pathname.startsWith(item.to)), 0);

  return (
    <aside className={`u040 u040-sidebar${expanded ? ' is-expanded' : ''}`}>
      <div className="u040-top">
        <button
          type="button"
          className="u040-toggle"
          onClick={() => setExpanded((current) => !current)}
          aria-label={expanded ? 'Thu gọn thanh điều hướng' : 'Mở rộng thanh điều hướng'}
          aria-expanded={expanded}
          aria-controls="u040-navigation"
          title={expanded ? 'Thu gọn thanh điều hướng' : 'Mở rộng thanh điều hướng'}
        >
          {expanded ? <ChevronLeft /> : <ChevronRight />}
        </button>
        <div className="u040-role" aria-hidden={!expanded}>{roleLabel}</div>
      </div>

      <nav id="u040-navigation" className="u040-nav" aria-label="Điều hướng chính">
        <span
          className="u040-marker"
          aria-hidden="true"
          style={{ transform: `translateY(${activeIndex * 48}px)` }}
        />
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={!expanded ? item.label : undefined}
              aria-label={!expanded ? item.label : undefined}
              className={({ isActive }) => `u040-link${isActive ? ' is-active' : ''}`}
            >
              <Icon className="u040-icon" aria-hidden="true" />
              <span
                className="u040-label"
                aria-hidden={!expanded}
                style={{ transitionDelay: expanded ? `${index * 35}ms` : '0ms' }}
              >
                {item.label}
              </span>
              {active && <span className="u040-current" aria-hidden="true">Đang chọn</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="u040-support" title="Kỳ Thi Tiêu Chuẩn">
        <GraduationCap className="u040-support-icon" aria-hidden="true" />
        <div className="u040-support-copy" aria-hidden={!expanded}>
          <strong>Kỳ Thi Tiêu Chuẩn</strong>
          <span>Hệ thống thi tích hợp chống gian lận &amp; bảo mật chấm điểm độc lập.</span>
        </div>
      </div>
    </aside>
  );
}