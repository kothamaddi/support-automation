import boto3
import re
import requests
from bs4 import BeautifulSoup

s3 = boto3.resource('s3', region_name='us-east-2')
dynamodb = boto3.resource('dynamodb', region_name='us-east-2')
table = dynamodb.Table('error_lookup')

def lambda_handler(event, context):
    bucket_name = 'cx-ssues'
    file_key = event['Records'][0]['s3']['object']['key']
    obj = s3.Object(bucket_name, file_key)
    body = obj.get()['Body'].read().decode('utf-8')

    # Parse error keywords from the DynamoDB table
    response = table.scan()
    error_keywords = [x['keyword'] for x in response['Items']]

    # Find the latest error line in the log file
    lines = body.splitlines()
    error_lines = []
    for line in reversed(lines):
        for error in error_keywords:
            if error in line:
                error_lines.append(line)
                break
        if len(error_lines) > 0:
            break

    # If error lines are found, get suggestions from DynamoDB
    if len(error_lines) > 0:
        suggestions = []
        for line in error_lines:
            response = table.get_item(
                Key={
                    'keyword': line.split(' ', 1)[0]
                }
            )
            if 'Item' in response:
                suggestions.extend(response['Item']['suggestions'])
        if len(suggestions) > 0:
            return {
                'statusCode': 200,
                'body': '\n'.join(suggestions)
            }

    # If no suggestions found in DynamoDB, get suggestions from Google
    if len(error_lines) > 0:
        error_message = error_lines[0]
        query = error_message.split(' ', 1)[0]
        url = f'https://www.google.com/search?q={query}'
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'}
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        suggestions = [suggestion.text for suggestion in soup.select('.BNeawe.s3v9rd.AP7Wnd')]
        if len(suggestions) > 0:
            return {
                'statusCode': 200,
                'body': '\n'.join(suggestions)
            }

    return {
        'statusCode': 200,
        'body': 'No suggestions found'
    }
