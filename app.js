var s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    region: 'your_s3_region'
});

function handleFileSelect() {
    var file = document.getElementById('fileUpload').files[0];
    var filename = file.name;

    var params = {
        Bucket: 'your_bucket_name',
        Key: filename,
        ContentType: file.type,
        ACL: 'public-read'
    };

    var progressBar = document.getElementById('progressbar');
    var message = document.getElementById('message');

    s3.upload(params, function (err, data) {
        if (err) {
            console.log(err);
            message.innerHTML = 'Error uploading file: ' + err.message;
        } else {
            console.log(data);
            message.innerHTML = 'File uploaded successfully';
        }
    })
    .on('httpUploadProgress', function (progress) {
        var uploaded = parseInt((progress.loaded * 100) / progress.total);
        progressBar.value = uploaded;
    });
}
