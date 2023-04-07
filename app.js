const AWS = require('aws-sdk');
const S3 = new AWS.S3({apiVersion: '2006-03-01'});
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
const BUCKET_NAME = 'your-bucket-name';

function uploadFile() {
  const file = document.getElementById('file-input').files[0];
  const fileName = file.name;

  if (!fileName) {
    alert('Please select a file to upload.');
    return;
  }

  // Show loading spinner
  document.getElementById('loading-spinner').style.display = 'block';

  // Upload file to S3 bucket
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file
  };

  S3.upload(params, function(err, data) {
    if (err) {
      alert('Error uploading file: ' + err);
      return;
    }

    const payload = {
      fileName: fileName
    };

    // Invoke Lambda function to process file
    lambda.invoke({
      FunctionName: 'your-lambda-function-name',
      Payload: JSON.stringify(payload)
    }, function(err, data) {
      if (err) {
        alert('Error invoking Lambda function: ' + err);
        return;
      }

      // Show success message and hide loading spinner
      document.getElementById('success-message').style.display = 'block';
      document.getElementById('loading-spinner').style.display = 'none';
    });
  });
}

document.getElementById('upload-button').addEventListener('click', uploadFile);
