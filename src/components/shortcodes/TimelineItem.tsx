// src/components/shortcodes/TimelineItem.tsx
"use client";

import React from 'react';
import { Icon } from './Icon';
import Badge from './Badge';

interface TimelineItemProps {
  icon?: string;
  header?: string;
  badge?: string;
  subheader?: string;
  children?: React.ReactNode;
}

export function TimelineItem({ 
  icon = "check", 
  header, 
  badge, 
  subheader, 
  children 
}: TimelineItemProps) {
  return (
    <li>
      <div className="flex flex-start">
        <div className="bg-primary-500 dark:bg-primary-300 text-neutral-50 dark:text-neutral-700 min-w-[30px] h-8 text-2xl flex items-center justify-center rounded-full -ml-12 mt-5">
          <Icon name={icon} />
        </div>
        <div className="block p-6 rounded-lg shadow-2xl min-w-full ml-6 mb-10 break-words">
          <div className="flex justify-between">
            {header && (
              <h2 className="mt-0">{header}</h2>
            )}
            {badge && (
              <h3 className="">
                <Badge>{badge}</Badge>
              </h3>
            )}
          </div>
          {subheader && (
            <h4 className="mt-0">
              {subheader}
            </h4>
          )}
          <div className="mb-6">
            {children}
          </div>
        </div>
      </div>
    </li>
  );
}

export default TimelineItem;
