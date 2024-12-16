import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { errorHandler, routeNotFound } from "./middlewares/errorMiddlewares.js"; // Adjust path if needed
import routes from "./routes/index.js"; // Adjust path if needed
import { dbConnection } from "./utils/index.js"; // Adjust path if needed

// Load environment variables from .env file
dotenv.config();

// Establish database connection
dbConnection();

// Set the port from environment or default to 5000
const PORT = process.env.PORT || 5000;

// Initialize express app
const app = express();

// Set up CORS to allow requests from a specific frontend URL
app.use(
  cors({
    origin: ["https://tms-frontend-nl8w.onrender.com"], // Adjust to your frontend URL
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true, // Allow credentials (cookies, headers)
  })
);

// Middleware to parse incoming JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to parse cookies
app.use(cookieParser());

// Logging HTTP requests
app.use(morgan("dev"));

// Root route to handle requests to "/"
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

// API routes
app.use("/api", routes);

// Middleware for handling 404 errors (not found)
app.use(routeNotFound);

// Error handling middleware for general errors
app.use(errorHandler);

// Create server and bind to port
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});

// Graceful shutdown handling for SIGTERM (when the service is stopped or restarted)
process.on('SIGTERM', () => {
  console.log("SIGTERM received, shutting down gracefully.");
  server.close(() => {
    console.log("Closed out remaining connections.");
    process.exit(0);
  });
});
