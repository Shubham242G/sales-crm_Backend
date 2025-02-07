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
    routePermissions: RoutePermission[];
  }
  
  // Permissions for each route
  interface RoutePermission {
    routeName: string;
    permissions: Permissions;
  }

const rolesSchema = new mongoose.Schema({
    roleName: String,
    description: String,
    routePermissions: [
    ] as RoutePermission[],
    
});



export const Roles = model<IRoles>("Roles", rolesSchema);