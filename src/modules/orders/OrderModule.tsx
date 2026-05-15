import React, { useState } from 'react';
import { OrderProvider } from './OrderContext';
import { OrderKanban } from './OrderKanban';
import { OrderListView } from './OrderListView';
import { OrderAnalytics } from './OrderAnalytics';

interface Props {
  currentUser: any;
  clubs: any[];
  suppliers: any[];
}

/**
 * Shell component combining different views for the Order Management module.
 */
export const OrderModule: React.FC<Props> = ({ currentUser, clubs, suppliers }) => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'list' | 'analytics'>('kanban');

  return (
    <OrderProvider>
      <div className="h-full flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex border-b bg-white border-slate-200">
          <button 
            className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'kanban' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500'}`}
            onClick={() => setActiveTab('kanban')}
          >
            Kanban
          </button>
          <button 
            className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'list' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500'}`}
            onClick={() => setActiveTab('list')}
          >
            Sąrašas
          </button>
          <button 
            className={`px-4 py-3 text-sm font-bold border-b-2 ${activeTab === 'analytics' ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500'}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analitika
          </button>
        </div>

        {/* View Container */}
        <div className="flex-1 overflow-hidden bg-white">
          {activeTab === 'kanban' && <OrderKanban currentUser={currentUser} />}
          {activeTab === 'list' && <OrderListView currentUser={currentUser} />}
          {activeTab === 'analytics' && <OrderAnalytics />}
        </div>
      </div>
    </OrderProvider>
  );
};
