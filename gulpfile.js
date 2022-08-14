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
import uglify from 'gulp-uglify';
import jsmin from 'gulp-jsmin';

const sass = gulpSass(dartSass);

const paths = {
    src: {
        html: '#src/*.html',
        mainHTML: ['#src/*.html', '!#src/_*.html'],
        scss: '#src/scss/style.scss',
        js: '#src/js/script.js',
        libjs: '#src/js/libs/*.js'
    },
    build: {
        html: 'dist/',
        css: 'dist/css/',
        js: 'dist/js/',
    },
    deletedFiles: {
        html: 'dist/*.html',
        css: 'dist/css/*.css',
        js: 'dist/js/*.js',
        libjs: ['dist/*.js', '!dist/js/script.js']
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


function server() {
    browserSync.init({
        server: {
            baseDir: './dist/'
        },
        notify: false,
        port: 3000
    })
}

function watcher() {
    gulp.watch(paths.src.html, html)
    gulp.watch(paths.src.scss, css)
    gulp.watch(paths.src.js, js)
    gulp.watch(paths.src.libjs, libjs)
}

const dev = gulp.series(html, css, js, libjs, gulp.parallel(server, watcher))
export default dev
