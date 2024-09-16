export interface TableReservationResponse {
  reservationTime: string[];
  currentDayReservationTables: Table[];
  allTables: Table[];
}

export interface Table {
  tableId: number;
  status: number;
  capacity: number;
  floor: string;
  lable:string;
  reservationTime: string | null;
}

export interface Tables {
  tableId: number;
  status: number;
  capacity: number;
  floor: string;
  lable: string;
}
