import React from 'react';
import { ColleaguesTab } from './ColleaguesTab';
import { OfficeTab } from './OfficeTab';
import { ClubsTab } from './ClubsTab';
import { Role } from '../../types/zmonesTypes';

export const ZmonesModule: React.FC<{ role: Role }> = ({ role }) => {
  const path = window.location.pathname.toLowerCase();
  
  let content = <ColleaguesTab role={role} />;
  if (path.includes('/zmones/ofisas')) content = <OfficeTab role={role} />;
  else if (path.includes('/zmones/klubai')) content = <ClubsTab role={role} />;

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        {content}
      </div>
    </div>
  );
};
