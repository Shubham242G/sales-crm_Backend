import { adminSeeder } from "./adminSeeder";
import { roleSeeder } from "./roleSeeder";

export const seedData = () => {
  adminSeeder();
  roleSeeder();
};
