# Email Sender

Pulls emails out of a MongoDB and sends to Mailgun

## Environment Variables

 - COUNT_FLAG: Flag in the DB to count number of send attempts
 - MAILGUN_DOMAIN: Domain for Mailgun
 - MAILGUN_KEY: Key for Mailgun
 - MONGODB_COLLECTION: MongoDB collection name
 - MONGODB_URL: The URL to connect to the MongoDB
 - RETRY: Number of retries
 - SENT_FLAG: Flag in the DB to indicate successful send
 - TIMEOUT: Timeout for running the application to check for new emails

# Development

## Docker

Build the Dockerfile

    docker build -t email-sender .

Run in development mode, mounting the current directory as a volume

    docker run -it --rm -v $PWD:/opt/email-sender --publish=7788:9999 --name email email-sender /bin/bash