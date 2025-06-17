// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: './.env' })
console.log("🔥 Step 1: Starting app")


connectDB()
.then(()=>{
  console.log("✅ Step 2: DB Connected. Now starting server...")
  app.listen(process.env.PORT || 3000,()=>{
    console.log(`server is running at port: ${process.env.PORT}`)
  })
})
.catch((err)=>{
  console.log("❌ MONGODB Connection failed !!",err)
})





/*

import express from "express"
const app=express()

;( async()=>{
  try{
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

    app.on("error",(error)=>{
      console.log("ERR: ",error)
      throw error
    })
    app.listen(process.env.PORT,()=>{
      console.log(`App is listening on port ${process.env.PORT}`)
    })
  }catch(error){
    console.log("ERROR: ",error)
    throw error
  }
})()

*/  
