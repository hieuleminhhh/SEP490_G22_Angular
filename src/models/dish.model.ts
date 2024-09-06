//gues
export interface Dish{
  dishId: number;
  itemName:string;
  itemDescription:string;
  price:number;
  discountedPrice:number;
  imageUrl:string;
  categoryId:number;
  discountId:number;
  comboId:number;
  nameCombo:string;
  quantity:number;
  unitPrice:number;
  isActive:boolean;
  totalAmount:number;
}
//manager
export interface AddNewDish{
  itemName: string,
  itemDescription:string,
  price: number | null | undefined;
  imageUrl: string | null;
  categoryId: number,
  isActive?: boolean;
  message: string;
}
export interface UpdateDish{
  dishId: number;
  itemName: string,
  itemDescription:string,
  price: number | null | undefined;
  imageUrl: string | null;
  categoryId: number,
  message: string,
}
export interface ListAllDishes {
  items: ManagerDish[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ManagerDish {
  dishId: number;
  itemName: string;
  itemDescription: string;
  price: number;
  imageUrl: string;
  categoryName: string;
  categoryId: number,
  isActive: boolean;
  discountedPrice: number;
  discountPercentage: number;
  quantityDish: number;
}
