FROM node

WORKDIR /app/product

COPY package.json .

RUN npm install

COPY . .

EXPOSE 40247

CMD [ "npm", "start" ]