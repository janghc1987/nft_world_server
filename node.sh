#!/bin/sh
while true; do

emma_check=`ps -ef | grep -v "grep" | grep "/home/coin/nodejs/app.js" | wc -l`


if [ "$emma_check" == "0"  ]; then
      node /home/coin/nodejs/app.js &
fi

done
