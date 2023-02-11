const TYPE = 'application/zip';
exports.install = function () {
    CORS();
    ROUTE('GET /', home);
    ROUTE('POST /extract/', handler, ['upload', 60000], 1024 * 50);
}

function home() {
    var self = this;

    self.view('index');
}

async function handler() {
    var self = this;
    var output;
    var id = self.id = UID();
    var file = self.files[0];
    if (!file) {
        self.invalid('@(File not found)');
        return;
    }

    var filename = file.filename;
    FUNC.log(id, { filename });
    output = await fromfile(self);
    self.res.file(output + '.tar.gz', filename + '.tar.gz');
}

function fromfile($) {

    return new Promise(function (resolve, reject) {
        var file = $.files[0];

        if (!file) {
            $.invalid('@(File not found)');
            return;
        }

        if (file.type !== 'application/pdf' && file.type !== 'application/x-pdf' && file.extension !== 'docx') {
            $.invalid('@(Un supported File format)')
            return;
        }

        var obj = {};
        obj.id = $.id;
        obj.input = NOW.format('dd.MM.yyyy-HH:mm') + '_document_' + obj.id + '.' + file.extension;
        obj.inputpath = PATH.public('image/' + obj.input);
        obj.outputpath = PATH.public('temp/' + obj.id);

        FUNC.log(obj.id, { value: obj }, true);

        var uploadedfile = F.Fs.readFileSync(file.path);

        PATH.mkdir(PATH.public('temp/' + obj.id));

        F.Fs.writeFile(obj.inputpath, uploadedfile, async function (err, res) {
            if (err) {
                $.invalid(err);
                reject();
            } else {
                await extract(obj, $);
                var command = 'tar -czf {0}.tar.gz -C {0} .'.format(obj.outputpath);
                SHELL(command, function (err, response) {

                    console.log(err, response);
                    if (err) {
                        $.invalid('Error: ' + err);
                        reject();
                    } else {
                        // PATH.unlink(obj.inputpath);
                        // FUNC.log(obj.id, { success: true }, true);
                        resolve(obj.outputpath);
                    }
                });
            }
        });
    });
};

function extract(opt, $) {
    return new Promise(function (resolve, reject) {
        var command = 'ghostscript -o {0}/page_%03d.jpg -sDEVICE=jpeg -r300 -dJPEG=100 {1}'.format(opt.outputpath, opt.inputpath);
        SHELL(command, function (err, response) {
            if (err) {
                $.invalid('Error: ' + err);
                reject();
            } else
                resolve(true);
        });
    });
}
