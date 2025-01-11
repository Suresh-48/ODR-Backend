import { Router } from "express";
const router = Router();

import { registerUser,loginUser } from "../controllers/userController.js";
import {authenticateAndRefresh} from "../utils/tokenAuthentication.js";
import { authenticateToken, authorizeRoles } from '../utils/tokenAuthentication.js';

router.route("/signup").post(registerUser);
router.route("/login").post(loginUser);

// Protected route
router.get('/protected', authenticateAndRefresh, (req, res) => {
    res.status(200).json({ message: 'Access granted', user: req.user });
  });



  // Example: Protected route for ClaimantAdmin only
router.get(
    '/admin/dashboard',
    authenticateToken,
    authorizeRoles('ClaimantAdmin'),
    (req, res) => {
      res.json({ message: 'Welcome to the admin dashboard!' });
    }
  );
  
  // Example: Arbitrator-specific route
  router.get(
    '/arbitrator/dashboard',
    authenticateToken,
    authorizeRoles('Arbitrator'),
    (req, res) => {
      res.json({ message: 'Welcome to the arbitrator dashboard!' });
    }
  );


  



export default router;
