import User from '../models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import {MAX_FAILED_ATTEMPTS,LOCK_TIME} from "../constants/limits.js";
import LoginLog from '../models/userLoginLogsModel.js';


const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '1h';


export async function registerUser(req, res) {
try{
    const data = req.body;
    const { name, email, mobileNumber,password } = req.body;

    const missingFields = [];

    const requiredFields = ["name", "email", "mobileNumber", "password"];

    for (const field of requiredFields) {
      if (!data[field]) {
        missingFields.push(field);
      }
    }

    if (data.name && data.name.length > 150) {
      return res.status(422).json({
        status: false,
        message: "Name cannot exceed 150 characters",
      });
    }

   
    if (data.mobileNumber && !/^\d+$/.test(data.mobileNumber)) {
      return res.status(422).json({
        status: false,
        message: "Mobile number must contain only numbers",
      });
    }


    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = await User.create({ name, email, mobileNumber,password: hashedPassword, role: data.role});

    res.status(201).json({
      message: 'User registered successfully',
      userData,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error registering user',
      error: error.message,
    });
  }
};

// export async function loginUser(req, res) {
//     const { email, password } = req.body;
  
//     try {
//       if (!email || !password) {
//         return res.status(400).json({ message: 'Email and password are required' });
//       }
  
//       const user = await User.findOne({ email });
//       console.log("user@@@.....",user);
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }
  
//       const isPasswordValid = await bcrypt.compare(password, user.password);
//       console.log("isPasswordValid.....",isPasswordValid)
//       if (!isPasswordValid) {
//         return res.status(400).json({ message: 'Invalid credentials' });
//       }
  
//       console.log("user.....",user)
//       console.log("JWT_SECRET......",JWT_SECRET)
//       // Generate a JWT token
//       const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1m' });

//       await User.findByIdAndUpdate(
//         user._id,
//         { sessionToken: token },
//         { runValidators: true, new: true }
//       );


  
//       res.status(200).json({ message: 'Login successful', token });
//     } catch (error) {
//       res.status(500).json({ message: 'Error logging in', error: error.message });
//     }
//   }




export async function loginUser(req, res) {
  const { email, password, role, disclaimerAccepted } = req.body;
  console.log("req....",req)
  const ipAddress = req.ip;

  try {
    if ((!email || !password)) {
        await LoginLog.create({
            email: email || 'unknown',
            ipAddress,
            status: 'failed',
            reason: 'Missing email or password',
          });
      return res.status(400).json({ message: 'Email and password is required' });
    }

    let user = await User.findOne({ email });
 
    if (!user) {
        await LoginLog.create({
            email,
            ipAddress,
            status: 'failed',
            reason: 'User not found',
          });
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isLocked()) {
        await LoginLog.create({
            email,
            ipAddress,
            status: 'failed',
            reason: 'Account locked',
          });
        return res.status(403).json({
          message: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again after 30 minutes or reset your password',
        });
      }


    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {        
        user.failedLoginAttempts += 1;          
        if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockUntil = Date.now() + LOCK_TIME;
          user.failedLoginAttempts = 0;
        }
  
        await user.save();
        await LoginLog.create({
            email,
            ipAddress,
            status: 'failed',
            reason: 'Invalid password',
          });
    
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();

    if (disclaimerAccepted !== true) {
        await LoginLog.create({
            email,
            ipAddress,
            status: 'failed',
            reason: 'Disclaimer not accepted',
          });
      return res.status(400).json({ message: 'You must accept the disclaimer to login.' });
    }
 

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    await User.findByIdAndUpdate(
                user._id,
                { sessionToken: token , 
                loginAt : getLocalTime(), 
                },
                { runValidators: true, new: true }
              );

              await LoginLog.create({
                email,
                ipAddress,
                status: 'success',
              });

    res.status(200).json({
      message: 'Login successful',
      token,
      role: user.role,
    });
  } catch (error) {
    await LoginLog.create({
        email: email || 'unknown',
        ipAddress,
        status: 'failed',
        reason: error.message,
      });
  
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
}
const getLocalTime = () => {
    const localDate = new Date(); // Get the current date and time
    return localDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }); // Replace 'Asia/Kolkata' with your desired timezone
  };

