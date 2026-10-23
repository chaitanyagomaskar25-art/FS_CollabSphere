import express from 'express'
import "dotenv/config"
import { connectDb } from './src/config/db.js'
import { authRouter } from './src/routes/authRoute.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { projectRouter } from './src/routes/projectRoutes.js'
import { geminiRouter } from './src/routes/geminiRoute.js'
import { publicRouter } from './src/routes/publicRoute.js'

const app = express()

app.use(express.json())
app.use(cookieParser())

const allowedOrigin = [
    "http://localhost:5173",
    "https://fs-collab-sphere-mqut.vercel.app"
];

app.use(cors({
    origin: allowedOrigin,
    credentials: true
}));

app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (error) {
    console.error("Database connection error:", error.message);

    return res.status(503).json({
      success: false,
      message: "Database connection failed",
    });
  }
});


app.get("/", (req, res)=>{
    res.json({
        message: "congratulations!!"
    })
})

app.use("/api/auth", authRouter)
app.use("/api/projects", projectRouter)
app.use('/api/public', publicRouter);

app.use("/api/gemini", geminiRouter)



app.listen(process.env.PORT, ()=>{
    console.log(`Sever is running..!!${process.env.PORT}`)
})