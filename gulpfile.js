import gulp from 'gulp'
import del from 'del';
import htmlhint from 'gulp-htmlhint'
import plumber from "gulp-plumber";
import notify from "gulp-notify";
import browserSync from "browser-sync"
import fileinclude from 'gulp-file-include'

const paths = {
    src: {
        html: '#src/*.html',
        mainHTML: ['#src/*.html', '!#src/_*.html']
    },
    build: {
        root: 'dist/',
        html: 'dist/*.html'
    }
}


async function html(cb) {
    await del(paths.build.html)
    return gulp.src(paths.src.mainHTML)
        .pipe(plumber(
            notify.onError({
                title: 'HTML',
                message: 'Error <%= error.message %>'
            })
        ))
        .pipe(fileinclude())
        .pipe(gulp.dest(paths.build.root))
        .pipe(browserSync.stream())

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
}
const dev = gulp.series(html, gulp.parallel(server, watcher))
export default dev
