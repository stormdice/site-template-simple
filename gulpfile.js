const gulp = require('gulp');

const { src, dest, series, watch, parallel } = gulp;

const plumber = require('gulp-plumber');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const rename = require('gulp-rename');
const webp = require('gulp-webp');
const browserSync = require('browser-sync').create();
const del = require('del');
const webpack = require('webpack-stream');
const svgstore = require('gulp-svgstore');
const validator = require('gulp-html');

const clean = () => del('build');

const buildHtml = () => src('src/*.html').pipe(dest('build/'));

const checkHtml = () => src('build/*.html').pipe(validator());

const styles = () =>
  src('src/sass/style.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(dest('build/css'))
    .pipe(browserSync.stream());

const scripts = () =>
  src('src/js/main.js')
    .pipe(plumber())
    .pipe(
      webpack({
        mode: 'production',
        output: {
          filename: 'main.js',
        },
        module: {
          rules: [
            {
              test: /\.js$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-env'],
                },
              },
            },
          ],
        },
      })
    )
    .pipe(dest('build/js/'))
    .pipe(browserSync.stream());

const sprite = () =>
  src('src/img/sprite/*.svg')
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename('sprite.svg'))
    .pipe(dest('build/img'));

const createWebp = () =>
  src('source/img/content/**/*.{png,jpg}')
    .pipe(webp({ quality: 90 }))
    .pipe(dest('build/img/content'));

const copyAssets = () =>
  src(['src/img/**', 'src/fonts/**/*.{woff,woff2}', 'src/*.ico'], {
    base: 'src',
  }).pipe(dest('build'));

const reload = (done) => {
  browserSync.reload();
  done();
};

const browserSyncServer = () => {
  browserSync.init({
    server: 'build/',
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });

  watch('src/sass/**/*.{scss,sass}', styles);
  watch('src/*.html', series(buildHtml, reload));
  watch('src/img/sprite/*.svg', series(sprite, reload));
  watch('src/js/**', scripts);
};

const build = series(
  clean,
  parallel(copyAssets, sprite, styles, scripts, buildHtml)
);
const start = series(build, browserSyncServer);

exports.createWebp = createWebp;
exports.build = build;
exports.start = start;
exports.checkHtml = checkHtml;
exports.createWebp = createWebp;
