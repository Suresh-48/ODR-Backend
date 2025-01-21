import { Router } from "express";
const router = Router();

import {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
} from "../controllers/blogController.js";

import {
  authenticateToken,
  authorizeRoles,
} from "../utils/tokenAuthentication.js";


router.route("/create").post(createBlog);


router.route("/update/:id").put(authenticateToken, authorizeRoles, updateBlog);


router.route("/delete/:id").delete(authenticateToken, authorizeRoles, deleteBlog);


router.route("/get/all").get(authenticateToken,authorizeRoles,getAllBlogs);


router.route("/:id").get(authenticateToken,authorizeRoles,getBlogById);


export default router;
