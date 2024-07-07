import { AddOrderDetail } from "./orderDetail.model";

//guest
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
//manager
export interface ManagerOrder {
  orderId: number;
  orderDate: Date;
  status: number;
  recevingOrder:Date;
  accountId:number;
  tableIds: ListTables[];
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
export interface AddNewOrder {
  guestPhone: string | null;
  email: string;
  addressId: number | null;
  guestAddress: string;
  consigneeName: string;
  orderDate: Date | null;
  status: number;
  recevingOrder: Date | null;
  totalAmount: number;
  deposits: number;
  note: string;
  type: number;
  orderDetails: AddOrderDetail[];
}
export interface ListTables {
  tableId: number;
}

