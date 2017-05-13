#!/bin/bash

#echo "lancement $@"

if [[ -z "$1" ]]
then echo 'no file specified' >&2
     echo "$0 <file> <author|addtag|deltag|addtags|deltags|view> [<author|tag> [<tag> [<tag> ...]]]"
     echo "author to set user.author value"
     echo "addtag to add one new keyword in list if not present ; addtags take several arguments"
     echo "deltag to remove one listed keyword if present ; deltags take several arguments"
     echo "view to print filepath together with user.author and user.tags value"
     exit 1
fi

if [[ -f "$1" ]]
then DESTFILE=$1
     if [[ "$2" = "author" ]]
        then setfattr -n user.author -v "$3" "$DESTFILE"
             if [[ $? == 0 ]]
                then echo "OK " $(getfattr --only-values -n user.author "$DESTFILE")
                exit 0
             else echo "ERR " $(getfattr --only-values -n user.author "$DESTFILE")
                exit 1
             fi
    fi
    if [[ "$2" = "addtag" ]]
        then TAGS=$(getfattr --only-values  -n user.tags "$DESTFILE")
             NEWTAG=$(echo "$3" | tr " " "_")
             BKIFS=$IFS
             IFS=" "
             for t in $TAGS
             do [[ "$t" = "$NEWTAG" ]] && { echo "EXISTS $TAGS" ; IFS=$BKIFS ; exit 2 ; }
             done
             setfattr -n user.tags -v "$TAGS $NEWTAG" "$DESTFILE"
             IFS=$BKIFS
             if [[ $? == 0 ]]
                then echo "OK " $(getfattr --only-values -n user.tags "$DESTFILE")
                exit 0
             else echo "ERR " $(getfattr  --only-values -n user.tags "$DESTFILE")
                exit 1
             fi
    fi
    if [[ "$2" = "deltag" ]]
        then TAGS=$(getfattr --only-values -n user.tags "$DESTFILE")
             RMTAG=$(echo "$3" | tr " " "_")
             NEWTAGS=""
             BKIFS=$IFS
             IFS=" "
             for t in $TAGS
             do [[ "$t" = "$RMTAG" ]]  || NEWTAGS="$NEWTAGS $t"
             done
             if [[ -z "$NEWTAGS" ]]
             then setfattr -x user.tags "$DESTFILE"
             else setfattr -n user.tags -v "$NEWTAGS" "$DESTFILE"
             fi
             IFS=$BKIFS
             if [[ $? == 0 ]]
                then echo "OK " $(getfattr --only-values  -n user.tags "$DESTFILE")
                exit 0
             else echo "ERR " $(getfattr --only-values -n user.tags "$DESTFILE")
                exit 1
             fi
    fi
    if [[ "$2" = "addtags" ]]
    then while [[ -n "$3" ]]
         do bash "$0" "$DESTFILE" addtag "$3"
            shift 1
         done
    fi
    if [[ "$2" = "deltags" ]]
    then while [[ -n "$3" ]]
         do bash "$0" "$DESTFILE" deltag "$3"
            shift 1
         done
    fi
    if [[ "$2" = "view" ]]
        then echo  "File: $DESTFILE          Author: " $(getfattr --only-values -n user.author "$DESTFILE" 2>/dev/null)
             echo "Tags: " $(getfattr --only-values -n user.tags "$DESTFILE" 2>/dev/null)
    fi
fi
