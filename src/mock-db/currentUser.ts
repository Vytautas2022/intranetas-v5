import { users } from './users';

const savedId = typeof window !== 'undefined' ? localStorage.getItem('dev_user_id') : null;
const found = savedId ? users.find(u => u.id === savedId) : null;
export const currentUser = found ?? { id: "u3", name: "Admin User", email: "admin@fitsport.lt", role: "OPS" as const, region: "ALL" };
