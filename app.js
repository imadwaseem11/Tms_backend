import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { errorHandler, routeNotFound } from "./middlewares/errorMiddlewaves.js";
import routes from "./routes/index.js";
import { dbConnection } from "./utils/index.js";

dotenv.config();

dbConnection();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(
  cors({
    origin: ["https://tmsfrontend-jh1l.onrender.com"],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(morgan("dev"));

// Root route to handle requests to "/"
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

// API routes
app.use("/api", routes);

// Middleware for handling 404 errors
app.use(routeNotFound);

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
