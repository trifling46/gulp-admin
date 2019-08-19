let gulp = require('gulp')
let path = require('path')
let browserSync = require('browser-sync')
let reload = browserSync.reload
let runSequence = require('run-sequence')
let clean = require('gulp-clean')

/***Less refer**/
let less = require('gulp-less')
let LessAutoprefix = require('less-plugin-autoprefix')
let autoprefix = new LessAutoprefix({
    browsers: ['last 2 versions', 'last 2 Chrome versions', '>5%', 'Firefox >= 20', 'ie 6-8', 'iOS 7']
})
let gulpBabel = require('gulp-babel')
let yargs = require('yargs').argv

gulp.task('build:less', function() {
    return (
        gulp.src('src/less/*.less')
            .pipe(
                less({
                    plugins: [autoprefix], //cleanCSSPlugin
                    paths: [path.join(__dirname, 'less', 'includes')]
                }).on('error', function(e) {
                    console.error(e.message)
                    this.emit('end')
                })
            )
            .pipe(gulp.dest('dist/css'))
            .pipe(reload({ stream: true }))
    )
})
gulp.task('build:script', function() {
    return gulp
        .src('src/js/*.js')
        .pipe(gulpBabel({
            presets: ['@babel/env']
        }))
        .pipe(gulp.dest('dist/js'))
        .pipe(reload({ stream: true }))
})
gulp.task('build:images', function() {
    return gulp
        .src('src/img/**')
        .pipe(gulp.dest('dist/img'))
        .pipe(reload({ stream: true }))
})
gulp.task('build:handlebars', function() {
    return gulp
        .src('src/handlebars/**')
        .pipe(gulp.dest('dist/handlebars'))
        .pipe(reload({ stream: true }))
})
gulp.task('build:lib', function() {
    return gulp
        .src('src/lib/**')
        .pipe(gulp.dest('dist/lib'))
        .pipe(reload({ stream: true }))
})
gulp.task('build:fonts', function() {
    return gulp
        .src('src/fonts/**')
        .pipe(gulp.dest('dist/fonts'))
        .pipe(reload({ stream: true }))
})
gulp.task('build:index', function() {
    return gulp
        .src('src/index.html')
        .pipe(gulp.dest('dist'))
        .pipe(reload({ stream: true }))
})
//清空项目
gulp.task('clean:project', function() {
    return gulp.src('dist/*').pipe(clean())
})

gulp.task('build:project', ['build:less', 'build:script',  'build:images','build:handlebars', 'build:lib', 'build:fonts','build:index'],function () {
})

gulp.task('watcher',['build:project'],  function() {
    gulp.watch('src/less/*.less', ['build:less'])
    gulp.watch('src/js/*.js', ['build:script'])
    gulp.watch('src/img/**', ['build:images'])
    gulp.watch('src/lib/**', ['build:lib'])
    gulp.watch('src/fonts/**', ['build:fonts'])
    gulp.watch('src/index.html', ['build:index'])
})
// 监视文件改动并重新载入
gulp.task('server', function() {
    yargs.p = yargs.p || 8000
    browserSync.init({
        server: {
            baseDir: 'dist'
        },
        port: yargs.p
    })
    gulp.start('watcher')
})

gulp.task('default', function() {
    runSequence('clean:project', ['build:project'], function() {
        gulp.start('server')
    })
})
gulp.start('default')
