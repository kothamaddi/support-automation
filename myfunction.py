import boto3

# Create a DynamoDB resource object
dynamodb = boto3.resource('dynamodb')

# Name of the S3 bucket and file to read
bucket_name = 'your-bucket-name'
file_name = 'your-file-name'

# Get the last modified time of the file in S3
s3 = boto3.client('s3')
response = s3.head_object(Bucket=bucket_name, Key=file_name)
last_modified = response['LastModified']

# Read the file from S3
file_obj = s3.get_object(Bucket=bucket_name, Key=file_name)
file_lines = file_obj['Body'].read().decode('utf-8').splitlines()

# Find the latest line with the keyword "error"
latest_error_line = None
for i, line in enumerate(reversed(file_lines)):
    if 'error' in line.lower():
        latest_error_line = line.strip()
        error_line_index = len(file_lines) - i - 1
        break

# If an error line was found, get the lines above and below the error line
if latest_error_line:
    above_error_lines = []
    for line in file_lines[:error_line_index][::-1]:
        above_error_lines.append(line)
        if 'error' in line.lower():
            break

    below_error_lines = []
    for line in file_lines[error_line_index + 1:]:
        below_error_lines.append(line)
        if 'error' in line.lower():
            break

    print(f"Latest error line: {latest_error_line}")
    print(f"Above error lines: {above_error_lines}")
    print(f"Below error lines: {below_error_lines}")

    # Build a filter expression that matches any items in the DynamoDB table where
    # the error message contains the latest error line, an above error line, or a below error line
    filter_expression = (
        'contains(#err_msg_attr, :latest_error_val) '
        'OR contains(#err_msg_attr, :above_error_val) '
        'OR contains(#err_msg_attr, :below_error_val)'
    )
    expression_attribute_names = {'#err_msg_attr': 'error_message'}
    expression_attribute_values = {
        ':latest_error_val': latest_error_line,
        ':above_error_val': above_error_lines,
        ':below_error_val': below_error_lines
    }

    table_name = 'your-dynamodb-table-name'
    table = dynamodb.Table(table_name)
    response = table.scan(
        FilterExpression=filter_expression,
        ExpressionAttributeNames=expression_attribute_names,
        ExpressionAttributeValues=expression_attribute_values
    )
    matching_items = response['Items']
    print(f"Matching items in DynamoDB: {matching_items}")
else:
    print("No error lines found in the file")
