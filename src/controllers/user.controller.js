import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

  //          LOGIC             //

  //get user details from frontend
  // validation
  // check if user already exists
  //check for images,check for avatar
  //upload them to cloudinary
  //create user object - create entry in DB
  //remove password and refreshToken field from response
  //check for user creation
  //return response

const registerUser=asyncHandler(async (req,res)=>{
  // res.status(200).json({
  //   message:"ok"
  // })

  const {fullname,email,username,password}=req.body
  console.log("✅ RegisterUser called with:", req.body);

  //Validation
  if(
    [fullname,email,username,password].some((field)=>field?.trim()==="")
  ){
    throw new ApiError(400,"All fields are required")
  }

  // check if user already exists
  const existedUser = await User.findOne({
    $or:[{ username },{ email }]
  })
  if(existedUser){
    throw new ApiError(409, "User with same username/email already existed")
  }

  //check for images,check for avatar

  console.log(req.files)
  const avatarLocalPath = req.files?.avatar[0]?.path
  // const coverImageLocalPath= req.files?.coverImage[0]?.path
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0 ){
    coverImageLocalPath=req.files.coverImage[0].path
  }
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
  }
  
  //upload to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400,"Avatar file is required")
  }

  //create user object - create entry in DB
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  //remove password and refreshToken field from response
  const createdUser =await User.findById(user._id).select(
    "-password -refreshToken"
  )

  //check for user creation
  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering a user")
  }

  //return response
  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered Successfully")
  )

})

export {registerUser}