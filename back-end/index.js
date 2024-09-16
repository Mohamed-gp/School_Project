import express from "express";
import dotenv from "dotenv";
import {
  jwtVerify,
  jwtVerifyAdmin,
  jwtVerifyUser,
} from "./middleware/jwtVerify.js";
import cookieParser from "cookie-parser";
import geminiRouter from "./routes/gemini.js";
import subscribeRouter from "./routes/subscribe.js";
import authRouter from "./routes/auth.js";
// import originChecker from "./middleware/originChecker.js";
// import corsOptions from "./config/corsOptions.js";
import { createServer } from "http";
import { socketServer } from "./socket/socket.js";
import HostRouter from "./routes/host.js";
import HomesRouter from "./routes/home.js";
import MessagesRouter from "./routes/messages.js";
import ReservationRouter from "./routes/reservation.js";
import AdminRouter from "./routes/admin.js";
import chargilyRouter from "./routes/chargily.js";
// import verifyRoles from "./middleware/roleChecker.js";
import cors from "cors";
import usersRouter from "./routes/users.js";
import hpp from "hpp";
import helmet from "helmet";
import xss from "xss-clean";
import rateLimiting from "express-rate-limit";
import cloudinary from "cloudinary";
import { errorHandler, notFound } from "./middleware/error.js";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(
  cors({
    credentials: true,
    origin:
      process.env.NODE_ENV == "development"
        ? "http://localhost:3500"
        : "someurl",
  })
);

const server = createServer(app);

// app.use(originChecker);

// app.use(cors(corsOptions));

// const corsOptions = {
//   origin: "https://krilli-x86.netlify.app/",
//   credentials: true, // Allow credentials (cookies) to be sent
//   optionsSuccessStatus: 200,
// };

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.use(cookieParser());

app.use(hpp());

// // security headers
app.use(helmet());
// // prevent xss attack

app.use(xss());

app.use(
  rateLimiting({
    windowMs: 10 * 60 * 1000,
    max: 200,
  })
);

app.get("/", (req, res) => {
  res.json("Hello World");
});

app.use("/subscribe", subscribeRouter);
app.use("/gemini", geminiRouter);
app.use("/auth", authRouter);
app.use("/chargily", chargilyRouter);

// app.use(jwtVerify);

const io = socketServer(server);
app.use((req, res, next) => {
  res.io = io;
  next();
});
app.use("/users", usersRouter);
app.use("/host", jwtVerify, HostRouter);

app.use("/homes", HomesRouter);

app.use("/messages", jwtVerify, MessagesRouter);

app.use("/reservations", jwtVerify, ReservationRouter);

app.use("/admin", jwtVerify, jwtVerifyAdmin, AdminRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.use(notFound);
app.use(errorHandler);
