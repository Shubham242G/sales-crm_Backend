// models/roleHierarchy.model.ts

import mongoose, { Schema, Document, Types } from "mongoose";

interface Permissions {
  create: boolean;
  view: boolean;
  update: boolean;
  delete: boolean;
}

interface RoutePermission {
  routeName: string;
  permissions: Permissions;
  isEditing?: boolean;
}

export interface IRole extends Document {
  roleName: string;
  description: string;
  name: string;
  email: string;
  
  phoneNo: string;
  designation: string;
  department: string;
  routePermissions: RoutePermission[];
  parentRole?: Types.ObjectId | null;
}

const roleSchema = new Schema<IRole>({
  roleName: { type: String, required: true },
  description: { type: String },
  name: { type: String, required: true },
  email: { type: String },
  phoneNo: { type: String },
  designation: { type: String },
  department: { type: String },
  routePermissions: [{ type: Schema.Types.Mixed, required: true }],
  parentRole: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null }, // Refers to the parent role (reportsTo)
});

export const Roles = mongoose.model<IRole>("Role", roleSchema);
