var gulp = require('gulp');
var del = require('del');
var mainBowerFiles = require('main-bower-files');


gulp.task('source', function() {
  return gulp.src(['*.html', '*.js', '*.json', '*.css'])
  	.pipe(gulp.dest('dest'));
});

gulp.task('img', function() {
	return gulp.src('**/img/**').pipe(gulp.dest('dest'));
});

gulp.task('bower', function() {
  return gulp.src([
  		  '**/jquery.min.js'
  		, '**/angular.min.js'
  		, '**/bootstrap.min.css'

  	])
  .pipe(gulp.dest('dest'));
});

gulp.task('bower_foo', function() {
    return gulp.src(mainBowerFiles(/* options */), { base: 'bower_components' })
        .pipe(gulp.dest('dest/bower_components'))
});

gulp.task('clean', function() {
	return del(['dest']);
});

gulp.task('default', ['clean', 'source', 'img', 'bower']);
