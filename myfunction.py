import boto3
import re
from googlesearch import search
import openai_secret_manager

def get_suggestion(query):
    # Fetch OpenAI API key
    secrets = openai_secret_manager.get_secret("openai")
    openai_key = secrets["api_key"]

    # Use OpenAI GPT-3 API to generate suggestions
    # Here's a dummy response since we don't have an API key
    return ["This is a suggestion from OpenAI GPT-3 API"]


def lambda_handler(event, context):
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('error_lookup')
    file_obj = event["Records"][0]
    filename = str(file_obj['s3']['object']['key'])
    bucket_name = 'cx-ssues'

    # Check if file uploaded is eb-engine.log
    if filename == 'eb-engine.log':
        # Read the contents of the file
        file_content = s3.get_object(Bucket=bucket_name, Key=filename)['Body'].read().decode('utf-8')

        # Find the latest error line
        error_line = None
        for line in reversed(file_content.split("\n")):
            if 'ERROR' in line:
                error_line = line.strip()
                break

        # If an error line is found, search in DynamoDB for suggestions
        if error_line:
            keywords = re.findall(r'\b\w+\b', error_line)
            suggestions = []
            for i in range(len(keywords), 0, -1):
                comb = [' '.join(keywords[j:j+i]) for j in range(len(keywords)-i+1)]
                for keyword in comb:
                    response = table.get_item(Key={'keyword': keyword})
                    if 'Item' in response:
                        suggestions.extend(response['Item']['suggestions'])
            if suggestions:
                return {'statusCode': 200, 'body': {'message': error_line, 'suggestions': suggestions}}

        # If no suggestions found in DynamoDB, search using Google
        query = error_line if error_line else 'eb-engine.log error'
        suggestions = []
        for result in search(query, num=5):
            suggestions.append(result)
        if suggestions:
            return {'statusCode': 200, 'body': {'message': error_line, 'suggestions': suggestions}}

    # If the uploaded file is not eb-engine.log, return an error message
    return {'statusCode': 400, 'body': 'Invalid file type. Please upload an eb-engine.log file.'}
