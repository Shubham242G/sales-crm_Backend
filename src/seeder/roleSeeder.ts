import { Roles } from "@models/roles.model";

export const roleSeeder = async () => {
  console.log("Check it is working");
  try {
    const adminExist = await Roles.findOne({ roleName: "ADMIN" }).exec();
    if (adminExist) {
      return "Admin already exists";
    }

    await new Roles({
      roleName: "ADMIN",
      description: "Admin Role",
      name: "admin",
      email: "admin@admin.com",
      phoneNo: "9999999999",
      designation: "Administrator",
      department: "Administrator",
      routePermissions: [
        {
          routeName: "User",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Roles",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Vendors",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "RFPS",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Quotes from Vendors",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Confirmed Quotes",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Purchase Contacts",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Leads",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Customers",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Quotes for Customer",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Enquiry",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Confirmed Quotes",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Invoices",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Customer Outstanding",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Sales Contacts",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Task Management",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "My Tasks",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Add Department",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Add Category",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Add Hotel",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Add Banquet",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Add Resturant",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          },
        },
        {
          routeName: "Venue Search",
          permissions: {
            create: true,
            updatet: true,
            delete: true,
            view: true,
          }
        }
      ],
    }).save();
  } catch (error) {
    console.error(error);
  }
};
