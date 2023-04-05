// Set up AWS SDK clients
const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    region: ''
});

const lambda = new AWS.Lambda({
    apiVersion: '2015-03-31',
    region: 'myfunction'
});

const dynamodb = new AWS.DynamoDB.DocumentClient({
    apiVersion: '2012-08-10',
    region: 'us-east-2'
});

// Set up constants for AWS resources
const BUCKET_NAME = 'cx-ssues';
const FUNCTION_NAME = 'myfunction';
const TABLE_NAME = 'Error_Lookup';

// Get the file input and upload form elements
const fileInput = document.getElementById('file-input');
const uploadForm = document.getElementById('upload-form');

// Get the response element
const responseDiv = document.getElementById('response');

// Add an event listener to the upload form to handle file uploads
uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get the file object from the file input element
    const file = fileInput.files[0];

    // Generate a unique filename for the uploaded file
    const fileName = `${Date.now()}-${file.name}`;

    try {
        // Upload the file to S3
        await s3.putObject({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: file,
            ACL: 'public-read'
        }).promise();

        // Call the Lambda function to process the file and fetch matched content from the DynamoDB table
        const lambdaResult = await lambda.invoke({
            FunctionName: FUNCTION_NAME,
            Payload: JSON.stringify({
                fileName: fileName,
                tableName: TABLE_NAME
            })
        }).promise();

        // Parse the response from the Lambda function
        const lambdaResponse = JSON.parse(lambdaResult.Payload);

        // Display the response on the UI
        responseDiv.innerHTML = `<p>Matched content: ${lambdaResponse.content}</p>`;
    } catch (error) {
        console.error(error);
        responseDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    }
});
