const lockfile = require('@yarnpkg/lockfile');
const pkgUp = require('pkg-up');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

module.exports = function(packageName) {
  const pkgPath = pkgUp.sync();
  const pkgJson = require(pkgPath);
  const yarnLockPath = path.join(pkgPath, '../yarn.lock');
  const yarnLockContent = fs.readFileSync(yarnLockPath, 'utf-8');
  const json = lockfile.parse(yarnLockContent);

  if (json.type !== 'success') {
    console.warn('Unable to parse yarn.lock');
    process.exit(1);
  }

  const yarnLock = json.object;

  for (const key in yarnLock) {
    const pkg = yarnLock[key];
    for (const depName of ['dependencies', 'optionalDependencies']) {
      if (depName in pkg) {
        for (const dep in pkg[depName]) {
          const version = pkg[depName][dep];
          const parent = yarnLock[`${dep}@${version}`];
          (parent.dependents = parent.dependents || []).push(key);
        }
      }
    }
    (pkg.specifiers = pkg.specifiers || []).push(key);
  }

  const packages = Object.keys(yarnLock).filter(key =>
    key.startsWith(packageName + '@')
  );
  if (packages.length) {
    packages
      .filter((pkg, index) => {
        return (
          packages
            .map(p => yarnLock[p].version)
            .findIndex(v => v === yarnLock[pkg].version) === index
        );
      })
      .forEach(pkgName => {
        const pkg = yarnLock[pkgName];
        const pkgWithoutVersion = pkgName.slice(0, pkgName.lastIndexOf('@'));

        console.log(chalk.blue.bold.underline(pkgWithoutVersion + '@' + pkg.version));
        console.log('Specified using:');
        pkg.specifiers.forEach(specifier => {
          console.log(' - ' + specifier);
        });

        if (pkg.dependents) {
          console.log('Due to: ');
          pkg.dependents.forEach(dep => {
            console.log(' - ' + dep);
          });
          console.log();
          return;
        }

        // deps and devDeps
        for(const depName of ["dependencies", "devDependencies"]) {
          if (pkgJson[depName] && pkgJson[depName][pkgWithoutVersion]) {
            console.log(`Installed because specified as ${chalk.blue('"' + depName + '"')} in "package.json"`);
            console.log();
            return;
          }
        }

        // no reason ¯\_(ツ)_/¯
        console.log('Installed for no reason ¯\_(ツ)_/¯');
        console.log();
      });
  } else {
    // last try
    for(const depName of ["dependencies", "devDependencies"]) {
      if (pkgJson[depName] && pkgJson[depName][packageName]) {
        console.log(`Found it specified as ${chalk.blue('"' + depName + '"')} in "package.json", but ${chalk.red('couldn\'t find it in')} "yarn.lock".`);
        console.log('- Possibly symlinked due to lerna project, or forgot to update "yarn.lock" file.')
        return;
      }
    }

    // not found
    console.log(`${packageName} ${chalk.red('not found in')} "yarn.lock"`);
  }
};

