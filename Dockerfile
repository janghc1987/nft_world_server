FROM node:10-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json /usr/src/app/

RUN npm install

RUN npm install pm2 -g

# Bundle app source
COPY . /usr/src/app

# CMD npm run prod
CMD pm2-runtime start ./app.js --name "msc-backend" -i 2 -- prod
# CMD ["pm2-runtime", "start", "ecosystem.config.js"]

EXPOSE 8588
