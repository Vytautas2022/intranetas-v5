
export interface CustomerSurvey {
  id: string;
  clubId: string;
  timestamp: number;
  ratings: {
    repairSpeed: number;
    equipmentQuality: number;
    inventoryQuality: number;
    cleanliness: number;
    ventilation: number;
    trainers: number;
    clientBehavior: number;
    service: number;
  };
}

export const surveys: CustomerSurvey[] = [
  // Vilnius
  {
    id: 's1',
    clubId: 'OGM',
    timestamp: Date.now() - (10 * 24 * 60 * 60 * 1000),
    ratings: {
      repairSpeed: 4,
      equipmentQuality: 5,
      inventoryQuality: 4,
      cleanliness: 5,
      ventilation: 4,
      trainers: 5,
      clientBehavior: 4,
      service: 5
    }
  },
  {
    id: 's2',
    clubId: 'MND',
    timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000),
    ratings: {
      repairSpeed: 3,
      equipmentQuality: 4,
      inventoryQuality: 3,
      cleanliness: 4,
      ventilation: 3,
      trainers: 4,
      clientBehavior: 5,
      service: 4
    }
  },
  // Kaunas
  {
    id: 's3',
    clubId: 'SG_VYT',
    timestamp: Date.now() - (2 * 24 * 60 * 60 * 1000),
    ratings: {
      repairSpeed: 5,
      equipmentQuality: 5,
      inventoryQuality: 5,
      cleanliness: 5,
      ventilation: 5,
      trainers: 5,
      clientBehavior: 5,
      service: 5
    }
  },
  {
    id: 's4',
    clubId: 'ALEKS',
    timestamp: Date.now() - (20 * 24 * 60 * 60 * 1000),
    ratings: {
      repairSpeed: 2,
      equipmentQuality: 3,
      inventoryQuality: 2,
      cleanliness: 3,
      ventilation: 2,
      trainers: 4,
      clientBehavior: 4,
      service: 3
    }
  },
  // Historical (Last Quarter)
  {
    id: 's_old_1',
    clubId: 'OGM',
    timestamp: Date.now() - (100 * 24 * 60 * 60 * 1000),
    ratings: {
      repairSpeed: 3,
      equipmentQuality: 4,
      inventoryQuality: 3,
      cleanliness: 4,
      ventilation: 3,
      trainers: 4,
      clientBehavior: 4,
      service: 4
    }
  }
];
