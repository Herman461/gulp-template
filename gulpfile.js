import gulp from 'gulp'
import del from 'del';
import plumber from "gulp-plumber";
import notify from "gulp-notify";
import browserSync from "browser-sync";
import fileinclude from 'gulp-file-include';
import autoprefixer from "gulp-autoprefixer";
import groupMediaQueries from 'gulp-group-css-media-queries';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import babel from 'gulp-babel';
import strip from 'gulp-strip-comments';
import formatHtml from 'gulp-format-html';
import rename from 'gulp-rename';
import jsmin from 'gulp-jsmin';
import imagemin from "gulp-imagemin";
import mozjpeg from 'imagemin-mozjpeg';
import pngquant from 'imagemin-pngquant';
import webp from 'gulp-webp';
import webpcss from 'gulp-webpcss';
import ttf2woff2 from 'gulp-ttftowoff2';
import ttf2woff from 'gulp-ttf2woff';
import cheerio from 'gulp-cheerio';
import sprite from 'gulp-svg-sprite';
import * as fs from "fs";

const sass = gulpSass(dartSass);

const paths = {
    src: {
        html: '#src/*.html',
        mainHTML: ['#src/*.html', '!#src/_*.html'],
        scss: '#src/scss/style.scss',
        js: '#src/js/script.js',
        libjs: '#src/js/libs/*.js',
        images: ['#src/images/*.{jpg,jpeg,png,gif}', '#src/images/**/*.{jpg,jpeg,png,gif}', '!#src/images/icons/iconsprite/*'],
        fonts: '#src/fonts/**/*.ttf',
        fontScss: '#src/scss/fonts.scss',
        iconsprite: ['#src/images/icons/iconsprite/*.svg']
    },
    build: {
        html: 'dist/',
        css: 'dist/css/',
        js: 'dist/js/',
        images: 'dist/images/',
        fonts: 'dist/fonts/',
        icons: 'dist/images/icons/'
    },
    deletedFiles: {
        html: 'dist/*.html',
        css: 'dist/css/*.css',
        js: 'dist/js/*.js',
        libjs: ['dist/*.js', '!dist/js/script.js'],
        images: 'dist/images/**/*.{jpg,jpeg,png,gif}',
        fonts: 'dist/fonts/**/*.ttf'
    }
}


async function html(cb) {
    await del(paths.deletedFiles.html)
    return gulp.src(paths.src.mainHTML)
        .pipe(plumber(
            notify.onError({
                title: 'HTML',
                message: 'Error <%= error.message %>'
            })
        ))
        .pipe(fileinclude())
        .pipe(strip.html())
        .pipe(formatHtml({
            indent_size: 4
        }))
        .pipe(gulp.dest(paths.build.html))
        .pipe(browserSync.stream())
}

async function css(cb) {
    await del(paths.deletedFiles.css)
    return gulp.src(paths.src.scss)
        .pipe(plumber(
            notify.onError({
                title: 'SCSS',
                message: 'Error <%= error.message %>'
            })
        ))
        .pipe(autoprefixer({
            grid: "autoplace",
            overrideBrowserslist: ['last 2 versions'],
            cascade: false
        }))
        .pipe(sass())
        .pipe(groupMediaQueries())
        .pipe(webpcss({webpClass: '', noWebpClass: '.no-webp'}))
        .pipe(gulp.dest(paths.build.css))
        .pipe(browserSync.stream())
}

async function js(cb) {
    await del(paths.deletedFiles.js)
    return gulp.src(paths.src.js)
        .pipe(plumber(
            notify.onError({
                title: 'Script JS',
                message: 'Error <%= error.message %>'
            })
        ))
        .pipe(fileinclude())
        .pipe(babel({
            presets: ["@babel/preset-env"]
        }))
        .pipe(gulp.dest(paths.build.js))
        .pipe(jsmin())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest(paths.build.js))
        .pipe(browserSync.stream())
}

async function libjs() {
    await del(paths.deletedFiles.libjs)
    return gulp.src(paths.src.libjs)
        .pipe(plumber(
            notify.onError({
                title: 'LIB JS',
                message: 'Error <%= error.message %>'
            })
        ))
        .pipe(gulp.dest(paths.build.js))
}

async function images() {
    await del(paths.deletedFiles.images)
    return gulp.src(paths.src.images)
        .pipe(plumber(
            notify.onError({
                title: 'IMAGES',
                message: 'Error <%= error.message %>'
            })
        ))
        .pipe(imagemin([
            pngquant({quality: [0.5, 0.5]}),
            mozjpeg({quality: 50})
        ]))
        .pipe(gulp.dest(paths.build.images))
        .pipe(webp({quality: 70}))
        .pipe(gulp.dest(paths.build.images))
}

async function ttf(done) {
    await del(paths.deletedFiles.fonts)

    gulp.src(paths.src.fonts)
        .pipe(ttf2woff())
        .pipe(gulp.dest(paths.build.fonts))

    gulp.src(paths.src.fonts)
        .pipe(ttf2woff2())
        .pipe(gulp.dest(paths.build.fonts))

    done()
}

function fontStyle(done) {
    fs.writeFile(paths.src.fontScss, '', () => {});
    fs.readdir(paths.build.fonts, (err, items) => {
        if (items) {
            let c_fontname;
            for (let i = 0; i < items.length; i++) {
                let fontname = items[i].split('.'),
                    fontExt;
                fontExt = fontname[1];
                fontname = fontname[0];
                if (c_fontname !== fontname) {
                    if (fontExt === 'woff' || fontExt === 'woff2') {
                        fs.appendFile(paths.src.fontScss, `@include font-face("${fontname}", "${fontname}", 400);\r\n`, () => {});
                    }
                }
                c_fontname = fontname;
            }
        }
    })
    done();
}


function server() {
    browserSync.init({
        server: {
            baseDir: './dist/'
        },
        notify: false,
        port: 3000
    })
}

function svgSprite() {
    return gulp.src(paths.src.iconsprite)
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').attr('stroke', 'currentColor');
                // $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(sprite({
            mode: {
                stack: {
                    sprite: "../icons.svg"
                }
            }
        }))
        .pipe(gulp.dest(paths.build.icons))
}

function watcher() {
    gulp.watch(paths.src.html, html)
    gulp.watch(paths.src.scss, css)
    gulp.watch(paths.src.js, js)
    gulp.watch(paths.src.libjs, libjs)
    gulp.watch(paths.src.images, images)
}

const dev = gulp.series(html, css, js, libjs, images, gulp.parallel(server, watcher))
const fonts = gulp.series(ttf, fontStyle)
export default dev
export {fonts, svgSprite}
