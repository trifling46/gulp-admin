let gulp = require('gulp')
let argv = require('yargs').argv

gulp.task('default', function() {
    if (argv.d) {
        require('./build/dev')
    } else {
        require('./build/pro')
    }
})
