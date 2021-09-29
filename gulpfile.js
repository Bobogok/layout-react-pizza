const { src, dest, watch, parallel, series } = require('gulp');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const autoprefixer = require('gulp-autoprefixer');
const imagemin = require('gulp-imagemin');
const del = require('del');
const changed = require('gulp-changed');
const plumber = require('gulp-plumber');
const zip = require('gulp-zip');
const size = require('gulp-size');
const homeDir = require('os').homedir();
const fileName = require('path').basename(__dirname);

function browsersync() {
  browserSync.init({
    server: {
      baseDir: 'public'
    },
    open: false,
    port: 1337
  });
}

function zips() {
  const date = new Date().toJSON();
  const newStr = `${date}--${fileName}`.replace(/:/g, '.');
  const color = '\x1b[1m%s\x1b[0m';

  console.log(color, `File saved: ${homeDir}\\Desktop\\${newStr}.zip`);

  return src(['dist/**/*'])
    .pipe(plumber())
    .pipe(zip(`${newStr}.zip`))
    .pipe(size())
    .pipe(dest(`${homeDir}/Desktop`));
}

function images() {
  return src('public/img/**/*')
    .pipe(changed('dist/images'))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }]
        })
      ])
    )
    .pipe(dest('dist/images'));
}

function cleanDist() {
  return del('dist');
}

function scripts() {
  return src('src/js/*.js')
    .pipe(plumber())
    .pipe(concat('app.min.js'))
    .pipe(terser())
    .pipe(dest('public/js'))
    .pipe(browserSync.stream());
}

function styles() {
  return src('src/styles/index.scss')
    .pipe(plumber())
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(concat('style.min.css'))
    .pipe(
      autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {
        cascade: false,
        grid: true
      })
    )
    .pipe(dest('public/css'))
    .pipe(browserSync.stream());
}

function build() {
  return src(['public/css/style.min.css', 'public/fonts/**/*', 'public/js/app.min.js', 'public/index.html'], {
    base: 'public'
  })
    .pipe(size())
    .pipe(dest('dist'));
}

function watching() {
  watch(['src/styles/**/*.scss'], styles);
  watch(['src/js/*.js'], scripts);
  watch('public/*.html').on('change', browserSync.reload);
}

exports.styles = styles;
exports.watching = watching;
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.images = images;
exports.cleanDist = cleanDist;
exports.zips = zips;

exports.build = series(cleanDist, images, build);
exports.default = parallel(styles, scripts, browsersync, watching);
