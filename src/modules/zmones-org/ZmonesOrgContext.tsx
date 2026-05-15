import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Colleague, DetailedOffice, DetailedClub,
  seedColleagues, seedDetailedOffices, seedDetailedClubs, seedOffices, seedClubs,
  OfficeBlock, OfficeContact, ClubBlock, ClubContact, ClubZone
} from '../../mock-db/zmonesOrg';

interface ZmonesOrgContextType {
  colleagues: Colleague[];
  addColleague: (data: Omit<Colleague, 'id' | 'created_at' | 'updated_at'>) => void;
  updateColleague: (id: string, data: Partial<Colleague>) => void;
  deleteColleague: (id: string) => void;

  detailedOffices: Record<string, DetailedOffice>;
  addOfficeBlock: (officeId: string, data: Omit<OfficeBlock, 'id' | 'office_id' | 'created_at' | 'updated_at'>) => void;
  updateOfficeBlock: (officeId: string, blockId: string, data: Partial<OfficeBlock>) => void;
  deleteOfficeBlock: (officeId: string, blockId: string) => void;
  reorderOfficeBlocks: (officeId: string, newOrderedIds: string[]) => void;
  
  addOfficeContact: (officeId: string, data: Omit<OfficeContact, 'id' | 'office_id'>) => void;
  updateOfficeContact: (officeId: string, contactId: string, data: Partial<OfficeContact>) => void;
  deleteOfficeContact: (officeId: string, contactId: string) => void;

  detailedClubs: Record<string, DetailedClub>;
  addClubBlock: (clubId: string, data: Omit<ClubBlock, 'id' | 'club_id' | 'created_at' | 'updated_at'>) => void;
  updateClubBlock: (clubId: string, blockId: string, data: Partial<ClubBlock>) => void;
  deleteClubBlock: (clubId: string, blockId: string) => void;
  reorderClubBlocks: (clubId: string, newOrderedIds: string[]) => void;
  
  addClubContact: (clubId: string, data: Omit<ClubContact, 'id' | 'club_id'>) => void;
  updateClubContact: (clubId: string, contactId: string, data: Partial<ClubContact>) => void;
  deleteClubContact: (clubId: string, contactId: string) => void;

  addClubZone: (clubId: string, data: Omit<ClubZone, 'id' | 'club_id'>) => void;
  updateClubZone: (clubId: string, zoneId: string, data: Partial<ClubZone>) => void;
  deleteClubZone: (clubId: string, zoneId: string) => void;
}

const ZmonesOrgContext = createContext<ZmonesOrgContextType | null>(null);

