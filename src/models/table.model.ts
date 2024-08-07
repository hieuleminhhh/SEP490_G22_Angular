export interface TableReservationResponse {
  reservationTime: string[];
  currentDayReservationTables: Table[];
  allTables: Table[];
}

export interface Table {
  tableId: number;
  status: number;
  capacity: number;
  floor: number;
  reservationTime: string | null;
}
