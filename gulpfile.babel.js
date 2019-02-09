var gulp = require('gulp');
var babel = require('gulp-babel');
var del = require('del');
var zip = require('gulp-zip');
import manifest from './manifest.json';

gulp.task('js', function() {
  return gulp
    .src('app/**/*.js')
    .pipe(
      babel({
        presets: ['@babel/env'],
      }),
    )
    .pipe(gulp.dest('dest/app'));
});

gulp.task('app', function() {
  return gulp.src(['app/**', '!app/**/*.js']).pipe(gulp.dest('dest/app'));
});

gulp.task('project', function() {
  return gulp.src(['manifest.json', 'README.md']).pipe(gulp.dest('dest'));
});

gulp.task('lib', function() {
  return gulp
    .src([
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/angular/angular.min.js',
      'node_modules/bootstrap/dist/css/bootstrap.min.css',
      'node_modules/angular-ui-validate/dist/validate.min.js',
      'node_modules/prismjs/themes/prism.css',
      'node_modules/prismjs/prism.js',
      'node_modules/prismjs/components/prism-javascript.min.js',
    ])
    .pipe(gulp.dest('dest/lib'));
});

gulp.task('clean', function() {
  return del(['dest']);
});

gulp.task('zip', function() {
  return gulp
    .src('dest/**')
    .pipe(zip('tab-rotate-' + manifest.version + '.zip'))
    .pipe(gulp.dest('zip'));
});

gulp.task('default', gulp.series('clean', 'project', 'app', 'js', 'lib'));
