import { webLogin,
    addUser,
    approveUserById,
    deleteUserById,
    getAllUsers,
    getProfile,
    getUserById,
    refreshToken,
    registerUser,
    updateProfile,
    updateUserById,
    uploadDocuments,
 } from '@controllersv1/user.controller';
import { authorizeJwt } from '@middlewares/auth.middleware';
import { upload } from '@middlewares/multer.middleware';
import express from 'express';

const router = express.Router();

router.post('/login', webLogin)


// Route for user registration
router.post("/register", registerUser);

// Route for adding a new user (restricted by JWT authorization)
router.post("/addUser", authorizeJwt, addUser);

// Route for getting all users
router.get("/getAllUsers",authorizeJwt, getAllUsers);

// Route for deleting a user by ID
router.delete("/deleteUserById/:userId", authorizeJwt, deleteUserById);

router.post('/refreshToken',refreshToken);
// Route for approving a user by ID
router.patch("/approveUserById/:userId",authorizeJwt, approveUserById);

// Route for uploading documents for a user
router.post("/upload-documents/:userId",authorizeJwt, upload.single("file"), uploadDocuments);

// Route for getting user profile (restricted by JWT authorization)
router.get("/getProfile", authorizeJwt, getProfile);

// Route for updating user profile (restricted by JWT authorization)
router.patch("/updateProfile", authorizeJwt, updateProfile);

// Route for getting a user by ID
router.get("/getById/:id",  authorizeJwt, getUserById);

// Route for updating a user by ID
router.patch("/updateById/:id", authorizeJwt, updateUserById);

// Exporting the router instance to make it available for use in other modules
export default router;