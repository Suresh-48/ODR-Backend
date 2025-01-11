import mongoose from "mongoose";
const { connect } = mongoose;
import { config } from "dotenv";
import http from "http";
import express, { json } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import cors from "./corsConfig.js";

const app = express();

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION!!! shutting down....");
  console.error(err.name, err.message);
  process.exit(1);
});

// Load environment variables from .env file
config({
  path: "./.env",
});

// Check if required environment variables are defined
if (!process.env.DATABASE || !process.env.DATABASE_PASSWORD) {
  console.error("Environment variables DATABASE Credentials are required.");
  process.exit(1); // Exit the process with failure code
}

const server = new http.createServer(app);

// Connect the database
// process.env.LOCAL_DATABASE

connect(process.env.DATABASE, {})
  .then((con) => {
    console.log("DB connection Successfully!");
  })
  .catch((err) => {
    console.error("DB connection error:", err.message);
    process.exit(1);
  });

// Start the server
const port = process.env.PORT || 7000;
server.listen(port, () => {
  console.log(`Application is running on port ${port}`);
});

// Listen for connection errors
mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.error("Mongoose connection lost. Please check your network.");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION!!!  shutting down ....");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
// Handle SIGINT (Ctrl+C) gracefully
process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully.");
  mongoose.connection.close(() => {
    console.log("Mongoose connection closed.");
    process.exit(0);
  });
});

// Handle SIGTERM (e.g., Heroku dyno cycling) gracefully
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully.");
  mongoose.connection.close(() => {
    console.log("Mongoose connection closed.");
    process.exit(0);
  });
});

// import routes
import userRoutes from "./routes/userRoutes.js";

app.use(cors);

// Set security HTTP headers
app.use(helmet());

// Limit request from the same API
const limiter = rateLimit({
  max: 150000,
  windowMs: 60 * 60 * 1000,
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: "Too Many Request from this IP, please try again in an hour",
});

app.use("/api", limiter);

// Trust proxy header
app.set("trust proxy", 1); // Replace '1' with 'true' if behind multiple proxies

// Body parser, reading data from body into req.body
app.use(
  json({
    limit: "25MB",
  })
);

// Data sanitization against No sql query injection
app.use(mongoSanitize());

// Data sanitization against XSS(clean user input from malicious HTML code)
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true }));

// routes path define here
app.use("/api/v1/users", userRoutes);

export default app;
