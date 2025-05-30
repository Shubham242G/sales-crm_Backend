import { adminSeeder } from "./adminSeeder";
import { roleSeeder } from "./roleSeeder";

export const seedData = () => {

  console.log("Seeding data...");
  adminSeeder();
  roleSeeder();
  console.log("Data seeding completed.");
};
