const AWS = require('aws-sdk');
const fs = require('fs');

// Create an S3 client
const s3 = new AWS.S3();

// Define the name of your S3 bucket and key for the uploaded file
const bucketName = 'my-bucket';
const keyName = 'my-file.txt';

// Define the name of your DynamoDB table and the name of the field to query
const tableName = 'my-table';
const fieldName = 'error_message';

// Define the keyword to search for in the file
const keyword = 'error';

// Read the contents of the file
const fileContent = fs.readFileSync('my-file.txt', 'utf8');

// Split the contents of the file into an array of lines
const lines = fileContent.split('\n');

// Find the latest line containing the keyword
let matchingLine = null;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].toLowerCase().includes(keyword)) {
    matchingLine = lines[i];
    break;
  }
}

// If a matching line was found, fetch related items from DynamoDB
if (matchingLine) {
  // Construct the query expression to search for matching items in DynamoDB
  const expression = '#field = :value';
  const attributeNames = { '#field': fieldName };
  const attributeValues = { ':value': { S: matchingLine } };
  const params = {
    TableName: tableName,
    KeyConditionExpression: expression,
    ExpressionAttributeNames: attributeNames,
    ExpressionAttributeValues: attributeValues
  };

  // Create a DynamoDB client
  const dynamodb = new AWS.DynamoDB();

  // Query the DynamoDB table for matching items
  dynamodb.query(params, (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    // Print the matching items
    console.log('Matching items:');
    data.Items.forEach((item) => {
      console.log(item);
    });
  });
} else {
  console.log('No matching lines found in file');
}

// Upload the file to S3
const uploadParams = { Bucket: bucketName, Key: keyName, Body: fileContent };

s3.upload(uploadParams, (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log(`File uploaded to S3 at ${data.Location}`);

  // Now that the file is uploaded, we can analyze it for errors
  if (matchingLine) {
    console.log(`Matching line: ${matchingLine}`);

    // Print the 5 lines before the matching line
    const startIndex = Math.max(0, lines.indexOf(matchingLine) - 5);
    const beforeLines = lines.slice(startIndex, lines.indexOf(matchingLine));
    console.log('Lines before:');
    beforeLines.forEach((line) => {
      console.log(line);
    });

    // Print the 5 lines after the matching line
    const endIndex = Math.min(lines.length - 1, lines.indexOf(matchingLine) + 5);
    const afterLines = lines.slice(lines.indexOf(matchingLine) + 1, endIndex + 1);
    console.log('Lines after:');
    afterLines.forEach((line) => {
      console.log(line);
    });
  } else {
    console.log('No matching lines found in file');
  }
});
