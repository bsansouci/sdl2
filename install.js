var unzip = require('unzip');
var fs = require('fs');
var http = require('http');
var childProcess = require('child_process');
var path = require('path');

var SDLName = "SDL2-2.0.5";

var options = {
  host: 'www.libsdl.org',
  path: '/release/'+SDLName+'.zip'
};

var req = http.get(options, function(res) {
  console.log('got statusCode: ' + res.statusCode);
  if (res.statusCode != 200) {
    throw "Got statusCode " + res.statusCode;
  }
  fs.mkdir('tmp', function() {
    var tmpFolder = path.join(__dirname, 'tmp');
    var unzipExtractor = unzip.Extract({ path: tmpFolder});
    unzipExtractor.on('error', function(err) {
      throw err;
    });
    unzipExtractor.on('close', function(){
      var pathToSDLSource = path.join(__dirname, 'src');
      // Rename tmp/SDL2-2.0.5 to be simply src for the package.json.
      fs.rename(path.join(tmpFolder, SDLName), pathToSDLSource, function(err, stdout, stderr){
        if (err) {
          console.log("Error renaming:", err);
          return;
        }

        // Remove tmp dir.
        fs.rmdir(tmpFolder, function(err, stdout, stderr) {
          if (err) {
            console.log("Error while removing tmp folder", err);
            return;
          }

          // Something somethig execute permissions
          fs.chmod(path.join(pathToSDLSource, "configure"), '777', function(err, stdout, stderr){
            if (err) {
              console.log("Error changing permissions on configure file:", err);
              return;
            }
            console.log(stdout);
            console.log('Running ./configure in', pathToSDLSource);
            childProcess.exec(path.join(pathToSDLSource, 'configure'), {cwd: pathToSDLSource}, function(err, stdout, stderr) {
              if (err) {
                console.log("Error running configure script:", err);
                return;
              }
              console.log(stdout);
              console.log('Running make in', pathToSDLSource);
              childProcess.exec('make', {cwd: pathToSDLSource}, function(err, stdout, stderr) {
                if (err) {
                  console.log("Error running make:", err);
                  return;
                }
                console.log(stdout);
                console.log("Done!");
              });
            });
          });
        });
      });
    });
    var file = fs.createWriteStream(SDLName + ".zip");
    res.pipe(file);
    res.on('end', function() {
      var readStream = fs.createReadStream(SDLName + ".zip");
      readStream.pipe(unzipExtractor);
    });
  });
});

req.on('error', function(e) {
  console.log('ERROR: ' + e.message);
});
