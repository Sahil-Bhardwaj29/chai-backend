import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";



const generateAccessAndRefreshTokens = 
  async (userId)=>{
    try {
      const user =  User.findById(userId)
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
  if(!username || !email){
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

  const loggedInUser = User.findById(user._id).select("-password -refreshToken")

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
      user:loggedInUser,accessToken,refreshToken
    },
    "User logged in Successfully"
    )
  )


})

const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{ refreshToken:undefined}
    },
    {
      new:true
    }
  )
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

export {
  registerUser,
  loginUser,
  logoutUser
}