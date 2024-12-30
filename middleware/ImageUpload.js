import multer from "multer";
import { bucket } from "../config/firebase.config.js";

const UploadImages = (req, res, next) => {
  // Configure multer to handle multiple files
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit: 200MB per file
    fileFilter: (req, file, cb) => {
      if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/jpg"
      ) {
        cb(null, true);
      } else {
        cb(new Error("Only .png, .jpg, and .jpeg formats are allowed!"));
      }
    },
  }).array("images", 10); // Allow up to 10 images

  upload(req, res, async (err) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ msg: err.message });
    }
 
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "No files uploaded" });
    }

    try {
      const uploadedUrls = [];
      const uploadPromises = req.files.map((file) => {
        const uploadFolder = "uploads"; // The folder where you want to store the files
        const fileName = `${req.params.id}-${Date.now()}-${file.originalname}`; // Unique file name
        const folderPath = `${uploadFolder}/${req.params.id}/profile/`; // Folder structure inside Firebase Storage

        const firebaseFile = bucket.file(`${folderPath}${fileName}`);
        const stream = firebaseFile.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });

        return new Promise((resolve, reject) => {
          stream.on("error", (err) => {
            console.error(err);
            reject(new Error("Failed to upload file"));
          });

          stream.on("finish", async () => {
            try {
              await firebaseFile.makePublic();
              const publicUrl = `https://storage.googleapis.com/${bucket.name}/${firebaseFile.name}`;
              uploadedUrls.push(publicUrl);
              resolve(publicUrl);
            } catch (error) {
              console.error(error);
              reject(new Error("Error making file public"));
            }
          });

          stream.end(file.buffer);
        });
      });

      // Wait for all files to be uploaded
      await Promise.all(uploadPromises);
      console.log(uploadedUrls, 'upload urls')

      // Attach the uploaded URLs to the request object for the next middleware/controller
      req.fileUrls = uploadedUrls;
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Error uploading files" });
    }
  });
};

export default UploadImages;
