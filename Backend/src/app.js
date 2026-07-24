if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}

const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")


const app = express()

const allowedOrigins = [
  "http://localhost:5173",
  "https://interviewprep-aifrontend.vercel.app" // Add frontend URL if you deploy it later
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// 💡 Simple route to test if deployment works without crashing
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Backend server is running!" });
});

// Root fallback route
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Welcome to Interview Prep API" });
});

/* require and use routes */
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

module.exports = app;