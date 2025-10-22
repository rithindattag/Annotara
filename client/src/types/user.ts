export type UserRole = 'Annotator' | 'Reviewer' | 'Admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}
