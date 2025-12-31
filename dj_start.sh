#!/bin/sh

DJ_PATH='/home/admin/dj'
cd $DJ_PATH

LOG_FILE='user.log'
APP_NAME='app.js'

if forever list | grep -q $APP_NAME; then
    echo "App is already running. Restarting..."
    forever restart -a -o $LOG_FILE -e /dev/null -l /dev/null $APP_NAME
else
    echo "Starting app..."
    forever start -a -o $LOG_FILE -e /dev/null -l /dev/null $APP_NAME
fi