let project_folder = "dist";  // ПОКАЗЫВАЕМ ПАПКИ ПРОДАКШН 
let source_folder = "src";   // ИСХОДНИКИ

let fs = require('fs');

let path = {           // УКАЗЫВАЕМ ПУТИ ПРОДАКШН, ИСХОДНИКИ, СМОТРЕТЬ, ЧИСТИТЬ
  build: {
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/img/",
    fonts: project_folder + "/fonts/",
  },
  src: {
    html: source_folder + "/*.pug",
    css: source_folder + "/sass/style.sass",
    js: source_folder + "/js/script.js",
    img: source_folder + "/img/**/*.+(png|jpg|gif|ico|svg|webp)",
    fonts: source_folder + "/fonts/*.ttf",
  },
  watch: {
    html: source_folder + "/index.pug",
    css: source_folder + "/sass/**/*.sass",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/img/**/*.+(png|jpg|gif|ico|svg|webp)",
  },
  clean: "./" + project_folder + "/"
};

let { src, dest } = require('gulp'),         // СЮДА ПОДКЛЮЧАЕМ ВСЕ ПЛАГИНЫ
    gulp = require('gulp'),
    browsersync = require('browser-sync').create();
    fileinclude = require('gulp-file-include');
    del = require('del');
    sass = require('gulp-sass');
    autoprefixer = require('gulp-autoprefixer');
    group_media = require('gulp-group-css-media-queries');
    clean_css = require('gulp-clean-css');
    rename = require('gulp-rename');
    uglify = require('gulp-uglify-es').default;
    imagemin = require('gulp-imagemin');
    webp = require('gulp-webp');
    webphtml = require('gulp-webp-html');
    webpcss = require('gulp-webpcss');
    svgSprite = require('gulp-svg-sprite');
    ttf2woff = require('gulp-ttf2woff');
    ttf2woff2 = require('gulp-ttf2woff2');
    fonter = require('gulp-fonter');
    htmlmin = require('gulp-htmlmin');
    pug = require('gulp-pug');
    shorthand = require('gulp-shorthand');
    pugbem = require('gulp-pugbem');
    formathtml = require('gulp-format-html');

function browserSync() {
  browsersync.init({
    server: {
      baseDir: "./" + project_folder + "/"
    },
    port: 3000,
    notify: false
  })
};

function clean() {
  return del(path.clean);
};

function html() {
  return src(path.src.html)
    .pipe(
      pug({
        plugins: [pugbem]
      })
    )
    .pipe(webphtml())
    .pipe(formathtml())
    .pipe(dest(path.build.html))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(
      rename({
        extname: ".min.html"
      })
    )
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
};

function css() {
  return src(path.src.css)
    .pipe(
      sass({
        outputStyle: "expanded"
      })
    )
    .pipe(group_media())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 5 versions"],
        cascade: true
      })
    )
    .pipe(webpcss())
    .pipe(shorthand())
    .pipe(dest(path.build.css))
    .pipe(clean_css())
    .pipe(
      rename({
        extname: ".min.css"
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: ".min.js"
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
};

function images() {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3  // 0 to 7
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
};

function fonts() {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts));
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts));
};

gulp.task('otf2ttf', function () {
  return src([source_folder + "/fonts/*.otf"])
  .pipe(fonter({
    formats: ['ttf']
  }))
    .pipe(dest(source_folder + '/fonts/'));
});

gulp.task('svgSprite', function () {
  return gulp.src([source_folder + "/iconsprite/*.svg"])
  .pipe(svgSprite({
    mode: {
      stack: {
        sprite: "../icons/icons.svg", //имя спрайта
        example: true  //- создает html файл с примером иконок (вроде самого спрайта)
      }
    },
  }))
  .pipe(dest(path.build.img))
});

async function fontsStyle() {
  let file_content = fs.readFileSync(source_folder + '/sass/fonts.sass');
  if (file_content == '') {
    fs.writeFile(source_folder + '/sass/fonts.sass', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (let i = 0; i < items.length; i++) {
          let fontname = items[i].split('.');
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(source_folder + '/sass/fonts.sass', '@include font("' + fontname + '", "' + fontname + '", "400", "normal")\r\n', cb);
          }
          c_fontname = fontname;
        }
      }
    })
  }
};

function cb() {
  
};

function watchFiles() {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
};

// В ОДИН ТАСК ЗАПИХИВАЕМ НЕСКОЛЬКО ДРУГИХ

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle);  
let watch = gulp.parallel(build, watchFiles, browserSync);

// ДАЕМ НАЗВАНИЯ ТАСКАМ ДЛЯ ТЕРМИНАЛА

exports.clean = clean;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;