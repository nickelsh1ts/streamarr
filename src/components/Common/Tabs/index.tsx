'use client';
import { useState } from 'react';

export interface TabsProps {
  id: string;
  title: string;
  content: React.ReactNode;
}

const Tabs = ({ tabs }: { tabs: TabsProps[] }) => {
  const [activeTab, setActive] = useState(`${tabs[0]?.id}`);
  return (
    <div className="grid">
      <div role="tablist" className="tabs-border border-b border-zinc-400">
        {tabs?.map((tab) => {
          return (
            <button
              key={tab.id}
              onClick={(e) => {
                e.preventDefault();
                setActive(tab.id);
              }}
              id={tab.id}
              role="tab"
              className={`tab h-fit w-fit py-2 font-bold [--tab-color:black] ${activeTab === tab.id ? 'tab-active border-primary! text-primary' : ''}`}
            >
              {tab.title}
            </button>
          );
        })}
      </div>
      {tabs?.map((tab) => {
        return (
          <div
            key={tab.id}
            id={tab.id}
            className={`mx-auto mt-7 w-full ${activeTab === tab.id ? '' : 'hidden'}`}
          >
            {tab.content}
          </div>
        );
      })}
    </div>
  );
};

export default Tabs;
