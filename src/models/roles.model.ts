import { model, Model, Schema, Types } from "mongoose";
import mongoose from "mongoose";

interface Permissions {
  create: boolean;
  view: boolean;
  update: boolean;
  delete: boolean;
}

// Role model
interface IRoles {
  roleName: string;
  description: string;
  name: string;
  email: string;
  phoneNo: string;
  designation: string;
  department: string;
  routePermissions: RoutePermission[];
}

// Permissions for each route
interface RoutePermission {
  routeName: string;
  permissions: Permissions;
  isEditing?: boolean;
}

const rolesSchema = new mongoose.Schema({
  roleName: String,
  description: String,
  name: String,
  email: String,
  phoneNo: String,
  designation: String,
  department: String,
  routePermissions: [] as RoutePermission[],
});

export const Roles = model<IRoles>("Roles", rolesSchema);
