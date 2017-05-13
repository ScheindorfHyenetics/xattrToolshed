#!/bin/bash

if [[ -z "$1" ]]
then echo 'no path specified' >&2
     echo "$0 <directory>" >&2
     exit 1
fi

RWATAGS=$( [[ -f "./rwatags.sh" ]] && echo "./rwatags.sh" || echo "rwatags.sh" )

if [[ -d "$1" ]]
then BKIFS=$IFS
     #IFS=$(echo -e "\n")
     DIRS=""
     for fn in $(ls -A1 "$1")
     do FILE="${1%*/}/$fn"
        #echo $FILE
        if [[ -d "$FILE" ]]
            then DIRS=$DIRS" $FILE"
            else if [[ -f "$FILE" ]]
                    then $RWATAGS "$FILE" view
                 fi
        fi
    done
    IFS=$BKIFS
    [[ -n "$DIRS" ]] && echo "dirs: $DIRS"
    exit 0
fi

if [[ -f "$1" ]]
then $RWATAGS "$1" view
     exit $?
fi
