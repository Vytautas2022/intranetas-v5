export interface FaultTypeDefinition {
  id: string;
  name: string;
  sla: number;
  priority: string;
  category: "critical" | "emergency" | "normal";
  sopUrl?: string;
}

export const faultTypes: FaultTypeDefinition[] = [
  { id: "water_machine", name: "Neveikia vandens aparatas", sla: 24, priority: "high", category: "critical" },
  { id: "solarium", name: "Neveikia soliariumas", sla: 24, priority: "high", category: "critical" },
  { id: "lymph", name: "Neveikia limfodrenažas", sla: 24, priority: "high", category: "critical" },
  { id: "women_sauna", name: "Neveikia moterų sauna", sla: 24, priority: "high", category: "critical" },
  { id: "men_sauna", name: "Neveikia vyrų sauna", sla: 24, priority: "medium", category: "critical" },
  { id: "nordic_sauna", name: "Neveikia šiaurės sauna", sla: 24, priority: "medium", category: "critical" },
  { id: "hvac", name: "Neveikia vėdinimas / šildymas / temperatūra", sla: 24, priority: "medium", category: "critical" },
  { id: "no_water", name: "Dingo vanduo", sla: 24, priority: "medium", category: "critical" },
  { id: "no_hot_water", name: "Nėra karšto vandens", sla: 24, priority: "medium", category: "critical" },
  { id: "wc", name: "Neveikia wc", sla: 24, priority: "medium", category: "critical" },
  { id: "internet", name: "Dingo internetas", sla: 12, priority: "high", category: "critical" },
  { id: "terminal", name: "Neveikia įėjimo terminalas", sla: 12, priority: "high", category: "critical" },
  { id: "cleaner", name: "Darbe nepasirodė valytoja", sla: 12, priority: "high", category: "critical" },
  { id: "building_damage", name: "Žala pastatui", sla: 6, priority: "high", category: "emergency" },
  { id: "injury", name: "Susižalojo klientas", sla: 12, priority: "medium", category: "emergency" },
  { id: "electricity", name: "Dingo elektra", sla: 6, priority: "high", category: "emergency" },
  { id: "locked_person", name: "Užstrigo žmogus", sla: 6, priority: "critical", category: "emergency" },
  { id: "flood", name: "Užliejo vanduo", sla: 6, priority: "high", category: "emergency" },
  { id: "other", name: "Kitas gedimas", sla: 96, priority: "low", category: "normal" }
];
