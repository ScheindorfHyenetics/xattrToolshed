#!/bin/bash
if [[ -e ./main.js ]]
then echo fuse bindings
     npm install --save fuse-bindings
     echo xattr bindings
     npm install --save fs-xattr
     echo posix bindings
     npm install --save posix
     echo stat mode parser
     npm install --save stat-mode
     echo end of list
fi
