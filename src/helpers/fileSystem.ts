import fs from "fs";
import path from "path";
import https from 'https';
import http from 'http';
import url from 'url';

export const storeFileAndReturnNameBase64 = async (base64: string, includesFileName: boolean = false) => {
    console.log(base64.slice(0,200), "herr 0")
    let tempBase64 = base64.split("base64,");
    console.log(tempBase64.slice(0,200), "tempBase64 0")

    let extension = tempBase64[0].split("/")[1];
    let filename = new Date().getTime() + `.${extension.split(";")[0]}`;

    if (includesFileName) {
        let { newFilename } = getNewFileName(`./public/uploads/${base64.split("@@")[0]}`);
        console.log(base64.slice(0,200), "herr")
        tempBase64 = base64.split("@@")[1].split(",");
        filename = newFilename;
    }
    return new Promise((resolve, reject) => {
        fs.writeFile(`./public/uploads/${filename}`, tempBase64[1], "base64", (err) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            resolve(filename);
        });
    });
};


export const storeFileAndReturnNameBase64ForExeal = async (base64Data: string) => {
    if (!base64Data) {
        throw new Error("Invalid base64 data");
    }

    // Extract the actual base64 string if it's prefixed with "data:image/png;base64," etc.
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 string format");
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const fileName = `image_${Date.now()}.png`; // Change extension if necessary
    const filePath = path.join(__dirname, '..', 'uploads', fileName);

    await fs.promises.writeFile(filePath, buffer);
    return fileName;
};

function fileExists(filePath: string) {
    return fs.existsSync(filePath);
}
/**
 * ----------------------------------------------------------------------------
 * Function: getNewFileName
 * ----------------------------------------------------------------------------
 * Description:
 * ----------------------------------------------------------------------------
 * Generates a new file path with a unique filename if the original filename
 * already exists. It appends a numerical suffix to the base name of the file.
 *
 * ----------------------------------------------------------------------------
 * Parameters:
 * ----------------------------------------------------------------------------
 * @param {string} originalPath - The original file path.
 *
 * ----------------------------------------------------------------------------
 * Returns:
 * ----------------------------------------------------------------------------
 * @returns {Object} - An object containing the new file path and new filename:
 *                     { newFilePath: string, newFilename: string }
 *
 * ----------------------------------------------------------------------------
 * Example:
 * ----------------------------------------------------------------------------
 * const originalPath = './public/uploads/example.txt';
 * const { newFilePath, newFilename } = getNewFileName(originalPath);
 */
function getNewFileName(originalPath: string) {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);

    let newFilePath = originalPath;
    let counter = 1;
    let newFilename = `${baseName}${ext}`;

    while (fileExists(newFilePath)) {
        newFilePath = path.join(dir, `${baseName} (${counter})${ext}`);
        newFilename = `${baseName} (${counter})${ext}`;
        counter++;
    }

    return { newFilePath, newFilename };
}


export const deleteFileUsingUrl = (url: string) => {
    try {
        if (fileExists("./public" + "/" + url)) {
            fs.unlinkSync("./public" + "/" + url)
        }
    }
    catch (err) {
        return err
    }
}



export async function downloadFile(fileUrl: string) {
    // Parse the URL to get the filename
    const parsedUrl: any = url.parse(fileUrl);
    const filename = path.basename(parsedUrl.pathname);

    // Define the file path
    const filePath = path.join(process.cwd(), "public", "uploads", filename);

    // Make the request and download the file
    const fileStream: any = await new Promise((resolve, reject) => {
        const request = https.get(fileUrl, (response: any) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get file from ${fileUrl}, status code: ${response.statusCode}`));
                return;
            }

            // Create a writable stream
            const stream = fs.createWriteStream(filePath);
            response.pipe(stream);

            stream.on('finish', () => resolve(stream));
            stream.on('error', reject);
        });

        request.on('error', reject);
    });

    await fileStream.close(); // Ensure the stream is closed

    return filename;
}



export const downloadFileHttp = (url: string, filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
  
      protocol.get(url, (response: any) => {
        if (response.statusCode === 200) {
          const file = fs.createWriteStream(filePath);
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(filePath); // Return the final file path
          });
        } else if (response.statusCode === 301 || response.statusCode === 302) {
          // Follow redirect if the response code is 301 or 302
          const newUrl = response.headers.location;
          downloadFileHttp(newUrl, filePath)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error(`Failed to download file: ${response.statusCode}`));
        }
      }).on('error', (err) => {
        console.error(`Error: ${err.message}`);
        reject(err);
      });
    });
  };
  
