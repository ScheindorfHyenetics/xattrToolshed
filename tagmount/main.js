#!/usr/bin/node
/**
 * Fuse tag classified pseudo filesystem
 **/

var fuse = require('fuse-bindings');
var fs = require('fs');
var xattr = require('fs-xattr');
var statMode = require("stat-mode");
var posix = require('posix');

console.log(process.argv);

var mountPath = '/xasort';
try {
    var rootPath = posix.getpwnam(process.getuid()).dir;
} catch (Ex) {
    console.log(Ex);
    process.exit(2);
}

if (process.argv[2] !== undefined && process.argv[2] != '') {
    rootPath = process.argv[2];
    if (rootPath.slice(-1) == '/') { rootPath = rootPath.slice(0,rootPath.length-1); }
}
if (process.argv[3] !== undefined && process.argv[3] != '') {
    mountPath = process.argv[3];
    if (mountPath.slice(-1) == '/') { mountPath = mountPath.slice(0,mountPath.length-1); }
}

console.log("rootPath=%s",rootPath);
console.log("mountPath=%s",mountPath);

var userAuthor = {'_':[]};
var userTags = {};



let thd_recurse_and_fill = function recurse_and_fill(path) {
    let dir = fs.readdirSync(path);
    console.log('enter %s',path);
    dir.forEach( (d) => {
        if (d == '.' || d == '..') {

        } else {
            try {
                let ppath = path+'/'+d;
                let mstat = fs.statSync(ppath);
                if (mstat.isDirectory()) {
                    setImmediate(thd_recurse_and_fill,ppath);
                } else if (mstat.isFile()) {
                    try {
                        let str = String(xattr.getSync(ppath,'user.author'))
                        if (userAuthor[str] === undefined) {
                            userAuthor[str] = []
                        }
                        let fname = ppath.slice(ppath.lastIndexOf('/')+1);
                        while (userAuthor[str].map((v)=>v[0]).indexOf(fname) != -1) {
                            fname = '_' + fname;
                        }
                        userAuthor[str].push([fname,ppath]);
                    } catch (Ex) {
                        let fname = ppath.slice(ppath.lastIndexOf('/')+1);
                        while (userAuthor['_'].map((v)=>v[0]).indexOf(fname) != -1) {
                            fname = '_' + fname;
                        }
                        userAuthor['_'].push([fname,ppath]);
                    }
                    try {
                        let tags = String(xattr.getSync(ppath,'user.tags'))
                        tags = tags.trim().split(' ');
                        tags.forEach((t)=>{
                            if (userTags[t] === undefined) {
                                userTags[t] = [];
                            }
                            let fname = ppath.slice(ppath.lastIndexOf('/')+1);
                            while (userTags[t].map((v)=>v[0]).indexOf(fname) != -1) {
                                fname = '_' + fname;
                            }
                            userTags[t].push([fname,ppath]);
                        });
                    } catch (Ex) {
                    }
                }
            } catch (Ex) {
                console.log(Ex);
            }
        }
    });
    console.log('leave %s',path);
}
thd_recurse_and_fill(rootPath);

try {
    var mstat = fs.statSync(mountPath);
} catch (Ex) {
    if (Ex.code == 'ENOENT') {
        try {
            fs.mkdirSync(mountPath);
        } catch (Ex) {
            console.log(Ex);
            process.exit(1);
        }
        var mstat = fs.statSync(mountPath);
    }
}

if (!mstat.isDirectory()) {
    console.log(mountPath + ' not a directory');
    process.exit(1);
}

function templateStat(type) {
    stat = {"mode":0};
    mode = new statMode(stat);
    switch (type) {
        case 'd':
            mode.isDirectory(true);
        break;
        case 'l':
            mode.isSymbolicLink(true);
        break;
        case 'f':
        default:
            mode.isFile(true);
        break;
    }
    mode.owner.execute = 1;
    mode.owner.read = 1;
    mode.owner.write = 0;
    mode.group.execute = 1;
    mode.group.read = 1;
    mode.group.write = 0;
    mode.others.execute = 1;
    mode.others.read = 1;
    mode.others.write = 0;
    stat.mtime = new Date();
    stat.atime = new Date();
    stat.ctime = new Date();
    stat.size = 4*1024;
    stat.uid = process.getuid ? process.getuid() : 0;
    stat.gid = process.getgid ? process.getgid() : 0;
    return stat;
}

