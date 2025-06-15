import mongoose,{ Schema } from "mongoose";
import jwt from "jsonwebtoken";//tokens
import bcrypt from "bcrypt";//encrytion of password

const userSchema = new Schema({
  username:{
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index:true // searchable
  },
  email:{
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullname:{
    type: String,
    unique: true,
    trim: true,
    index: true
  },
  avatar:{
    type: String, // cloudinary url
    required:true
  },
  coverImage:{
    type: String
  },
  watchHistory:{
    type:Schema.Types.ObjectId,
    ref:"Video"
  },
  password:{
    type: String,
    required: [true,'Password is required']
  },
  refreshToken: {
    type: String
  }
},{timestamps: true})

//password encrytion just before save
userSchema.pre("save",async function(next){
  if(this.isModified("password")){
    this.password=bcrypt.hash(this.password, 10)
    next()
  }
  //only save when password is changed
})

//check whether pass is correct using custom methods
userSchema.methods.isPasswordCorrect=async function(password){
  return await bcrypt.compare(
    password,this.password)
}

userSchema.methods.generateAccessToken=function(){
  return jwt.sign(
    {
    _id:this._id,
    email:this.email,
    username:this.username,
    fullname:this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
userSchema.methods.generateRefreshToken=function(){
  return jwt.sign(
    {
    _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User",userSchema)