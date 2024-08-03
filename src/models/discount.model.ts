export interface Discount {
  discountId: number;
  discountName: string;
  discountPercent: number;
  discountStatus: boolean;
  type: number;
  startTime: string;
  endTime: string;
  note?: string;
  totalMoney: number;
  quantityLimit: number;
}
