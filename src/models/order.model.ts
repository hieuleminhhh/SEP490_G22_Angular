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
  type: number;
  recevingOrder:Date;
  accountId:number;
  tableIds: ListTables[];
  invoiceId: number;
  totalAmount: number;
  discountPercent:number;
  guestPhone:string;
  deposits:number;
  addressId: number;
  guestAddress: string;
  consigneeName: string;
  paymentStatus: number;
  paymentMethods: number;
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
  email: string | null;
  addressId: number | null;
  guestAddress: string | null;
  consigneeName: string;
  orderDate: Date | null;
  status: number;
  recevingOrder: string | null;
  totalAmount: number;
  deposits: number;
  note: string;
  type: number;
  orderDetails: AddOrderDetail[];
  paymentTime: string | null;
  paymentAmount: number;
  discountId: number;
  taxcode: string;
  paymentStatus: number;
  amountReceived: number;
  returnAmount: number;
  paymentMethods: number;
  description: string;
  accountId: number | null;
}
export interface ListTables {
  tableId: number;
}
export interface OrderTableDetail {
  tableId: number;
  status: number;
  capacity: number;
  floor: number;
}

export interface ManagerOrderByTableId {
  orderId: number;
  orderDate: Date;
  status: number;
  recevingOrder: Date;
  totalAmount: number;
  guestPhone: string;
  deposits: number;
  guestAddress: string;
  consigneeName: string;
  tables: OrderTableDetail[];
}
export interface OrderItem {
  orderDetailId: number;
  dishId: number;
  comboId: number;
  dish: {
    itemName?: string | null;
    price: number;
    discountedPrice?: number;
    imageUrl: string;
  };
  combo?: {
    comboId: number;
    nameCombo?: string | null;
    price: number;
    imageUrl: string;
    isActive: boolean;
  };
  unitPrice: number;
  dishesServed?: number;
  quantity: number;
}


export interface SelectedItem {
  orderDetailId: number;
  dishId: number;
  comboId: number;
  itemName: string;
  unitPrice: number;
  dishesServed: number;
  price: number;
  discountedPrice?: number;
  quantity: number;
  imageUrl: string;
  totalPrice: number;
}
export interface AddNewOrderResponse {
  message: string;
  orderId: number;
}


