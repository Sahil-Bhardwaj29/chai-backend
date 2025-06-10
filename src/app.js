import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app= express()
app.use(cors({
  origin:process.env.CORS_ORIGIN,
  Credential: true
}))//.use is for middleware

//limit of data in json
app.use(express.json({limit: "16kb"}))
//url config
app.use(express.urlencoded({extended: true,limit: "16kb"}))
//store files/folder
app.use(express.static("public"))
app.use(cookieParser())

export {app}