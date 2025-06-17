import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app= express()
app.use(cors({
  origin:process.env.CORS_ORIGIN,
  credentials: true
}))//.use is for middleware

//limit of data in json
app.use(express.json({limit: "16kb"}))
//url config
app.use(express.urlencoded({extended: true,limit: "16kb"}))
//store files/folder
app.use(express.static("public"))
app.use(cookieParser())

//routes
app.get("/", (req, res) => {
  res.send("✅ Hello from the backend");
});
import userRouter from "./routes/user.routes.js"
app.use("/api/v1/users",userRouter)
//http://localhost:8000/api/v1/users/register
export {app}