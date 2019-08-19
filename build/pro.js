let gulp = require('gulp')
let path = require('path')
let browserSync = require('browser-sync')
let reload = browserSync.reload
let runSequence = require('run-sequence')
let clean = require('gulp-clean')
let htmlReplace = require('gulp-html-replace')
let cleanCSS = require('gulp-clean-css')
let uglify = require('gulp-uglify')
let concat = require('gulp-concat')
// let assetRev = require('gulp-asset-rev')
/**图片压缩**/
let imagemin = require('gulp-imagemin')
let cache = require('gulp-cache');
/***Less refer**/
let less = require('gulp-less')
let LessAutoprefix = require('less-plugin-autoprefix')
let autoprefix = new LessAutoprefix({
    browsers: ['last 2 versions', 'last 2 Chrome versions', '>5%', 'Firefox >= 20', 'ie 6-8', 'iOS 7']
})
let gulpBabel = require('gulp-babel')
let yargs = require('yargs').argv

let rev = require('gulp-rev') //- 对文件名加MD5后缀
let revCollector = require('gulp-rev-collector')

//编译源文件
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
            .pipe(concat('all.min.css'))
            .pipe(cleanCSS())
            .pipe(rev())
            .pipe(gulp.dest('dist/css'))
            .pipe(rev.manifest())
            .pipe(gulp.dest('rev/css'))
            .pipe(reload({ stream: true }))
    )
})
gulp.task('build:script', function() {
    return gulp
        .src('src/js/*.js')
        .pipe(gulpBabel({
            presets: ['@babel/env']
        }))
        .pipe(concat('all.min.js'))
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest('dist/js'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/js'))
        .pipe(reload({ stream: true }))
})
gulp.task('build:images', function() {
    return gulp
        .src('src/img/**')
        .pipe(cache(imagemin()))
        .pipe(rev())
        .pipe(gulp.dest('dist/img'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/img'))
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
gulp.task('build:html', function() {
    return gulp
        .src('src/index.html')
        .pipe(htmlReplace({
            js: './js/all.min.js',
            css: './css/all.min.css'
        }))
        .pipe(gulp.dest('dist'))
        .pipe(reload({ stream: true }))
})
//同步版本号
gulp.task('rev:html', function () {
    return gulp
        .src(['rev/**/*.json', 'dist/index.html'])
        .pipe(revCollector())
        .pipe(gulp.dest('dist'))
})
gulp.task('rev:css', function () {
    return gulp
        .src(['rev/**/*.json', 'dist/css/*.css'])
        .pipe(revCollector())
        .pipe(gulp.dest('dist/css'))
})
gulp.task('rev:js', function () {
    return gulp
        .src(['rev/**/*.json', 'dist/js/*.js'])
        .pipe(revCollector())
        .pipe(gulp.dest('dist/js'))
})
gulp.task('rev:template', function () {
    return gulp
        .src(['rev/**/*.json', 'dist/handlebars/*.htm'])
        .pipe(revCollector())
        .pipe(gulp.dest('dist/handlebars'))
})
//清空项目
gulp.task('clean:project', function() {
    return gulp.src('dist/*').pipe(clean())
})
// 构建项目
gulp.task('build:project', ['build:less', 'build:script',  'build:images','build:handlebars', 'build:lib', 'build:fonts','build:html'],function () {
    console.log('build:project end')})
// 同步版本 构建后
gulp.task('build:rev', ['rev:html', 'rev:css','rev:js','rev:template'],function () { console.log('build:rev end')})

gulp.task('watcher', function() {
    gulp.watch('src/less/*.less', ['build:less'])
    gulp.watch('src/js/*.js', ['build:script'])
    gulp.watch('src/img/**', ['build:images'])
    gulp.watch('src/lib/**', ['build:lib'])
    gulp.watch('src/fonts/**', ['build:fonts'])
    gulp.watch('src/index.html', ['build:html'])
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
    runSequence('clean:project','build:project','build:rev', function() {
        //gulp.start('server')
        // 生产构建 不能监听文件改动 会导致再次动态生产文件，而引用未变
    })
})
//gulp.start('build:rev')
