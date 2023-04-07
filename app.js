const AWS = require('aws-sdk');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const multerS3 = require('multer-s3');

const app = express();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: 'your_access_key',
  secretAccessKey: 'your_secret_key',
  region: 'us-east-1' // replace with your preferred region
});

// Create an S3 client
const s3 = new AWS.S3();

// Create a Lambda client
const lambda = new AWS.Lambda();

// Configure multer middleware to handle file uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'your_s3_bucket',
    acl: 'public-read', // or 'private'
    key: function (req, file, cb) {
      cb(null, file.originalname);
    }
  })
});

// Configure express middleware to handle JSON payloads
app.use(bodyParser.json());

// Define a POST route to handle file uploads
app.post('/upload', upload.single('file'), function (req, res, next) {
  // Get the file URL from the request
  const fileUrl = req.file.location;

  // Create a payload for the Lambda function
  const payload = {
    fileUrl: fileUrl
  };

  // Invoke the Lambda function
  lambda.invoke({
    FunctionName: 'your_lambda_function_name',
    Payload: JSON.stringify(payload)
  }, function (err, data) {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      console.log(data);
      res.send(data.Payload);
    }
  });
});

// Start the server
app.listen(3000, function () {
  console.log('App started on port 3000');
});
