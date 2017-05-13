#   Tools to classify files with user.author & user.tags

>> xattrtagsgui.py
>> xattrtagsgui.glade
GTK3 Python3 GUI using a single GtkFileDialog window.
Two text boxes are available under the file selection dialog template,
when a regular file is selected, fields are filled with extended attr values.
Selected file xattrs are updated each time the textbox is changed.
For conveniance, I added an image widget displaying a ~ 200x200 preview of the
file content if available.

>> rwatags.sh
bash script using getfattr / setfattr to manipulate user.author/user.tags

./rwatags.sh <file> <author|addtag|deltag|addtags|deltags|view> [<author|tag> [<tag> [<tag> ...]]]
author to set user.author value
addtag to add one new keyword in list if not present ; addtags take several arguments
deltag to remove one listed keyword if present ; deltags take several arguments
view to print filepath together with user.author and user.tags value

>> findatag.sh
bash script walking recursively from given root path and printing files matching
given regex in tags or author attributes.

./findatag.sh <path> <regex> <q|v|''>
                                        v or empty : display grep match
                                        q : display only matched files path

>> listatag.sh
bash script iterating over the files in specified directory and printing
rwatags.sh view command output of each.
need rwatags.sh in PATH or in current path folder.

./listatag.sh <directory>
