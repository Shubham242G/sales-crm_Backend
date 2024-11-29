var multer = require('multer');

// ////////////////////////multer configs
// var storage = multer.diskStorage({
//     destination: function (req: any, file: any, cb: any) {
//         console.log("mflfwf")
//         cb(null, 'public/uploads/')
//     },
//     filename: function (req: any, file: any, cb: any) {
//         console.log("mflfwf")

//         cb(null, file.fieldname + '-' + Date.now() + `.${file.mimetype.split('/')[1]}`)
//     }
// })

// var upload = multer({ storage: storage })
// export default upload;
const storage = multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
        cb(null, 'public/uploads/');
    },
    filename: function (req: any, file: any, cb: any) {
        cb(null, file.fieldname + '-' + Date.now() + `.${file.mimetype.split('/')[1]}`);
    }
});

const upload = multer({ storage: storage });

export default upload;
