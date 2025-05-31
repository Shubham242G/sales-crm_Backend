import { ROLES } from "@common/constant.common";
import { encryptPassword } from "@helpers/bcrypt";
import { User } from "@models/user.model";

export const adminSeeder = async () => {
  console.log("Seeding admin checking...");
  try {
    const encryptedPassword = await encryptPassword("123456");
    const adminExist = await User.findOne({ role: ROLES.ADMIN }).exec();
    if (adminExist) {
      return "Admin already exists";
    }

    await new User({
      name: "Admin",
      email: "admin@admin.com",
      password: encryptedPassword,
      role: ROLES.ADMIN,
      approved: true,
    }).save();
  } catch (error) {
    console.error(error);
  }
};

