"use strict";

// Load plugins
const browsersync = require("browser-sync").create();
const del = require("del");
const gulp = require("gulp");
const merge = require("merge-stream");
var nunjucksRender = require('gulp-nunjucks-render');

// BrowserSync
function browserSync(done) {
    browsersync.init({
        server: {
            baseDir: "./"
        },
        port: 3000
    });
    done();
}

// BrowserSync reload
function browserSyncReload(done) {
    browsersync.reload();
    done();
}

// Clean vendor
function clean() {
    return del(["./vendor/"]);
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
    // // Bootstrap
    // var bootstrap = gulp.src('./node_modules/bootstrap/dist/**/*')
    //     .pipe(gulp.dest('./vendor/bootstrap'));
    // jQuery
    var jquery = gulp.src([
        './node_modules/jquery/dist/*',
        '!./node_modules/jquery/dist/core.js'
    ])
        .pipe(gulp.dest('./vendor/jquery'));
    return merge( jquery);
}

// Watch files
function watchFiles() {
    gulp.watch("./**/*.css", browserSyncReload);
    gulp.watch("./**/*.html", browserSyncReload);
    gulp.watch("./**/*.njk", browserSyncReload);
}

function nunjucks() {
    // Gets .html and .nunjucks files in pages
    return gulp.src('pages/**/*.+(html|nunjucks|njk)')
        // Renders template with nunjucks
        .pipe(nunjucksRender({
            path: ['templates']
        }))
        // output files in app folder
        .pipe(gulp.dest('.'))
}


// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor,nunjucks);
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
exports.clean = clean;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.default = watch;
exports.nunjucks = nunjucks
