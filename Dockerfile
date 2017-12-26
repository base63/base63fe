FROM node

MAINTAINER Base63 team <horia141@gmail.com>

# Setup users and groups.

RUN groupadd base63 && \
    useradd -ms /bin/bash -g base63 base63

# Setup directory structure.

RUN mkdir /base63
COPY . /base63
RUN chown -R base63:base63 /base63/out

# Setup the runtime environment for the application.

ENV ENV LOCAL
ENV ADDRESS 0.0.0.0
ENV PORT 10000
ENV ORIGIN http://localhost:10003
ENV IDENTITY_SERVICE_HOST base63-identity:10000

WORKDIR /base63
EXPOSE 10000
USER base63
ENTRYPOINT ["npm", "run", "serve-dev"]
