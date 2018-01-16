const path = require('path');
const helpers = require('yeoman-test');
const assert = require('yeoman-assert');
const fs = require('fs-extra');
const cp = require('child_process');
const rp = require('request-promise');

// Start a process and wait either for it to exit
// or to display a certain text
function startAndWait (cmd, args, options, text) {
  console.log('start startAndWait');
  return new Promise((resolve, reject) => {
    let buffer = '';

    console.log('before spawn child', cmd, args, options);
    const child = cp.spawn(cmd, args, options);
    console.log('after spawn child');
    const addToBuffer = data => {
      buffer += data;

      if (text && buffer.indexOf(text) !== -1) {
        resolve({ buffer, child });
      }
    };

    child.stdout.on('data', addToBuffer);
    child.stderr.on('data', addToBuffer);

    child.on('exit', status => {
      console.log('exit spawn child', status);
      if (status !== 0) {
        return reject(new Error(buffer));
      }

      resolve({ buffer, child });
    });
  });
}

function delay (ms) {
  return function (res) {
    return new Promise(resolve => setTimeout(() => resolve(res), ms));
  };
}

describe('scaffolding.test.js', function () {
  let appDir;

  function runTest (expectedText) {
    return startAndWait('npm', ['test'], {cwd: appDir})
      .then(({buffer}) => {
        assert.ok(buffer.indexOf(expectedText) !== -1,
          'Ran test with text: ' + expectedText);
      });
  }

  beforeEach(() => {
    console.log('start beforeEach');
    return helpers.run(path.join(__dirname, '..', 'generators', 'app'))
      .inTmpDir(dir => {
        appDir = dir;
        console.log('temp dir is', dir);
        console.log('before file copy');
        fs.copySync(path.join(__dirname, './dir1/feathers-gen-specs.json'), path.join(`${dir}/feathers-gen-specs.json`));
        console.log('after file copy');
      })
      .withPrompts({
        name: 'app1',
        providers: ['rest', 'socketio'],
        src: 'src1',
        //packager: 'yarn@>= 0.18.0',
        packager : 'npm@>= 3.0.0',
      })
      .withOptions({
        skipInstall: false
      });
  });

  it('feathers:app', () => {
    console.log('start feathers:app');

    assert.file('config/default.json');

    return runTest('starts and shows the index page')
      .then(() => console.log('after runTest'))
      .then(() => {
        const pkg = require(path.join(appDir, 'package.json'));

        assert.ok(pkg.devDependencies.mocha, 'Added mocha as a devDependency');
      });
  });
});
