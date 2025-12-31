#!/bin/sh

DJ_PATH='/home/admin/dj'
cd $DJ_PATH

LOG_FILE='user.log'
APP_NAME='app.js'

if forever list | grep -q $APP_NAME; then
    echo "Stopping app..."
    forever stop $APP_NAME
else
    echo "App is not running."
fi