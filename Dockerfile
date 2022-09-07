ARG NODE_ENV=production
ARG UBUNTU_VERSION=22.04
FROM ubuntu:$UBUNTU_VERSION as base

RUN apt-get update && \
  apt-get install -y \
    curl \
    wget \
    git \
  && rm -rf /var/lib/apt/lists/*

ARG NODE_VERSION=18
ENV NODE_VERSION=$NODE_VERSION
RUN wget -qO- https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
  && apt-get install nodejs \
  && npm install -g yarn \
  && rm -rf /var/lib/apt/lists/*

ARG KUBECTL_VERSION=v1.25.0
ENV KUBECTL_VERSION=$KUBECTL_VERSION
RUN curl -sL https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl > /usr/local/bin/kubectl \
  && chmod +x /usr/local/bin/kubectl

RUN useradd -rm -d /home/ubuntu -s /bin/bash -g root -G sudo -u 1000 ubuntu

WORKDIR /app

## PREPARE (package.json to avoid node_modules cache invalidation on version bumpgin)
FROM base as preparation
COPY package.json /app/
RUN node -e "fs.writeFileSync('/app/package.json', JSON.stringify({ ...JSON.parse(fs.readFileSync('/app/package.json')), version: '0.0.0' }));"

## BUILD ENVIRONMENTS
FROM base as builder
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

### INSTALL (node modules)
COPY --from=preparation /app/package.json /app/
COPY package.json yarn.lock .yarnrc.yml /app/
COPY .yarn .yarn

#### YARN INSTALL
RUN mkdir -p src
RUN yarn install --immutable \
  && yarn cache clean
RUN rm -rf src

### COPY (package sources)
COPY . /app/

### CUSTOMS COPY (before build)

#### CUSTOMS ARG and ENV
# ARG FOO
# ENV FOO=$FOO

#### CUSTOMS RUN

### RUN PREBUILD

### CUSTOM RUN PREBUILD

### RUN BUILD
# RUN yarn build

# NODE PROJECT RUNNER
## SERVER
FROM base as server
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

# ENV GIT_SSH_COMMAND="ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no"

RUN mkdir /secrets
WORKDIR /app

## USER AND PERMS
RUN chown -R 1000:1000 /app
USER 1000

ENTRYPOINT ["/app/infra-as-loop"]
CMD ["help"]

COPY --from=builder /app/ /app/
