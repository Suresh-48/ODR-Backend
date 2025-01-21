import Blog from "../models/blogModel.js";
import { getPublicImageUrl, uploadBase64File } from "../utils/s3.js";



async function uploadSingleFile(file) {
  if (file && file.fileName && file.fileData) {
    try {
      const base64Data = file.fileData;
      const fileType = base64Data.split(";")[0].split("/")[1]; 
      const newFileName = file.fileName; 
      const newFilePath = newFileName; 

      
      return new Promise((resolve, reject) => {
        uploadBase64File(base64Data, newFilePath, (err, mediaPath) => {
          if (err) {
            return reject(err); 
          }

          
          resolve({
            documentName: newFileName,
            documentPath: getPublicImageUrl(mediaPath), 
            documentType: fileType, 
            createdAt: new Date(), 
          });
        });
      });
    } catch (error) {
      throw new Error("File upload failed: " + error.message);
    }
  } else {
    throw new Error("Missing file name or data");
  }
}




export async function createBlog(req, res, next) {
  try {
    const { title, content, description } = req.body;
    const {imageUrl} = req.file;
    const userId = req.userId;

    
    const requiredFields = ["title", "content", "description"];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required.` });
      }
    }

    let logoData = null;

   
    if (imageUrl) {
      try {
        logoData = await uploadSingleFile({
          fileName: `blog-${new Date().getTime()}`, 
          fileData: imageUrl,
        });
      } catch (err) {
        return res.status(500).json({ message: "Image upload failed.", error: err.message });
      }
    }

    
    const newRecord = new Blog({
      title,
      content,
      description,
      imageUrl: logoData ? logoData.documentPath : "",
      createdBy: userId,
    });
    
    const savedRecord = await newRecord.save();

    return res.status(201).json({
      status: true,
      message: "Blog created successfully.",
      data: savedRecord,
    });
  } catch (err) {
    next(err);
  }
}


export async function getAllBlogs(req, res, next) {
  try {
    const data = await Blog.find();
    return res.status(200).json({
      status: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBlogById(req, res, next) {
  try {
    const { id } = req.params;

    const data = await Blog.findById(id);
    if (!data) {
      return res.status(404).json({
        status: false,
        message: "Blog not found.",
      });
    }

    return res.status(200).json({
      status: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateBlog(req, res, next) {
  try {
    const { id } = req.params;
    const { title, imageUrl, content, description } = req.body;

    const data = await Blog.findById(id);
    if (!data) {
      return res.status(404).json({
        status: false,
        message: "Blog not found.",
      });
    }

    data.title = title || data.title;
    data.imageUrl = imageUrl || data.imageUrl;
    data.content = content || data.content;
    data.description = description || data.description;

    const updatedRecord = await Blog.save();

    return res.status(200).json({
      status: true,
      message: "Blog updated successfully.",
      data: updatedRecord,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteBlog(req, res, next) {
  try {
    const { id } = req.params;

    const data = await Blog.findById(id);
    if (!data) {
      return res.status(404).json({
        status: false,
        message: "Blog not found.",
      });
    }

    await data.remove();

    return res.status(200).json({
      status: true,
      message: "Blog deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
}
