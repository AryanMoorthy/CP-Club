import React from 'react';

/**
 * PageHeader — consistent top section for every page.
 * Props:
 *   title       - string
 *   subtitle    - string (optional)
 *   icon        - Lucide icon component (optional)
 *   iconColor   - tailwind text color class (optional)
 *   actions     - ReactNode (buttons, links, etc.)
 */
export default function PageHeader({ title, subtitle, icon: Icon, iconColor = 'text-indigo-400', actions }) {
  return (
    <div className="page-header">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex-shrink-0 mt-0.5">
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
