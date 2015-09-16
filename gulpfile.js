var gulp = require('gulp');
var mainBowerFiles = require('main-bower-files');


gulp.task('source', function() {
  return gulp.src(['*.html', '*.js', '*.json', '*.css'])
  	.pipe(gulp.dest('dest'));
});

gulp.task('img', function() {
	return gulp.src('img/*').pipe(gulp.dest('dest/img'));
});

gulp.task('bower', function() {
  return gulp.src([
  		'*.html',
  		'*.js',
  		'*.json',
  		'*.css'])
  	.pipe(gulp.dest('dest'));
});

gulp.task('bower', function() {
    return gulp.src(mainBowerFiles(/* options */), { base: 'bower_components' })
        .pipe(gulp.dest('dest/bower_components'))
});

gulp.task('default', ['source', 'img']);
