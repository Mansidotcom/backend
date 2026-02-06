import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage });

//single upload
export const singleUpload = multer({storage}).single("profilePic")

//multiple upload upto 5 images

export const multipleUpload = multer({ storage }).array("files", 5);

export default upload; 