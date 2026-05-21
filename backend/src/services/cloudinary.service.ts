import cloudinary from "../config/cloudinary";

export const uploadImageToCloudinary = async (
  filePath: string,
  folder = "moodsnap"
) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder
  });

  return result.secure_url;
};