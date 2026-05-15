export interface RegionManager {
  region: string;
  manager: string;
}

export const regionManagers: RegionManager[] = [
  { region: "Vilnius", manager: "Jonas Jonaitis" },
  { region: "Kaunas", manager: "Petras Petraitis" },
  { region: "Klaipėda", manager: "Tomas Kazlauskas" }
];
