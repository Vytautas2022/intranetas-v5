export interface Club {
  id: string;
  name: string;
  city?: string; // KEEP old field for fallback
  city_id?: string; // NEW field
  address?: string; // NEW field
  coordinator_id?: string; // NEW field
  region?: string;
  is_active?: boolean;
  originalId?: string;
}

export const clubs: Club[] = [
  // Kaunas
  { id: "SG_VYT", name: "SG Vytauto pr", city: "Kaunas", city_id: "kaunas", region: "Kaunas", is_active: true, address: "Vytauto pr. 23, Kaunas", coordinator_id: "u2" },
  { id: "ALEKS", name: "SG Aleksotas", city: "Kaunas", city_id: "kaunas", region: "Kaunas", is_active: true, address: "Sabaliausko g. 14, Kaunas", coordinator_id: "u2" },
  { id: "SIAU", name: "SG Šiaurės pr", city: "Kaunas", city_id: "kaunas", region: "Kaunas", is_active: true, address: "Šiaurės pr. 8D, Kaunas", coordinator_id: "u2" },
  { id: "KRE", name: "SG Krėvės pr", city: "Kaunas", city_id: "kaunas", region: "Kaunas", is_active: true, address: "Krėvės pr. 57, Kaunas", coordinator_id: "u2" },
  // Vilnius
  { id: "OGM", name: "SG Ogmios", city: "Vilnius", city_id: "vilnius", region: "Vilnius", is_active: true, address: "Verkių g. 29, Vilnius", coordinator_id: "u1" },
  { id: "MND", name: "SG Mindaugo", city: "Vilnius", city_id: "vilnius", region: "Vilnius", is_active: true, address: "Mindaugo g. 14B, Vilnius", coordinator_id: "u1" },
  { id: "STN", name: "SG Stanevičiaus", city: "Vilnius", city_id: "vilnius", region: "Vilnius", is_active: true, address: "Stanevičiaus g. 13, Vilnius", coordinator_id: "u1" },
  { id: "DNG", name: "SG Dangeručio", city: "Vilnius", city_id: "vilnius", region: "Vilnius", is_active: true, address: "Dangeručio g. 1, Vilnius", coordinator_id: "u1" },
  // Old/Inactive
  { id: "akropolis", name: "SG Akropolis (Inactive)", city: "Vilnius", city_id: "vilnius", region: "Vilnius", is_active: false, address: "Ozo g. 25, Vilnius", coordinator_id: "u1" },
  { id: "panorama", name: "SG Panorama (Inactive)", city: "Vilnius", city_id: "vilnius", region: "Vilnius", is_active: false, address: "Saltoniškių g. 9, Vilnius", coordinator_id: "u1" },
  { id: "kaunas", name: "SG Kaunas (Inactive)", city: "Kaunas", city_id: "kaunas", region: "Kaunas", is_active: false, address: "Karaliaus Mindaugo pr. 49, Kaunas", coordinator_id: "u2" },
  { id: "klaipeda", name: "SG Klaipėda Center (Inactive)", city: "Klaipėda", city_id: "klaipeda", region: "Klaipėda", is_active: false, address: "Taikos pr. 61, Klaipėda" }
];
