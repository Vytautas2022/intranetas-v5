
export interface ExcelRow {
  task_number: string;
  task_name: string;
  sop_link?: string;
  responsible: "Miglė" | "Tomas";
  club_name: string;
  monthly_data: {
    [month: number]: "V" | "X" | ""; // V = Green/Completed, X = Red/New
  };
}

export const mockExcelData: ExcelRow[] = [
  {
    task_number: "P-001",
    task_name: "Vandens tyrimai (mikrobiologinis)",
    sop_link: "https://sop.fitsport.com/water-test",
    responsible: "Miglė",
    club_name: "SportGates Vytauto",
    monthly_data: {
      1: "V", 2: "V", 3: "V", 4: "V", 5: "X"
    }
  },
  {
    task_number: "P-001",
    task_name: "Vandens tyrimai (mikrobiologinis)",
    sop_link: "https://sop.fitsport.com/water-test",
    responsible: "Tomas",
    club_name: "SportGates Kaunas",
    monthly_data: {
      1: "V", 2: "V", 3: "V", 4: "X", 5: "X"
    }
  },
  {
    task_number: "P-002",
    task_name: "Gesintuvų patikra",
    sop_link: "https://sop.fitsport.com/fire-extinguisher",
    responsible: "Miglė",
    club_name: "SportGates Vytauto",
    monthly_data: {
      1: "V", 2: "V", 3: "V", 4: "V", 5: "V"
    }
  },
  {
    task_number: "P-002",
    task_name: "Gesintuvų patikra",
    sop_link: "https://sop.fitsport.com/fire-extinguisher",
    responsible: "Tomas",
    club_name: "SportGates Kaunas",
    monthly_data: {
      1: "V", 2: "V", 3: "V", 4: "V", 5: "X"
    }
  },
  {
    task_number: "P-003",
    task_name: "Vėdinimo filtrų keitimas",
    sop_link: "https://sop.fitsport.com/hvac-filters",
    responsible: "Miglė",
    club_name: "Ozas Gym",
    monthly_data: {
      1: "V", 2: "X", 3: "V", 4: "V", 5: "X"
    }
  }
];
