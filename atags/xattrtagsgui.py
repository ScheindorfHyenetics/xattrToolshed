#!/usr/bin/python3

import os
import sys
import stat
import urllib.parse as urlh
import xattr

import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, GdkPixbuf

loadphase = [False,False]
loadfile = None

def xattrload(ldoff,txtbuf,txtfield,xattrname):
    global loadfile
    loadphase[ldoff] = True
    cfile = window.get_uri()
    if cfile is None:
        txtbuf.set_text('',0)
        txtfield.set_editable(False)
        loadfile = None
        loadphase[ldoff] = False
        return
    cfile = urlh.unquote(cfile.replace('file://','',1))
    try:
        cfstat = os.stat(cfile)
        if not stat.S_ISREG(cfstat.st_mode):
            txtbuf.set_text('',0)
            txtfield.set_editable(False)
            loadfile = None
            raise TypeError('not an ordinary file')
        try:
            xtxtbuf = xattr.get(cfile,xattrname)
            xtxtbuf = xtxtbuf.decode('utf8')
            txtbuf.set_text(xtxtbuf,len(xtxtbuf))
            txtfield.set_editable(True)
            loadfile = cfile
        except FileNotFoundError as ex:
            txtbuf.set_text('',0)
            txtfield.set_editable(False)
            loadfile = None
            raise ex
        except OSError as ex:
            if str(ex).find('61') != -1:
                txtbuf.set_text('',0)
                txtfield.set_editable(True)
                loadfile = cfile
            else:
                txtbuf.set_text('',0)
                txtfield.set_editable(False)
                loadfile = None
            raise ex
    except Exception as ex:
        loadphase[ldoff] = False
        print(ex)
        return
    loadphase[ldoff] = False

def xattrsave(ldoff,txtbuf,xattrname):
    global loadfile
    if loadphase[ldoff] != False:
        #print('loadphase set')
        return
    if loadfile is None:
        #print('loadfile none')
        return
    attrtxt = txtbuf.get_text().encode('utf8')
    xattr.set(loadfile,xattrname,attrtxt)
    print('%s:%s=%s' % (loadfile,xattrname,attrtxt))

class Handler:
    def filewindow_selection_changed_author(self, *args):
        xattrload(0,args[0],builder.get_object("authortextbox"),'user.author')
        return
    def filewindow_selection_changed_tags(self, *args):
        xattrload(1,args[0],builder.get_object("tagstextbox"),'user.tags')
        return
    def filewindow_destroy(self, *args):
        Gtk.main_quit(*args)
    def closebutton_clicked(self, *args):
        window.destroy()
    def xattr_user_author_change(self, *args):
        xattrsave(0,args[0],'user.author')
    def xattr_user_tags_change(self, *args):
        xattrsave(1,args[0],'user.tags')
    def updatepreview(self, *args):
        global loadfile
        try:
            if loadfile is None:
                args[0].set_from_stock('gtk-dialog-error',1)
            img = GdkPixbuf.Pixbuf.new_from_file_at_size(loadfile,200,200)
            #args[0].set_from_file(loadfile)
            args[0].set_from_pixbuf(img)
        except Exception as ex:
            args[0].set_from_stock('gtk-dialog-error',1)
            print(ex)


builder = Gtk.Builder()
gladefile = os.path.dirname(sys.argv[0])
if gladefile == '':
    raise IOError('cannot get script directory')
if gladefile[-1] != os.sep:
    gladefile += os.sep
print('loading gladefile %sxattrtagsgui.glade' % gladefile)
builder.add_from_file("%sxattrtagsgui.glade" % gladefile)
builder.connect_signals(Handler())

window = builder.get_object("filewindow")
window.show_all()

Gtk.main()
