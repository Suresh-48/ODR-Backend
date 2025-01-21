import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import mime from "mime-types";

// Config File
import {
  awsRegion,
  awsAccessKeyId,
  awsSecretAccessKey,
  awsBucketName,
} from "../config.js";

/**
 * Update AWS Config
 */

AWS.config.update({
  accessKeyId: awsAccessKeyId,
  secretAccessKey: awsSecretAccessKey,
});

const s3 = new AWS.S3();

/**
 * Get Public Image Url
 *
 * @param {*} filePath
 * @returns
 */

export function getPublicImageUrl(filePath) {
  return `https://${awsBucketName}.s3.${awsRegion}.amazonaws.com/${filePath}`;
}

/**
 * Upload Base64 To File
 *
 * @param base64
 * @param newPath
 * @param callback
 */

export function uploadBase64File(base64, newPath, callback) {
  const buffer = Buffer.from(
    base64.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const params = {
    Bucket: awsBucketName,
    Key: newPath,
    Body: buffer,
    ContentEncoding: "base64",
    ContentType: "image/png",
    ACL: "public-read",
  };

  const extension = path.extname(newPath);

  const newFilePath = `${path.basename(newPath, extension)}${extension}`;

  params.Key = newFilePath;

  s3.putObject(params, (err) => {
    if (err) {
      return callback(err);
    }
    return callback(null, newPath);
  });
}

