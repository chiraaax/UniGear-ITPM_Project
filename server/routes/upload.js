const express = require("express");
const router = express.Router();
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Generate signed URL
router.post("/generate-url", async (req, res) => {
  try {
    const { fileName, fileType } = req.body;

    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `items/${Date.now()}-${safeFileName}`;

    if (!fileType.startsWith("image/")) {
      return res.status(400).json({
        message: "Only image files are allowed",
      });
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    };

    const signedUrl = await s3.getSignedUrlPromise("putObject", params);

    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    res.json({ signedUrl, publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
});

module.exports = router;
