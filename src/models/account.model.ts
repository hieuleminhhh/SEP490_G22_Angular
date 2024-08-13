export interface Account{
    username: string;
    password:string;
    token:string;
    role:string;
  }

// account-dto.model.ts
export interface CreateAccountDTO {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  role: string;
  address: string;
  phone: string;
}

export interface UpdateAccountDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  password?: string;
  role?: string;
  address?: string;
  phone?: string;
}

export interface GetAccountDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
  address: string;
  phone: string;
}
