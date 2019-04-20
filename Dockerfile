ARG NODE_VERSION=10
FROM node:${NODE_VERSION}-alpine
RUN apk add --no-cache make gcc g++ python bash
WORKDIR /home/theia
# 注意：plugin和 extension并不在docker中再次编译，故在docker build前一定注意要在本目录编译好plugin和 extension
ADD ./ ./
RUN yarn config set registry https://registry.npm.taobao.org/ &&\
    yarn --production && \
    yarn build && \
    yarn autoclean --init && \
    echo *.ts >> .yarnclean && \
    echo *.ts.map >> .yarnclean && \
    echo *.spec.* >> .yarnclean && \
    yarn autoclean --force && \
    rm -rf ./node_modules/electron && \
    yarn cache clean

FROM node:${NODE_VERSION}-alpine
RUN addgroup theia && \
    adduser -G theia -s /bin/sh -D theia;
RUN chmod g+rw /home && \
    mkdir -p /home/project && \
    chown -R theia:theia /home/theia && \
    chown -R theia:theia /home/project;
RUN apk add --no-cache git openssh bash
ENV HOME /home/theia
WORKDIR /home/theia
COPY --from=0 --chown=theia:theia /home/theia /home/theia
EXPOSE 3000
ENV SHELL /bin/bash
ENV USE_LOCAL_GIT true
# 指定 plugin 路径
ENV THEIA_PLUGINS local-dir:./plugins/tinylink
USER theia
ENTRYPOINT [ "node", "/home/theia/browser-app/src-gen/backend/main.js", "/home/project", "--hostname=0.0.0.0" ]
