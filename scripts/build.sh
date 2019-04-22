#!/bin/bash

arg="$1"

if [ "$arg" = "" ] ;then
	echo "compile browser-app with production mode"
	cd ./browser-app
	yarn
	yarn build
fi

