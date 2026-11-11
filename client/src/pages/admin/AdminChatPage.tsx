import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { LiveChatPanel } from '../../components/admin/LiveChatPanel';

export const AdminChatPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const activeId = params.get('c') || '';

  return (
    <div className="h-[calc(100dvh-8.5rem)] min-h-[540px] overflow-hidden rounded-2xl border border-[#E8D9C8] bg-white shadow-sm">
      <LiveChatPanel
        initialChatId={activeId}
        onSelectChatId={(id) => setParams(id ? { c: id } : {})}
      />
    </div>
  );
};
