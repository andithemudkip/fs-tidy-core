const path = require ('path');
const nodedir = require ('node-dir');
const fs = require ('fs-extra');

let INPUT = `C:\\Users\\picas\\Desktop\\projects\\fs-tidy-no-gui\\testing\\input`;
let OUTPUT = `C:\\Users\\picas\\Desktop\\projects\\fs-tidy-no-gui\\testing\\output`;

let SORT_SUBFOLDERS = true;

let REMOVE_INPUT = true;

let PATH_COPY_BLACKLIST = [
    
];

let PATH_DEL_BLACKLIST = [

];

if (!fs.existsSync (OUTPUT)) {
    fs.mkdirSync (OUTPUT);
}

let tidy = () => {
    console.log ('Checking input directory...');
    if (fs.existsSync (INPUT) && fs.statSync (INPUT).isDirectory ()) {
        console.log ('Indexing files...');
        nodedir.files (INPUT, (err, allfiles) => {
            if (err) throw err;
            console.log ('Done indexing.');
            console.log ('Removing blacklisted paths from copy list...');
            let files = allfiles;
            PATH_COPY_BLACKLIST.forEach (blacklist_item => {
                files = files.filter (f => !f.match (new RegExp (blacklist_item)))
            });
            console.log ('Creating directories and copying files...');
            let i = 0;
            files.forEach (file => {
                let p = file.split ('\\');
                let indir = p.slice (0, p.length - 1).join ('\\');
                let outdir = indir.replace (INPUT, OUTPUT);
                let filename = p [p.length - 1];

                if (indir != INPUT) {
                    if (!fs.existsSync (outdir)) fs.mkdirSync (outdir, { recursive: true });

                    if (SORT_SUBFOLDERS) {
                        let folder;
                        let ext = path.extname (file);
                        if (!ext || !ext.length) folder = 'no-extension';
                        else folder = ext.slice (1);
                        outdir = path.join (outdir, 'sorted', folder);
                    }
                    fs.copy (file, path.join (outdir, filename), err => {
                        i++;

                        if (err) {
                            if (err.message.startsWith ('Source and destination must not be the same.')) {
                                console.log (`[${i}/${files.length}] Skipping ${filename} because it already exists`);
                            } else {
                                console.error (`[${i}/${files.length}]`, err);
                            }
                        }
                        else console.log (`[${i}/${files.length}] Copying ${path.join (indir, filename)}`);

                        if (i === files.length) {
                            console.log ('Done copying.');
                            if (REMOVE_INPUT) {
                                removeInput (allfiles);
                            }
                        }
                    });
                } else {
                    let folder;
                    let ext = path.extname (file);
                    if (!ext || !ext.length) folder = 'no-extension';
                    else folder = ext.slice (1);
                    outdir = path.join (outdir, 'sorted', folder);
                    if (!fs.existsSync (outdir)) fs.mkdirSync (outdir, { recursive: true });

                    fs.copy (file, path.join (outdir, filename), err => {
                        i++;

                        if (err) console.error (`[${i}/${files.length}]`, err);
                        else console.log (`[${i}/${files.length}] Copying ${path.join (indir, filename)}`);

                        if (i === files.length) {
                            console.log ('Done copying.');
                            if (REMOVE_INPUT) {
                                removeInput (allfiles);
                            }
                        }
                    });
                }
            });
            
        });
    } else {
        console.error ('Input does not exist or is not a directory.');
    }
}

let removeInput = allfiles => {
    let i = 0;
    let files = allfiles;
    nodedir.subdirs (INPUT, (err, subdirs) => {
        if (err) console.error (err);
        else {
            console.log ('Removing blacklisted paths from delete list.')
            PATH_DEL_BLACKLIST.forEach (blacklist_item => {
                files = files.filter (f => !f.match (new RegExp (blacklist_item)));
            });
            
            if (INPUT === OUTPUT) {
                console.log ('Deleting input files...');
                files.forEach (file => {
        
                    let p = file.split ('\\');
                    let indir = p.slice (0, p.length - 1).join ('\\');
        
                    i++;
                    if (indir === INPUT || SORT_SUBFOLDERS) {
                        fs.unlink (file, err => {
                            if (err) console.error (`[${i}/${files.length}]`, err);
                            else console.log (`[${i}/${files.length}] Deleting ${file}`);
                        });
                    }
        
                    if (i === files.length) {
                        console.log ('Done deleting.')
                    }
                });
            } else {
                console.log ('Deleting input files...');
                files.forEach (file => {
                    let p = file.split ('\\');
                    let indir = p.slice (0, p.length - 1).join ('\\');
                    
                    // if (indir === INPUT || SORT_SUBFOLDERS) { // is root directory or sorting subfolders is true
                        fs.unlink (file, err => {
                            i++;
                            if (err) console.error (`[${i}/${files.length}]`, err);
                            else console.log (`[${i}/${files.length}] Deleting ${file}`);
                            if (i === files.length) {
                                console.log ('Done deleting files.');
                                console.log ('Deleting subdirectories...');

                                let subs = subdirs.map (s => { return { path: s, n: s.split (/\\/g).length } });
                                let subsorted = subs.sort ((a, b) => b.n - a.n);

                                deleteSubdirs (subsorted, () => {
                                    console.log ('Deleted subdirectories.');
                                    console.log ('Tidying complete.');
                                });
                            }
                        });
                    // }
                });
            }
        }
    });
    
}

tidy ();

let deleteSubdirs = (subdirs, cb, i = 0) => {
    if (subdirs [i]) {
        nodedir.files (subdirs [i].path, (err, _files) => {
            if (err) {
                console.error (err);
                deleteSubdirs (subdirs, cb, i + 1);
            }
            else {
                if (!_files.length) {
                    fs.rmdir (subdirs [i].path, err => {
                        if (err) {
                            console.error (err);
                            deleteSubdirs (subdirs, cb, i + 1);
                        }
                        else {
                            console.log (`Deleting directory ${subdirs [i].path}`);
                            deleteSubdirs (subdirs, cb, i + 1);
                        }
                    });
                } else {
                    deleteSubdirs (subdirs, cb, i + 1);
                }
            }
        })
    } else cb ();
}