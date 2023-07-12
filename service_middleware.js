var child_process = require('child_process');
process.chdir('./corrently-current/');
child_process.execSync('npm install',{stdio:[0,1,2]});
child_process.exec('node main.js',{stdio:[0,1,2]});
process.chdir('../');
