// AWS SDK configuration
AWS.config.update({
    region: "us-eat-2",
});

// Lambda function name
var lambdaFunctionName = "myfunction";

// S3 bucket name
var s3BucketName = "cx-ssues";

// S3 object key prefix
var s3ObjectKeyPrefix = "eb-engine.log";

// DynamoDB table name
var dynamoDBTableName = "error_lookup";

// Get references to DOM elements
var fileInput = document.getElementById("fileInput");
var uploadButton = document.getElementById("uploadButton");
var progressBar = document.getElementById("progressBar");
var progress = document.getElementById("progress");
var progressText = document.getElementById("progressText");
var status = document.getElementById("status");

// Add event listener to the upload button
uploadButton.addEventListener("click", function () {
    // Disable the upload button to prevent multiple uploads
    uploadButton.disabled = true;

    // Show the progress bar
    progressBar.style.display = "block";

    // Create an S3 object
    var s3 = new AWS.S3({
        params: { Bucket: s3BucketName },
    });

    // Set the S3 object key to the current timestamp
    var timestamp = new Date().getTime();
    var s3ObjectKey = s3ObjectKeyPrefix + "_" + timestamp;

    // Upload the selected file to S3
    var file = fileInput.files[0];
    var params = { Key: s3ObjectKey, Body: file };
    s3.upload(params)
        .on("httpUploadProgress", function (evt) {
            // Update the progress bar as the file uploads
            var percentComplete = Math.round((evt.loaded / evt.total) * 100);
            progress.style.width = percentComplete + "%";
            progressText.innerText = percentComplete + "%";
        })
        .send(function (err, data) {
            if (err) {
                // Display an error message if the upload fails
                status.innerText = "Error: " + err.message;
            } else {
                // Call the Lambda function to process the uploaded file
                var lambda = new AWS.Lambda();
                var params = {
                    FunctionName: lambdaFunctionName,
                    Payload: JSON.stringify({
                        s3BucketName: s3BucketName,
                        s3ObjectKey: s3ObjectKey,
                        dynamoDBTableName: dynamoDBTableName,
                    }),
                };
                lambda.invoke(params, function (err, data) {
                    if (err) {
                        // Display an error message if the Lambda function fails
                        status.innerText = "Error: " + err.message;
                    } else {
                        // Display the response from the Lambda function
                        var response = JSON.parse(data.Payload);
                        status.innerHTML =
                            "<h2>Results:</h2><p>" + response.message + "</p>";
                    }
                });
            }
        });
});
