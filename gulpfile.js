var gulp = require('gulp');
var del = require('del');
var zip = require('gulp-zip');
var manifest = require('./manifest.json');
var mainBowerFiles = require('main-bower-files');

gulp.task('app', function() {
	return gulp.src('**/app/**').pipe(gulp.dest('dest'));
});

gulp.task('project', function() {
	return gulp.src(['manifest.json', 'README.md']).pipe(gulp.dest('dest'));
});

gulp.task('bower', function() {
	return gulp.src([
		  '**/jquery.min.js'
		, '**/angular.min.js'
		, '**/bootstrap.min.css'

	])
	.pipe(gulp.dest('dest'));
});

// gulp.task('bower_foo', function() {
//     return gulp.src(mainBowerFiles(/* options */), { base: 'bower_components' })
//         .pipe(gulp.dest('dest/bower_components'))
// });

gulp.task('clean', function() {
	return del(['dest']);
});

gulp.task('zip', function () {
	return gulp.src('dest/**')
		.pipe(zip('tab-rotate-' + manifest.version + '.zip'))
		.pipe(gulp.dest('zip'));
});

gulp.task('default', ['clean', 'project', 'app', 'bower', 'zip']);
