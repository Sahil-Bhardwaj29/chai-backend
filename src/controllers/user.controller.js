import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";



const generateAccessAndRefreshTokens = 
  async (userId)=>{
    try {
      const user = await User.findById(userId)
      const accessToken =  user.generateAccessToken()
      const refreshToken= user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({validateBeforeSave : false})

      return {accessToken,refreshToken}
    } catch (error) {
      throw new ApiError(500,'Something went wrong while generating tokens')
    }
  }
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
  //          LOGIC             //

  // get user details from frontend
  // username or email
  // check if user exists or not
  // check password
  // generate access and refresh tokens
  // send cookie

const loginUser = asyncHandler(async (req,res)=>{
  // get user details from frontend
  const {email,username,password}=req.body
  
  // username or email
  if(!(username || email)){
    throw new ApiError(400,"username or email is required")
  }

  // check if user exists or not
  const user = await User.findOne({
    $or:[{ username },{ email }]
  })
  if(!user){
    throw new ApiError(404, "User does not exist")
  }

  // check password
  const isPasswordValid =  await user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(401, "Password is incorrect")
  }

  // generate access and refresh tokens
  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser =await User.findById(user._id).select("-password -refreshToken")

  // send cookie
  const options = {
    httpOnly:true,
    secure: true
  }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,{
      user:loggedInUser,
      accessToken,
      refreshToken
    },
    "User logged in Successfully"
    )
  )


})

const logoutUser = asyncHandler(async(req,res)=>{
  //refreshToken clears
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{ refreshToken:undefined}
    },
    {
      new:true
    }
  )

  //clear cookies
  const options = {
    httpOnly:true,
    secure: true
  }
  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User logged out!"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorised request")
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user = await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError("invalid Refresh token")
    }
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError("Refresh token is expired or used")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        { accessToken,
          refreshToken:newRefreshToken
        },
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message ||"Invalid refresh token")
  }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid Password")
  }
  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200,req.user,"Current user fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullname, email} = req.body
  if(!fullname || !email){
    throw new ApiError(400,"Enter all the details")
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname,
        email
      }
    },
    {new: true}
  ).select("-password")
  
  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
  }
  const existingUser  = await User.findById(req.user._id)
  if(!existingUser ){
    throw new ApiError(404,"User not found")
  }
  // delete the existing avatar from cloudinary
  if(existingUser.avatar){
  
    try {
      const parts = existingUser.avatar.split("/");
      const fileName = parts[parts.length - 1]; // avatar_xxx.jpg
      const folder = parts[parts.length - 2];   // avatars (assuming that's your folder)
      const publicId = `${folder}/${fileName.split(".")[0]}`;
      
      // delete the file from cloudinary
      const deleted = await deleteFromCloudinary(publicId);
      if (deleted.result !== "ok") {
        throw new ApiError(500, "Failed to delete old avatar from Cloudinary");
      }
    } 
    catch (error) {
        throw new ApiError(500, error.message || "Cloudinary deletion error");
    }
  }

  // update the user avatar

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        avatar : avatar.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Avatar image updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover image file is missing")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on Cover image")
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        coverImage : coverImage.url
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Cover image updated successfully"))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
}