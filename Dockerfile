FROM node

MAINTAINER Base63 team <horia141@gmail.com>

ARG GEMFURY_USER
ARG GEMFURY_API_KEY

# Setup directory structure.

RUN mkdir /base63
RUN mkdir /base63/build
RUN mkdir /base63/out
RUN mkdir /base63/var

# Setup users and groups.

RUN groupadd base63 && \
    useradd -ms /bin/bash -g base63 base63

# Install package requirements.

# COPY package.json /base63/package.json
# RUN cd /base63 && npm install --registry=https://npm-proxy.fury.io/${GEMFURY_API_KEY}/${GEMFURY_USER}/ --progress=false

# Copy source code.

COPY . /base63

# Setup the runtime environment for the application.

ENV ENV LOCAL
ENV ADDRESS 0.0.0.0
ENV PORT 10000
ENV ORIGIN http://localhost:10003
ENV IDENTITY_SERVICE_HOST base63-identity:10000

RUN chown -R base63:base63 /base63/build
RUN chown -R base63:base63 /base63/out
RUN chown -R base63:base63 /base63/var
VOLUME ["/base63/src"]
VOLUME ["/base63/migrations"]
VOLUME ["/base63/node_modules"]
VOLUME ["/base63/.env"]
WORKDIR /base63
EXPOSE 10000
USER base63
ENTRYPOINT ["npm", "run", "serve-dev"]
