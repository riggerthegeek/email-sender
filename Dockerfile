########################################
# Docker                               #
#                                      #
# A NodeJS container that enables the  #
# application to run                   #
########################################

FROM node:6.5

MAINTAINER Simon Emms, simon@simonemms.com

# Set the work directory and add the project files to it
WORKDIR /opt/email-sender
ADD . /opt/email-sender

# Environment variables
ENV NPM_CONFIG_LOGLEVEL warn

# Install the dependencies
RUN npm install -g bunyan

# Expose the port
EXPOSE 9999

# Run run run
CMD npm start | bunyan
