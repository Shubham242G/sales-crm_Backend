// utils/buildRoleHierarchy.ts

import { Roles,IRole } from "../models/roles.model"

export const buildRoleHierarchy = (roles: IRole[]) => {
  const roleMap: Record<string, any> = {}; // To store roles by their _id
  const hierarchy: any[] = [];

  // Map roles by their _id and initialize with necessary fields
  roles.forEach((role) => {
    roleMap[role._id.toString()] = {
      id: role._id.toString(),
      name: role.roleName,
      reportsTo: role.parentRole ? role.parentRole.toString() : null, // Set reportsTo as parentRole _id or null
      description: role.description,
      children: [],
    };
  });

  // Build hierarchy by checking the reportsTo (parentRole) field
  Object.values(roleMap).forEach((role) => {
    if (role.reportsTo && roleMap[role.reportsTo]) {
      roleMap[role.reportsTo].children.push(role); // Add to parent's children
    } else {
      hierarchy.push(role); // Top-level roles (no parent)
    }
  });

  return hierarchy;
};
