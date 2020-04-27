'use strict';

const gulp = require('gulp');
const webpack = require('webpack-stream');
const webpackUglifyJs = require('uglifyjs-webpack-plugin')
const sass = require('gulp-sass');
const tildeImporter = require('node-sass-tilde-importer');
const browserSync = require('browser-sync');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const changed = require('gulp-changed');
const del = require('del');
const sequence = require('run-sequence');
const pkg = require('./package.json')
var nunjucksRender = require('gulp-nunjucks-render');

var production = false;

const file = {
  html: 'src/**/*.html',
  scss: 'src/assets/scss/**/*.scss',
  js: 'src/assets/js/src/**/*.js',
}

const page = {
  js: 'src/assets/js/src/page.js',
  scss: 'src/assets/scss/page.scss',
}

const dir = {
  css: 'dist/assets/css/',
  js: 'dist/assets/js/',
  font: 'dist/assets/fonts/',
}


function reload(done) {
  browserSync.reload();
  done();
};

function serve(done) {
  browserSync({
    server: 'dist/'
  });

  gulp.watch(file.scss, scss);
  gulp.watch(file.js, gulp.series(js, reload));
  gulp.watch(file.html, gulp.series(nunjucks, reload));
  done();
};

function nunjucks() {
  // Gets .html and .nunjucks files in pages
  return gulp.src('src/**/*.+(html|nunjucks)')
    // Renders template with nunjucks
    .pipe(nunjucksRender({
      path: ['src/templates']
    }))
    // output files in app folder
    .pipe(gulp.dest('dist'))
}


function scss() {

  var stream = gulp.src(page.scss)
    .pipe(sourcemaps.init())
    .pipe(rename({ suffix: '.min' }))
    .pipe(sass({ importer: tildeImporter, outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(dir.css))
    .pipe(browserSync.stream());

  // Create unminified version if it's in production mode
  if (production) {
    stream = gulp.src(page.scss)
      .pipe(sourcemaps.init())
      .pipe(sass({ importer: tildeImporter }).on('error', sass.logError))
      .pipe(autoprefixer())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(dir.css));
  }
  return stream;
};

function js() {
  return gulp.src(page.js)
    .pipe(webpack({
      mode: 'none',
      devtool: 'source-map',
      output: {
        filename: 'page.min.js'
      }
    }))
    .pipe(gulp.dest(dir.js));
};

function jsProductionMinified() {
  return gulp.src(page.js)
    .pipe(webpack({
      mode: 'production',
      devtool: 'source-map',
      output: {
        filename: 'page.min.js'
      },
      performance: {
        hints: false
      }
    }))
    .pipe(gulp.dest(dir.js));
};


function jsProductionExpanded() {
  return gulp.src(page.js)
    .pipe(webpack({
      mode: 'none',
      devtool: 'source-map',
      output: {
        filename: 'page.js'
      }
    }))
    .pipe(gulp.dest(dir.js));
};


/*
|--------------------------------------------------------------------------
| Copy
|--------------------------------------------------------------------------
|
*/
function copyFonts(done) {
  //gulp.src( 'node_modules/@fortawesome/fontawesome-free-webfonts/webfonts/*').pipe(gulp.dest(dir.font));
  gulp.src('node_modules/font-awesome/fonts/*').pipe(gulp.dest(dir.font));
  gulp.src('node_modules/themify-icons/themify-icons/fonts/*').pipe(gulp.dest(dir.font));
  gulp.src('node_modules/et-line/fonts/*').pipe(gulp.dest(dir.font));
  done();
};

function distCopy() {
  return gulp.src(['src/**/*', '!src/assets/{js/src,plugin/thesaas,scss}{,/**}', '!src/**/*.html']).pipe(gulp.dest('dist/'));
};


/*
|--------------------------------------------------------------------------
| Clean /dist directory
|--------------------------------------------------------------------------
|
*/
function distClean() {
  return del('dist/');
};

/*
|--------------------------------------------------------------------------
| Img
|--------------------------------------------------------------------------
|
*/
function img() {
  return gulp.src('src/assets/img/**/*.{jpg,jpeg,png,gif}')
    .pipe(imagemin())
    .pipe(gulp.dest('dist/assets/img/'));
};

/*
|--------------------------------------------------------------------------
| Tasks
|--------------------------------------------------------------------------
|
*/
function setProductionMode(done) {
  production = true;
  done();
}

function setDevMode(done) {
  production = false;
  done();
}



exports.dev = gulp.series(copyFonts, scss, js);
exports.dist = gulp.series(setProductionMode, distClean, copyFonts, scss, nunjucks, jsProductionMinified, jsProductionExpanded, distCopy, setDevMode);
exports.watch = gulp.series(distCopy, nunjucks, serve)
exports.default = exports.watch
exports.nunjucks = nunjucks
