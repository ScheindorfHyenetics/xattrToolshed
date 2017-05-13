#!/bin/bash

function grep_tags_author {
    if [[ -f "$1" ]]
    then AUTHOR=$(getfattr -n user.author --only-values $1 2>/dev/null || echo '')
         TAGS=$(getfattr -n user.tags --only-values $1 2>/dev/null || echo '')
         RESULT=$(echo $(echo $AUTHOR | tr ' ' '_') $TAGS | grep -Pi --colour=always "$2")
         if [[ $? -eq 0 ]]
         then echo $1 ' : ' $RESULT
         fi
         echo $(echo $AUTHOR | tr ' ' '_') $TAGS | grep -Piq "$2" && return 0 || return 1
    fi
}

if [[ "$1" = "grep_tags_author" ]]
then grep_tags_author "$2" "$3" && exit 0 || exit 1
fi

if [[ "$1" = "quiet_grep_tags_author" ]]
then grep_tags_author "$2" "$3" >/dev/null && exit 0 || exit 1
fi

if [[ -z "$1" ]]
then echo 'no dir path specified' >&2
     exit 1
fi

if [[ -z "$2" ]]
then echo 'no regex specified' >&2
     exit 1
fi

if [[ -z "$3" ]]
then MODE=0
else if [[ "$3" = "v" ]]
     then MODE=0
     else if [[ "$3" = "q" ]]
          then MODE=1
          else MODE=0
          fi
    fi
fi

if [[ $MODE -eq 0 ]]
then MODE="grep_tags_author"
fi
if [[ $MODE -eq 1 ]]
then MODE="quiet_grep_tags_author"
fi

find -L "$1" -type f -exec bash "$0" $MODE \{\} "$2" \; $([[ $MODE = "quiet_grep_tags_author" ]] && echo -print )

