import { Colleague, OfficeObject, OfficeBlock, OfficeContact, Club, ClubBlock } from '../types/zmonesTypes';

export const colleaguesData: Colleague[] = [
  { id: "c-1", name: "Jūratė", position: "Vyr buhalteris/ė", phone: "37061439211", email: "apskaita.bendras@gmail.com", location: "Kaunas", departments: ["Buhalterija"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c-2", name: "Deimantė", position: "Klientų aptarnavimo koordinatorė", phone: "37060106268", email: "deimante@sportgates.lt", location: "Kaunas", departments: ["Klientų aptarnavimas", "Rinkodara"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c-3", name: "Emlija", position: "Klientų aptarnavimo specialistė", phone: "37062583479", email: "", location: "Kaunas", departments: ["Klientų aptarnavimas"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c-4", name: "Ernesta", position: "Klientų aptarnavimo specialistė", phone: "37067994505", email: "", location: "Kaunas", departments: ["Klientų aptarnavimas"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c-5", name: "Greta", position: "Projektų vadovė / operacijų koordinatorė", phone: "37067725956", email: "greta@sportgates.lt", location: "Kaunas", departments: ["Operacijos"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c-6", name: "Paulius", position: "Operacijų vadovas", phone: "37060445896", email: "paulius@sportgates.lt", location: "Kaunas", departments: ["Operacijos"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c-7", name: "Lina", position: "Rinkodaros vadybininkė", phone: "37062216558", email: "rinkodara@sportgates.lt", location: "Klaipėda", departments: ["Rinkodara"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c-8", name: "Oksana", position: "IT koordinatorė", phone: "37067795803", email: "oksana@sportgates.lt", location: "Klaipėda", departments: ["IT"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c-9", name: "Miglė", position: "Vilniaus sporto klubų koordinatorė", phone: "37060937636", email: "migle@sportgates.lt", location: "Vilnius", departments: ["Operacijos"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c-10", name: "Tomas", position: "Kauno sporto klubų koordinatorius", phone: "37063008782", email: "", location: "Kaunas", departments: ["Operacijos"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c-11", name: "Vytautas", position: "Direktorius", phone: "37060012177", email: "vytautas@sportgates.lt", location: "Kaunas", departments: ["Direktorius"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c-12", name: "Kornelija", position: "Teisė (freelancer)", phone: "69144012", email: "kornelija@sportgates.lt", location: "Kaunas", departments: ["Teisė"], comment: "", created_at: "2023-01-01", updated_at: "2023-01-01" }
];

export const officeObjectsData: OfficeObject[] = [
  { id: "v27-kaunas", name: "Vytauto pr 27, Kaunas", created_at: "2023-01-01", updated_at: "2023-01-01" }
];

export const officeBlocksData: OfficeBlock[] = [
  { id: "ob1", office_id: "v27-kaunas", title: "Adresas", content: "Vytauto pr 27, Kaunas, 44352", order_index: 1, is_sensitive: false, created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "ob2", office_id: "v27-kaunas", title: "Ofiso durų kodas", content: "5623", order_index: 2, is_sensitive: true, created_at: "2023-01-01", updated_at: "2023-01-01" }
];

export const officeContactsData: OfficeContact[] = [
  { id: "oc1", office_id: "v27-kaunas", type: "Atsakingas visais klausimais", name: "Kristina Martišiūtė", phone: "37067725956", email: "kristina@ausra.lt" }
];

export const clubsData: Club[] = [
  { id: "club-1", name: "Vytauto pr 23, Kaunas", city: "Kaunas", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "club-2", name: "Sabaliausko g 14, Aleksotas, Kaunas", city: "Kaunas", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "club-3", name: "Šiaurės pr 8D, Kaunas", city: "Kaunas", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "club-4", name: "Krėvės pr 57, Kaunas", city: "Kaunas", created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "club-5", name: "Ogmios, Verkių g 29, Vilnius", city: "Vilnius", created_at: "2023-01-01", updated_at: "2023-01-01" }
];

export const clubBlocksData: ClubBlock[] = [
  // Club 1 blocks
  { id: "c1-b1", club_id: "club-1", title: "PAGRINDINĖ INFO", content: "Klubas veikia 24/7.", order_index: 1, is_sensitive: false, created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c1-b2", club_id: "club-1", title: "PATEKIMAS IR KODAI", content: "Kodas: 8854", order_index: 2, is_sensitive: true, created_at: "2023-01-01", updated_at: "2023-01-01" },
  // Club 2
  { id: "c2-b1", club_id: "club-2", title: "PAGRINDINĖ INFO", content: "Klubas veikia 24/7.", order_index: 1, is_sensitive: false, created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c2-b2", club_id: "club-2", title: "PATEKIMAS IR KODAI", content: "Kodas: 1234", order_index: 2, is_sensitive: true, created_at: "2023-01-01", updated_at: "2023-01-01" },
  // Clubs 3-5 (abridged placeholders)
  { id: "c3-b1", club_id: "club-3", title: "PAGRINDINĖ INFO", content: "...", order_index: 1, is_sensitive: false, created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c3-b2", club_id: "club-3", title: "PATEKIMAS IR KODAI", content: "...", order_index: 2, is_sensitive: true, created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c4-b1", club_id: "club-4", title: "PAGRINDINĖ INFO", content: "...", order_index: 1, is_sensitive: false, created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c4-b2", club_id: "club-4", title: "PATEKIMAS IR KODAI", content: "...", order_index: 2, is_sensitive: true, created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c5-b1", club_id: "club-5", title: "PAGRINDINĖ INFO", content: "...", order_index: 1, is_sensitive: false, created_at: "2023-01-01", updated_at: "2023-01-01" },
  { id: "c5-b2", club_id: "club-5", title: "PATEKIMAS IR KODAI", content: "...", order_index: 2, is_sensitive: true, created_at: "2023-01-01", updated_at: "2023-01-01" }
];
