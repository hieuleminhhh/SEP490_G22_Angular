export interface Combo{
  comboId:number;
  nameCombo:string;
  price:number;
  note:string;
  imageUrl:string;
}
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
  price:number;
  note:string;
  imageUrl:string;
  isActive: boolean;
}
export interface UpdateCombo{
  comboId:number;
  nameCombo:string;
  price:number;
  note:string;
  imageUrl:string;
  message: string,
}
export interface AddNewCombo{
  nameCombo:string;
  price:number;
  note:string;
  imageUrl:string;
  isActive: boolean;
  message: string,
}