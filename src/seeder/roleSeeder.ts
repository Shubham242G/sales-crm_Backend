import { Roles } from "@models/roles.model";

export const roleSeeder = async () => {
  console.log("Seeding role data...");
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
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Roles",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Vendors",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "RFPS",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Quotes from Vendors",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Confirmed Quotes From Vendors",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Purchase Contacts",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Leads",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Customers",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Quotes for Customer",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Enquiry",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Invoice View",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Invoice Pdf View",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Confirmed Quotes Customer",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Invoices",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Customer Outstanding",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Sales Contacts",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Task Management",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "My Tasks",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Add Department",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Add Category",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Add Hotel",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Add Banquet",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Add Resturant",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        },
        {
          routeName: "Venue Search",
          permissions: {
            create: true,
            update: true,
            delete: true,
            view: true,
            isRouteShow: true,
          },
        }]
    }).save();
  } catch (error) {
    console.error(error);
  }
};
