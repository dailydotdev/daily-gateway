FROM binxio/gcp-get-secret

FROM node:14.13-alpine
RUN apk add g++ make python

EXPOSE 3000

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY --from=0 /gcp-get-secret /usr/local/bin/

RUN \
  apk --no-cache add \
  libc6-compat

COPY package.json .
COPY yarn.lock .

RUN yarn install --prod

COPY build .

ENTRYPOINT ["/usr/local/bin/gcp-get-secret"]
CMD ["yarn", "start"]
