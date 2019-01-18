const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const streamqueue = require('streamqueue');
// -----------------------------------------------------------
// minify css
gulp.task('css', function() {
  return streamqueue({ objectMode: true },
    gulp.src('stylesheets/linker.css'),
    gulp.src('stylesheets/bootstrap.min.css'),
    gulp.src('stylesheets/base.css'),
    gulp.src('stylesheets/footer.css'),
    gulp.src('stylesheets/leaflet.css'),
    gulp.src('stylesheets/leaflet-gesture-handling.css')
  )
    .pipe(concat('app.min.css'))
    .pipe(gulp.dest('public/stylesheets'));
});
// -----------------------------------------------------------
// Concatenate & Minify JS
gulp.task('js', function() {
  return streamqueue({ objectMode: true },
    gulp.src('javascripts/angular/angular_1.5.8.min.js'),
    gulp.src('javascripts/angular/angular_1.5.8-animate.min.js'),
    gulp.src('javascripts/angular/main.js'),
    gulp.src('javascripts/angular/controllers.js'),
    gulp.src('javascripts/ui-bootstrap-tpls-2.5.0.js'),
    gulp.src('javascripts/jquery.min.js'),
    gulp.src('javascripts/leaflet-src.js'),
    gulp.src('javascripts/leaflet-gesture-handling.js'),
  )
    .pipe(concat('app.js'))
    .pipe(uglify())
    .pipe(gulp.dest('public/javascripts'));
});
// -----------------------------------------------------------
// Default Task
gulp.task('default', gulp.series(['js', 'css']));
// -----------------------------------------------------------
