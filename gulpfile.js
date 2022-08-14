import gulp from 'gulp'
import del from 'del';
import plumber from "gulp-plumber";
import notify from "gulp-notify";
import browserSync from "browser-sync"
import fileinclude from 'gulp-file-include'
import autoprefixer from "gulp-autoprefixer";
import groupMediaQueries from 'gulp-group-css-media-queries';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);

const paths = {
    src: {
        html: '#src/*.html',
        mainHTML: ['#src/*.html', '!#src/_*.html'],
        scss: '#src/scss/style.scss',
    },
    build: {
        html: 'dist/',
        css: 'dist/css/'
    },
    deletedFiles: {
        css: 'dist/css/*.css',
        html: 'dist/*.html',
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
            overrideBrowserslist:  ['last 2 versions'],
            cascade: false
        }))
        .pipe(sass())
        .pipe(groupMediaQueries())
        .pipe(gulp.dest(paths.build.css))
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
}
const dev = gulp.series(html, css, gulp.parallel(server, watcher))
export default dev
