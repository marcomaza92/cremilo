export type UserInfo = {
  id: string;
  first_name?: string;
  last_name?: string;
  birthday?: string;
  age?: number;
  address?: string;
  city?: string;
  country?: string;
  role?: number;
};

export type UserData = {
  data: UserInfo[] | null;
};
