import { ManagerDish } from "./dish.model";
//guest
export interface Combo{
  comboId:number;
  nameCombo:string;
  price:number;
  note:string;
  imageUrl:string;
}
//manager
export interface ListAllCombo {
  items: ManagerCombo[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
export interface ManagerCombo {
  comboId:number;
  nameCombo:string;
  price: number;
  note:string;
  imageUrl: string;
  isActive: boolean;
  quantityCombo: number;
  dishes: ManagerDish[]
}
export interface DishInCombo {
  dishId: number;
  quantityDish: number;
}

export interface UpdateCombo {
  comboId: number;
  nameCombo: string;
  price: number | null;
  note: string;
  imageUrl: string | null;
  message: string;
  dishes: DishInCombo[] | null; 
}
export interface AddNewCombo{
  nameCombo:string;
  price: number | null | undefined;
  note:string;
  imageUrl: string | null;
  isActive: boolean;
  message: string,
  dishes: DishInCombo[] | null; 
}