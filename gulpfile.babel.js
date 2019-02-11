import gulp from 'gulp';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import del from 'del';
import zip from 'gulp-zip';
import sourcemaps from 'gulp-sourcemaps';
import rollup from 'gulp-better-rollup';
import manifest from './manifest.json';

gulp.task('js', function() {
  return (
    gulp
      .src('src/**/*.js')
      .pipe(sourcemaps.init())
      .pipe(
        rollup(
          {
            // There is no `input` option as rollup integrates into the gulp pipeline
            plugins: [
              resolve(),
              commonjs(),
              babel({ runtimeHelpers: true }),
              json(),
            ],
          },
          {
            // Rollups `sourcemap` option is unsupported. Use `gulp-sourcemaps` plugin instead
            format: 'iife',
          },
        ),
      )
      // inlining the sourcemap into the exported .js file
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('build/src'))
  );
});

gulp.task('src', function() {
  return gulp.src(['src/**', '!src/**/*.js']).pipe(gulp.dest('build/src'));
});

gulp.task('project', function() {
  return gulp.src(['manifest.json', 'README.md']).pipe(gulp.dest('build'));
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
    .pipe(gulp.dest('build/lib'));
});

gulp.task('clean', function() {
  return del(['build']);
});

gulp.task('zip', function() {
  return gulp
    .src('build/**')
    .pipe(zip('tab-rotate-' + manifest.version + '.zip'))
    .pipe(gulp.dest('zip'));
});

gulp.task('default', gulp.series('clean', 'project', 'src', 'js', 'lib'));
