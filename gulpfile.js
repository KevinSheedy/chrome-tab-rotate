var gulp = require('gulp');
var del = require('del');
var zip = require('gulp-zip');
var manifest = require('./manifest.json');

gulp.task('app', function() {
	return gulp.src('app/**').pipe(gulp.dest('dest/app'));
});

gulp.task('project', function() {
	return gulp.src(['manifest.json', 'README.md']).pipe(gulp.dest('dest'));
});

gulp.task('bower', function() {
	return gulp.src([
		  'bower_components/**/jquery.min.js'
		, 'bower_components/**/angular.min.js'
		, 'bower_components/**/bootstrap.min.css'
		, 'bower_components/**/angular-ui.min.js'
		, 'bower_components/**/validate.js'
		, 'bower_components/**/prism.css'
		, 'bower_components/**/prism.js'
		, 'bower_components/**/prism-javascript.min.js'

	])
	.pipe(gulp.dest('dest/bower_components'));
});

gulp.task('clean', function() {
	return del(['dest']);
});

gulp.task('zip', function () {
	return gulp.src('dest/**')
		.pipe(zip('tab-rotate-' + manifest.version + '.zip'))
		.pipe(gulp.dest('zip'));
});

gulp.task('default', ['clean', 'project', 'app', 'bower']);
