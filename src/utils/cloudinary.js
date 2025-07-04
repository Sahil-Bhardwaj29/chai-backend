import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
    
});

const uploadOnCloudinary= async(localFilePath)=>{
  try {
    if(!localFilePath) return null
    //upload the file
    const response = await cloudinary.uploader.upload(localFilePath,{
      resource_type: "auto"
    })
    // file has been uploaded successfully
    
    // console.log("file has been uploaded on cloudinary",response.url);
    fs.unlinkSync(localFilePath)

    return response
  } catch (error) {
    fs.unlinkSync(localFilePath) 
    // remove the locally saved temp file as the uploader operation got failed
    return null
  }
}

const deleteFromCloudinary = async (publicId) => {
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return null;
  }
};

export {uploadOnCloudinary,deleteFromCloudinary}