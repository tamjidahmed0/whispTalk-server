// import multer from "multer";
// import { bucket } from "../config/firebase.config.js";

// const MediaUploadMiddleware = (req, res, next) => {

//   // console.log(JSON.parse(req.body.jsonData), 'req.body.jsonData')

//   // Configure multer to handle multiple files
//   const upload = multer({
//     storage: multer.memoryStorage(),
//     limits: { fileSize: 10 * 1024 * 1024 }, // Limit: 200MB per file
//     fileFilter: (req, file, cb) => {
//       if (
//         file.mimetype === "image/png" ||
//         file.mimetype === "image/jpeg" ||
//         file.mimetype === "image/jpg"
//       ) {
//         cb(null, true);
//       } else {
//         cb(new Error("Only .png, .jpg, and .jpeg formats are allowed!"));
//       }
//     },
//   }).fields([
//     { name: "images", maxCount: 4 }, // Allow up to 4 images
//     { name: "audio", maxCount: 2 },  // Allow up to 2 audio files
//   ]);

//   upload(req, res, async (err) => {
//     if (err) {
//       console.error(err);
//       return res.status(400).json({ msg: err.message });
//     }

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ msg: "No files uploaded" });
//     }

//     try {
//       const uploadedUrls = [];
//       const uploadPromises = req.files.map((file) => {
//         const uploadFolder = "uploads"; // The folder where you want to store the files
//         const fileName = `${req.params.id}-${Date.now()}`; // Unique file name
//         const folderPath = `${uploadFolder}/media/${req.params.id}`; // Folder structure inside Firebase Storage

//         const firebaseFile = bucket.file(`${folderPath}${fileName}`);
//         const stream = firebaseFile.createWriteStream({
//           metadata: {
//             contentType: file.mimetype,
//           },
//         });

//         return new Promise((resolve, reject) => {
//           stream.on("error", (err) => {
//             console.error(err);
//             reject(new Error("Failed to upload file"));
//           });

//           stream.on("finish", async () => {
//             try {
//               await firebaseFile.makePublic();
//               const publicUrl = `https://storage.googleapis.com/${bucket.name}/${firebaseFile.name}`;
//               uploadedUrls.push(publicUrl);
//               resolve(publicUrl);
//             } catch (error) {
//               console.error(error);
//               reject(new Error("Error making file public"));
//             }
//           });

//           stream.end(file.buffer);
//         });
//       });

//       // Wait for all files to be uploaded
//       await Promise.all(uploadPromises);
      

//       // Attach the uploaded URLs to the request object for the next middleware/controller
//       req.fileUrls = uploadedUrls;
      
//       next();
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ msg: "Error uploading files" });
//     }
//   });
// };

// export default MediaUploadMiddleware;






import multer from "multer";
import { bucket } from "../config/firebase.config.js";

const MediaUploadMiddleware = (req, res, next) => {
  // Configure multer to handle multiple file types
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit: 10MB per file
    fileFilter: (req, file, cb) => {
      if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "audio/mpeg" || // Allow MP3 files
        file.mimetype === "audio/wav"    // Allow WAV files
      ) {
        cb(null, true);
      } else {
        cb(new Error("Only .png, .jpg, .jpeg, .mp3, and .wav formats are allowed!"));
      }
    },  
  }).fields([
    { name: "images", maxCount: 4 }, // Allow up to 4 images
    { name: "audio", maxCount: 2 },  // Allow up to 2 audio files
  ]);

  upload(req, res, async (err) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ msg: err.message });
    }

    const uploadedUrls = [];

    try {
      const files = [...(req.files?.images || []), ...(req.files?.audio || [])];

      if (files.length === 0) {
        return res.status(400).json({ msg: "No files uploaded" });
      }

      const uploadPromises = files.map((file) => {
        const isImage = file.mimetype.startsWith("image/");
        const isAudio = file.mimetype.startsWith("audio/");
        const uploadFolder = isImage ? "images" : isAudio ? "audio" : "others";

        const fileName = `${req.params.id}-${Date.now()}-${file.originalname}`; // Unique file name
        const folderPath = `${uploadFolder}/${req.params.id}/`; // Folder structure inside Firebase Storage

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

      // Attach the uploaded URLs to the request object for the next middleware/controller
      req.fileUrls = uploadedUrls;

      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ msg: "Error uploading files" });
    }
  });
};

export default MediaUploadMiddleware;



