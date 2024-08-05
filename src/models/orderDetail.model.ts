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
  dishesServed:string;
}
export interface ListOrderDetailByOrder{
  orderId:number;
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
  orderDetails:ListOrderDetail[];
}
export interface AddOrderDetail{
  unitPrice: number;
  quantity: number;
  dishId:number;
  comboId:number;
}