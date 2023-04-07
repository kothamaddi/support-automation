const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

const app = express();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: 'your_access_key',
  secretAccessKey: 'your_secret_key',
  region: 'your_region' // replace with your preferred region
});

// Create an S3 client
const s3 = new AWS.S3();

// Configure multer middleware to handle file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB file size limit
  }
});

// Define a POST route to handle file uploads
app.post('/upload', upload.single('file'), function (req, res, next) {
  const file = req.file;

  if (!file) {
    return res.status(400).send('No file selected');
  }

  // Create a new S3 object
  const s3Params = {
    Bucket: 'your_bucket_name', // replace with your S3 bucket name
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  // Upload the file to S3
  s3.upload(s3Params, function (err, data) {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }

    // Invoke the Lambda function
    const lambdaParams = {
      FunctionName: 'your_lambda_function_name', // replace with your Lambda function name
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({
        s3Bucket: s3Params.Bucket,
        s3Key: s3Params.Key
      })
    };

    lambda.invoke(lambdaParams, function (err, data) {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }

      // Parse the Lambda function response and display it on the UI
      const response = JSON.parse(data.Payload);
      $('#response').text(response);
      res.send();
    });
  });
});

// Start the server
app.listen(3000, function () {
  console.log('App started on port 3000');
});