const genId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const ZmonesOrgProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [colleagues, setColleagues] = useState<Colleague[]>(seedColleagues);
  const [detailedOffices, setDetailedOffices] = useState<Record<string, DetailedOffice>>(seedDetailedOffices);
  const [detailedClubs, setDetailedClubs] = useState<Record<string, DetailedClub>>(seedDetailedClubs);

  const addColleague = (data: Omit<Colleague, 'id' | 'created_at' | 'updated_at'>) => {
    const item: Colleague = { ...data, id: genId('col'), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setColleagues(prev => [...prev, item]);
  };
  const updateColleague = (id: string, data: Partial<Colleague>) => {
    setColleagues(prev => prev.map(c => c.id === id ? { ...c, ...data, updated_at: new Date().toISOString() } : c));
  };
  const deleteColleague = (id: string) => {
    setColleagues(prev => prev.filter(c => c.id !== id));
  };

  const updateOffice = (officeId: string, updater: (office: DetailedOffice) => DetailedOffice) => {
    setDetailedOffices(prev => {
      if (!prev[officeId]) return prev;
      return { ...prev, [officeId]: updater(prev[officeId]) };
    });
  };

  const addOfficeBlock = (officeId: string, data: Omit<OfficeBlock, 'id' | 'office_id' | 'created_at' | 'updated_at'>) => {
    updateOffice(officeId, (office) => ({
      ...office, 
      blocks: [...office.blocks, { ...data, id: genId('ob'), office_id: officeId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]
    }));
  };
  const updateOfficeBlock = (officeId: string, blockId: string, data: Partial<OfficeBlock>) => {
    updateOffice(officeId, (office) => ({
      ...office,
      blocks: office.blocks.map(b => b.id === blockId ? { ...b, ...data, updated_at: new Date().toISOString() } : b)
    }));
  };
  const deleteOfficeBlock = (officeId: string, blockId: string) => {
    updateOffice(officeId, (office) => ({ ...office, blocks: office.blocks.filter(b => b.id !== blockId) }));
  };
  const reorderOfficeBlocks = (officeId: string, newOrderedIds: string[]) => {
    updateOffice(officeId, (office) => {
      const blocksMap = new Map(office.blocks.map(b => [b.id, b]));
      const newBlocks = newOrderedIds.map((id, index) => {
        const b = blocksMap.get(id)!;
        return { ...b, order_index: index };
      });
      return { ...office, blocks: newBlocks };
    });
  };

  const addOfficeContact = (officeId: string, data: Omit<OfficeContact, 'id' | 'office_id'>) => {
    updateOffice(officeId, (office) => ({
      ...office, contacts: [...office.contacts, { ...data, id: genId('oc'), office_id: officeId }]
    }));
  };
  const updateOfficeContact = (officeId: string, contactId: string, data: Partial<OfficeContact>) => {
    updateOffice(officeId, (office) => ({
      ...office, contacts: office.contacts.map(c => c.id === contactId ? { ...c, ...data } : c)
    }));
  };
  const deleteOfficeContact = (officeId: string, contactId: string) => {
    updateOffice(officeId, (office) => ({ ...office, contacts: office.contacts.filter(c => c.id !== contactId) }));
  };


  const updateClub = (clubId: string, updater: (club: DetailedClub) => DetailedClub) => {
    setDetailedClubs(prev => {
      if (!prev[clubId]) return prev;
      return { ...prev, [clubId]: updater(prev[clubId]) };
    });
  };

  const addClubBlock = (clubId: string, data: Omit<ClubBlock, 'id' | 'club_id' | 'created_at' | 'updated_at'>) => {
    updateClub(clubId, (club) => ({
      ...club, 
      blocks: [...club.blocks, { ...data, id: genId('cb'), club_id: clubId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]
    }));
  };
  const updateClubBlock = (clubId: string, blockId: string, data: Partial<ClubBlock>) => {
    updateClub(clubId, (club) => ({
      ...club,
      blocks: club.blocks.map(b => b.id === blockId ? { ...b, ...data, updated_at: new Date().toISOString() } : b)
    }));
  };
  const deleteClubBlock = (clubId: string, blockId: string) => {
    updateClub(clubId, (club) => ({ ...club, blocks: club.blocks.filter(b => b.id !== blockId) }));
  };
  const reorderClubBlocks = (clubId: string, newOrderedIds: string[]) => {
    updateClub(clubId, (club) => {
      const blocksMap = new Map(club.blocks.map(b => [b.id, b]));
      const newBlocks = newOrderedIds.map((id, index) => {
        const b = blocksMap.get(id)!;
        return { ...b, order_index: index };
      });
      return { ...club, blocks: newBlocks };
    });
  };

  const addClubContact = (clubId: string, data: Omit<ClubContact, 'id' | 'club_id'>) => {
    updateClub(clubId, (club) => ({
      ...club, contacts: [...club.contacts, { ...data, id: genId('cc'), club_id: clubId }]
    }));
  };
  const updateClubContact = (clubId: string, contactId: string, data: Partial<ClubContact>) => {
    updateClub(clubId, (club) => ({
      ...club, contacts: club.contacts.map(c => c.id === contactId ? { ...c, ...data } : c)
    }));
  };
  const deleteClubContact = (clubId: string, contactId: string) => {
    updateClub(clubId, (club) => ({ ...club, contacts: club.contacts.filter(c => c.id !== contactId) }));
  };

  const addClubZone = (clubId: string, data: Omit<ClubZone, 'id' | 'club_id'>) => {
    updateClub(clubId, (club) => ({
      ...club, zones: [...club.zones, { ...data, id: genId('cz'), club_id: clubId }]
    }));
  };
  const updateClubZone = (clubId: string, zoneId: string, data: Partial<ClubZone>) => {
    updateClub(clubId, (club) => ({
      ...club, zones: club.zones.map(z => z.id === zoneId ? { ...z, ...data } : z)
    }));
  };
  const deleteClubZone = (clubId: string, zoneId: string) => {
    updateClub(clubId, (club) => ({ ...club, zones: club.zones.filter(z => z.id !== zoneId) }));
  };

  const value = {
    colleagues,
    addColleague, updateColleague, deleteColleague,
    
    detailedOffices,
    addOfficeBlock, updateOfficeBlock, deleteOfficeBlock, reorderOfficeBlocks,
    addOfficeContact, updateOfficeContact, deleteOfficeContact,

    detailedClubs,
    addClubBlock, updateClubBlock, deleteClubBlock, reorderClubBlocks,
    addClubContact, updateClubContact, deleteClubContact,
    addClubZone, updateClubZone, deleteClubZone,
  };

  return <ZmonesOrgContext.Provider value={value}>{children}</ZmonesOrgContext.Provider>;
};

export const useZmonesOrg = () => {
  const context = useContext(ZmonesOrgContext);
  if (!context) throw new Error("useZmonesOrg must be used within ZmonesOrgProvider");
  return context;
};
