# xattrToolshed
commandline and graphic extended file manipulation using linux filesystem extended attributes

# user.author + user.tags [   /atags  ]
wrote some tools manipulating two extended attributes on regular files,
designed whith the idea of helping me to categorize and retrieve images in
big images folders, without folding these in subfolder : as an image could be
responding to multiple categories, it would requier hardlinks...
So I defined that I'll now be using two xattr :
user.author storing the image author if relevant, and,
user.tags storing image keyword categories separated by spaces.