fuse.mount(mountPath, {
  readdir: function (path, cb) {
    let dirs;
    console.log('readdir(%s)', path)
    if (path === '/') {
        return cb(0, ['author','tags'])
    }
    if (path === '/author') {
        dirs = Object.keys(userAuthor);
        return cb(0, dirs);
    }
    if (path === '/tags') {
        dirs = Object.keys(userTags);
        return cb(0, dirs);
    }
    path = path.split('/');
    console.log(path);
    if (path[1] == 'tags') {
        console.log('in tags');
        if (path[2] !== undefined && path[2] != '') {
            console.log('in '+path[2]);
            console.log(userTags[path[2]]);
            cb(0, userTags[path[2]].map((p)=>p[0]));
            return;
        }
    }
    if (path[1] == 'author') {
        if (path[2] !== undefined && path[2] != '') {
            cb(0, userAuthor[path[2]].map((p)=>p[0]));
            return;
        }
    }
    cb(fuse.ENOENT)
  },
  getattr: function (path, cb) {
    console.log('getattr(%s)', path)
    if (path === '/') {
      cb(0, templateStat('d'));
      return;
    }
    if (path === '/author') {
      cb(0, templateStat('d'));
      return;
    }
    if (path === '/tags') {
      cb(0, templateStat('d'));
      return;
    }
    if (path.startsWith('/tags/')) {
        path = path.slice(6);
        if (Object.keys(userTags).indexOf(path) != -1) {
            cb(0, templateStat('d'));
            return;
        }
        path = path.split('/');
        if (path[1] !== undefined && path[1] != '') {
            if (userTags[path[0]].map((p)=>p[0]).indexOf(path[1]) != -1) {
                cb(0, templateStat('l'));
                return;
            }
        }
    } else if (path.startsWith('/author/')) {
        path = path.slice(8);
        if (Object.keys(userAuthor).indexOf(path) != -1) {
            cb(0, templateStat('d'));
            return;
        }
        path = path.split('/');
        if (path[1] !== undefined && path[1] != '') {
            if (userAuthor[path[0]].map((p)=>p[0]).indexOf(path[1]) != -1) {
                cb(0, templateStat('l'));
                return;
            }
        }
    }
    cb(fuse.ENOENT)
  },
  readlink: function (path, cb) {
        console.log('readlink(%s)', path);
        let lindex ;
        path = path.split('/');
        if (path[1] == 'tags') {
            if (userTags[path[2]] !== undefined) {
                lindex = userTags[path[2]].map((p)=>p[0]).indexOf(path[3]);
                if (lindex != -1) {
                    cb(0, userTags[path[2]][lindex][1]);
                    return;
                }
            }
        }
        if (path[1] == 'author') {
            if (userAuthor[path[2]] !== undefined) {
                lindex = userAuthor[path[2]].map((p)=>p[0]).indexOf(path[3]);
                if (lindex != -1) {
                    cb(0, userAuthor[path[2]][lindex][1]);
                    return;
                }
            }
        }
        cb(fuse.ENOENT)
  },
}, function (err) {
  if (err) throw err
  console.log('filesystem mounted on ' + mountPath)
})

process.on('SIGINT', function () {
  fuse.unmount(mountPath, function (err) {
    if (err) {
      console.log('filesystem at ' + mountPath + ' not unmounted', err)
    } else {
      console.log('filesystem at ' + mountPath + ' unmounted')
    }
  })
})


function descendpath(path,struct) {
    if (typeof path === 'string') {
        path = path.split('/').filter((part)=>part != '');
    }
    let dir = struct, part;
    while (path.length > 1) {
        part = path.shift();
        if (dir['d'] !== undefined && dir['d'][part] !== undefined) {
            dir = dir['d'][part];
        } else {
            throw new Error('directory '+part+' not found');
        }
    }
    part = path.shift();
    dir = dir['d'][part] || dir['f'][part] || dir['l'][part] || dir['dev'][part] || dir['sock'][part] || dir['fifo'][part]
    return dir;
}
