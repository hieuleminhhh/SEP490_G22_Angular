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
  isActive:boolean;
}
export interface AddNewDish{
  itemName: string,
  itemDescription:string,
  price: number,
  imageUrl: string,
  categoryId: string,
  isActive?: boolean;
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
  isActive: boolean;
}