FROM golang:1.22 as builder

ENV APP_USER app
ENV APP_HOME /go/src/app
ENV CORE_HOME /go/src/core

RUN groupadd $APP_USER && useradd -m -g $APP_USER -l $APP_USER
RUN mkdir -p $APP_HOME
RUN mkdir -p $CORE_HOME

COPY ./master $APP_HOME
COPY ./core $CORE_HOME

RUN chown -R $APP_USER:$APP_USER $APP_HOME

USER $APP_USER

WORKDIR $APP_HOME

RUN go mod download
RUN go mod verify
RUN go build -o app -mod=readonly

FROM debian:buster

ENV APP_USER app
ENV APP_HOME /go/src/app

RUN groupadd $APP_USER && useradd -m -g $APP_USER -l $APP_USER
RUN mkdir -p $APP_HOME
WORKDIR $APP_HOME

COPY --chown=0:0 --from=builder $APP_HOME/app $APP_HOME

USER $APP_USER
CMD ["./app"]