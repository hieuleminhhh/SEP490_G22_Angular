export interface Order{
  orderId:number;
  orderDate:Date;
  status:string;
  recevingOrder:Date;
  paymentStatus:string;
  accountId:number;
  tableId:number;
  guestPhone:string;
}
export interface ManagerOrder {
  orderId: number;
  orderDate: Date;
  status: number;
  recevingOrder:Date;
  accountId:number;
  tableId:number;
  invoiceId: number;
  totalAmount: number;
  guestPhone:string;
  deposits:number;
  addressId: number;
  guestAddress: string;
  consigneeName: string;
}
export interface ListAllOrder {
  items: ManagerOrder[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}