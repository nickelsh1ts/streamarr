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
      <div role="tablist" className="tabs-bordered border-zinc-400 border-b">
        {tabs?.map((tab) => {
          return (
            <button
              key={tab.id}
              onClick={(e) => {
                e.preventDefault();
                setActive(`${tab.id}`);
              }}
              id={`${tab.id}}`}
              role="tab"
              className={`tab h-fit w-fit py-2 font-bold text-black${activeTab === tab.id ? ' tab-active !border-primary text-primary' : ''}`}
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
            className={`w-full mt-7 mx-auto${activeTab === tab.id ? '' : ' hidden'}`}
          >
            {tab.content}
          </div>
        );
      })}
    </div>
  );
};

export default Tabs;
