import { Table } from "./table.model";

//guest
export interface OrderDetail{
  orderDetailId:number;
  unitPrice:number;
  quantity:number;
  note:string;
  dishId:number;
  comboId:number;
  totalAmount:number;
  orderId:number;
  dishesServed:string;
}
//manager
export interface ListOrderDetail{
  orderDetailId:number;
  dishId:number;
  comboId:number;
  nameCombo:string;
  itemName:string;
  unitPrice:number;
  price:number;
  discountedPrice:number;
  quantity:number;
  note:string;
  imageUrl:string;
  dishesServed:number;
}
export interface ListOrderDetailByOrder{
  orderId:number;
  accountId:number;
  orderDate:Date;
  status:number;
  recevingOrder:Date;
  discountId:number;
  tableId:number;
  invoiceId:number;
  totalAmount:number;
  guestPhone:string;
  deposits:number;
  guestAddress:string;
  consigneeName:string;
  type: number;
  discountPercent:number;
  discountName:string;
  quantityLimit:number;
  amountReceived:number;
  returnAmount:number;
  paymentMethods:number;
  paymentStatus:number;
  paymentTime:Date;
  taxcode:string;
  cancelationReason:string;
  orderDetails:ListOrderDetail[];
  tables: Table[];
  staffFirstName:string;
  staffLastName:string;
  refundDate:Date;
  cancelDate:Date;
}
export interface AddOrderDetail{
  unitPrice: number;
  quantity: number;
  dishId:number;
  comboId:number;
}
