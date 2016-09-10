# Email Sender

Pulls emails out of a MongoDB and sends to Mailgun

# Development

## Docker

Build the Dockerfile

    docker build -t email-sender .

Run in development mode, mounting the current directory as a volume

    docker run -it --rm -v $PWD:/opt/email-sender --publish=7788:9999 --name email email-sender /bin/bash