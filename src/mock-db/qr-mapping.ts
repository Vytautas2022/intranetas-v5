export interface QREquipment {
  id: string;
  name: string;
  number: string;
  clubId: string;
}

export interface QRLocation {
  id: string;
  name: string;
  clubId: string;
}

export const qrEquipment: QREquipment[] = [
  { id: "123", name: "Bėgimo takas", number: "T-01", clubId: "akropolis" },
  { id: "456", name: "Dviratis", number: "D-05", clubId: "panorama" }
];

export const qrLocations: QRLocation[] = [
  { id: "wc_men", name: "Vyrų tualetas", clubId: "akropolis" },
  { id: "entrance", name: "Įėjimas", clubId: "panorama" }
];
