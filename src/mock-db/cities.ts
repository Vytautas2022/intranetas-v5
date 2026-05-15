export interface City {
  id: string;
  name: string;
  is_active: boolean;
}

export const initialCities: City[] = [
  { id: 'vilnius', name: 'Vilnius', is_active: true },
  { id: 'kaunas', name: 'Kaunas', is_active: true },
  { id: 'klaipeda', name: 'Klaipėda', is_active: true },
  { id: 'siauliai', name: 'Šiauliai', is_active: true },
  { id: 'panevezys', name: 'Panevėžys', is_active: true }
];
