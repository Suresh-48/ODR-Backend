import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'; // For environment variables
dotenv.config(); // Load .env variables
import {INACTIVITY_LIMIT} from "../constants/limits.js";
import User from '../models/userModel.js';


const JWT_SECRET = process.env.JWT_SECRET;

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};


export const authenticateAndRefresh = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if the token is close to expiring (e.g., less than 30 seconds remaining)
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    if (decoded.exp - currentTime < 30) {
      // Generate a new token with an extended expiration time
      const newToken = jwt.sign({ id: decoded.id }, JWT_SECRET, { expiresIn: '1m' });
      res.setHeader('x-refresh-token', newToken); // Send the new token in the response headers
    }

    req.user = decoded; // Attach user info to the request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};






export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token is required or improperly formatted' });
  }

  // Extract the token from the header
  const token = authHeader.split(' ')[1];
  

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'Server error: JWT secret not configured' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    

    const currentTime = Math.floor(Date.now() / 1000);
    const dbUser = await User.findById(user.id); // Fetch user details from the database

    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const loginTime = Math.floor(new Date(dbUser.loginAt).getTime() / 1000);
    console.log("..currentTime....",currentTime);
    console.log("loginTime.....",loginTime);
    const timeDifference = currentTime - loginTime;
    console.log("timeDifference.......",timeDifference);
    console.log("INACTIVITY_LIMIT........",INACTIVITY_LIMIT)


    if (timeDifference > INACTIVITY_LIMIT) {
      return res.status(401).json({
        message: "Session expired due to inactivity. Please log in again.",
      });
    } else {
      // User is active, update `loginAt` to the current time
      dbUser.loginAt = new Date();
      await dbUser.save();
    }

    req.user = { id: dbUser._id, role: dbUser.role }; // Attach updated user data to the request
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}


export function authorizeRoles(...roles) {
  return (req, res, next) => {    
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource' });
    }
    next();
  };
}

const getLocalTime = () => {
  const localDate = new Date(); // Get the current date and time
  return localDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }); // Replace 'Asia/Kolkata' with your desired timezone
};





