var 
gulp = require('gulp'),
pug = require('gulp-pug'),
params = require('yargs').argv,
sass = require('gulp-sass'),
browserSync = require('browser-sync'),
autoprefixer = require('gulp-autoprefixer'),
concat = require('gulp-concat'),
cssnano = require('gulp-cssnano'),
rename = require('gulp-rename'),
uglify = require('gulp-uglifyjs'),
imagemin = require('gulp-imagemin'), 
pngquant = require('imagemin-pngquant'),
del = require('del'),
inject = require('gulp-inject'),
concatCss = require('gulp-concat-css'),
wait = require('gulp-wait'),
gcmq = require('gulp-group-css-media-queries'),
fileinclude = require('gulp-file-include');

var paths = {
	src: 'src',
	srcPug: 'src/pug/*.pug',
	srcPugComponents: 'src/pug/components/**/*.pug',
	srcHTML: 'src/html/*.html',
	srcCSS: 'src/css/**/*.css',
	srcHtmlComponents: 'src/html/components/**/*.html',
	srcSCSS: 'src/scss/**/*.scss',	
	srcJS: 'src/js/**/*.js',
	srcVendorJS: 'src/js/vendor/**/*.js',
	srcAppJS: 'src/js/*.js',
	srcImg: 'src/img/**/*',
	srcFonts: 'src/fonts/**/*',

	tmp: 'tmp',
	tmpIndex: 'tmp/index.html',
	tmpHTML: 'tmp/*.html',
	tmpCSS: 'tmp/css/**/*.css',
	tmpVendorJS: 'tmp/js/vendor/**/*.js',
	tmpAppJS: 'tmp/js/*.js',

	dist: 'dist',
	distIndex: 'dist/index.html',
	distHTML: 'dist/*.html',
	distCSS: 'dist/css/**/*.css',
	distVendorJS: 'dist/js/vendor/**/*.js',
	distAppJS: 'dist/js/*.js',
};

var config = {
	pug: (params.pug === undefined) ? false : true,
};

gulp.task('default', function () {
	console.log('Hello World!');
});

/**
 * DEVELOPMENT
 */
 gulp.task('watch', ['clean','browserSync'], function() {
 	gulp.watch(paths.srcSCSS, ['compileSCSS']);
 	gulp.watch(paths.srcJS, ['concatJS']);
 	if (config.pug) {
 		gulp.watch(paths.srcPug, ['injectPug']);
 		gulp.watch(paths.srcPugComponents, ['injectPug']);
 	} else {
 		gulp.watch(paths.srcHTML, ['injectHTML']);
 		gulp.watch(paths.srcHtmlComponents, ['injectHTML']);
 	}
 });

 gulp.task('clean', function() {
 	return del.sync(paths.tmp);
 });

 gulp.task('browserSync', ['build'], function() { 
 	browserSync({ 
 		server: { 
 			baseDir: 'tmp' 
 		},
 		notify: false
 	});
 });

 if (config.pug) {
 	gulp.task('copy', ['compilePug','copyCSS', 'compileSCSS', 'concatJS','compressImg','copyFonts']);
 	gulp.task('build', ['copy'], function () {
 		var css = gulp.src(paths.tmpCSS);
 		var js = gulp.src([paths.tmpVendorJS, paths.tmpAppJS]);
 		return gulp.src(paths.tmpHTML)
 		.pipe(inject(css, { relative:true } ))
 		.pipe(inject(js, { relative:true } ))
 		.pipe(gulp.dest(paths.tmp));
 	});
 } else {
 	gulp.task('copy', ['copyHTML', 'copyCSS', 'compileSCSS', 'concatJS','compressImg','copyFonts']);	
 	gulp.task('build', ['copy'], function () {
 		var css = gulp.src(paths.tmpCSS);
 		var js = gulp.src([paths.tmpVendorJS, paths.tmpAppJS]);
 		return gulp.src(paths.tmpHTML)
 		.pipe(inject(css, { relative:true } ))
 		.pipe(inject(js, { relative:true } ))
 		.pipe(gulp.dest(paths.tmp));
 	});
 }

 gulp.task('compilePug', function() {
 	return gulp.src(paths.srcPug)
 	.pipe(pug({
 		pretty: true
 	}))
 	.pipe(gulp.dest(paths.tmp));
 });

 gulp.task('injectPug', ['compilePug'], function () {
 	var css = gulp.src(paths.tmpCSS);
 	var js = gulp.src([paths.tmpVendorJS, paths.tmpAppJS]);
 	return gulp.src(paths.tmpHTML)
 	.pipe(inject(css, { relative:true } ))
 	.pipe(inject(js, { relative:true } ))
 	.pipe(gulp.dest(paths.tmp))
 	.pipe(browserSync.reload({stream: true}));
 });

 gulp.task('copyHTML', function () {
 	return gulp.src(paths.srcHTML)
 	.pipe(fileinclude({
 		prefix: '@@',
 		basepath: '@file'
 	}))
 	.pipe(gulp.dest(paths.tmp));
 });

 gulp.task('injectHTML', ['copyHTML'], function () {
 	var css = gulp.src(paths.tmpCSS);
 	var js = gulp.src([paths.tmpVendorJS, paths.tmpAppJS]);
 	return gulp.src(paths.tmpHTML)
 	.pipe(inject(css, { relative:true } ))
 	.pipe(inject(js, { relative:true } ))
 	.pipe(gulp.dest(paths.tmp))
 	.pipe(browserSync.reload({stream: true}));
 });

 gulp.task('copyCSS', function() {
 	return gulp.src([paths.srcCSS])
 	.pipe(gulp.dest(paths.tmp + '/css'));
 });

 gulp.task('compileSCSS', function(){ 
 	return gulp.src(paths.srcSCSS)
 	.pipe(wait(1000))
 	.pipe(sass())
 	.pipe(autoprefixer({
 		browsers: ['last 2 versions'],
 		cascade: false
 	}))
 	.pipe(gcmq())
 	.pipe(gulp.dest(paths.tmp + '/css'))
 	.pipe(browserSync.reload({stream: true}));
 });

 gulp.task('concatJS', ['concatVendorJS', 'concatAppJS']);

 gulp.task('concatVendorJS', function() {
 	var vendorJS = 'libs.js';
 	return gulp.src([paths.src + '/js/vendor/jquery.js', paths.srcVendorJS])
 	.pipe(concat(vendorJS))
 	.pipe(gulp.dest(paths.tmp + '/js/vendor'));
 });

 gulp.task('concatAppJS', function() {
 	var appJS = 'app.js';
 	return gulp.src([paths.srcAppJS])
 	.pipe(concat(appJS))
 	.pipe(gulp.dest(paths.tmp + '/js'));
 });

 gulp.task('compressImg', function(){
 	return gulp.src(paths.srcImg)
 	.pipe(imagemin({ 
 		interlaced: true,
 		progressive: true,
 		svgoPlugins: [{removeViewBox: false}],
 		use: [pngquant()]
 	}))
 	.pipe(gulp.dest(paths.tmp + '/img')); 
 });

 gulp.task('copyFonts', function () {
 	return gulp.src(paths.srcFonts)
 	.pipe(gulp.dest(paths.tmp + '/fonts'));
 });
/**
 * DEVELOPMENT END
 */

/**
 * PRODUCTION
 */
 gulp.task('clean:dist', function() {
 	return del.sync(paths.dist);
 });

 gulp.task('compileSCSS:dist', function(){ 
 	return gulp.src(paths.srcSCSS)
 	.pipe(sass())
 	.pipe(autoprefixer({
 		browsers: ['last 2 versions'],
 		cascade: false
 	}))
 	.pipe(gulp.dest(paths.dist + '/css/temp'))
 	.pipe(browserSync.reload({stream: true}));
 });

 gulp.task('copyCSS:dist', function() {
 	return gulp.src([paths.srcCSS])
 	.pipe(gulp.dest(paths.dist + '/css/temp'));
 });

 gulp.task('concatCSS:dist', ['compileSCSS:dist', 'copyCSS:dist'], function() {
 	var styles = 'styles.css';
 	return gulp.src(paths.dist + '/css/temp/**/*.css')
 	.pipe(concatCss(styles))
 	.pipe(gulp.dest(paths.dist + '/css'));
 });

 gulp.task('minCSS:dist', ['concatCSS:dist'], function() {
 	del(paths.dist + '/css/temp');
 	return gulp.src(paths.dist + '/css/styles.css')
 	.pipe(cssnano())
 	.pipe(gulp.dest(paths.dist + '/css'));
 });

 gulp.task('concatVendorJS:dist', function() {
 	return gulp.src([
 		paths.src + '/js/vendor/jquery.js',
 		paths.srcVendorJS
 		])
 	.pipe(concat('libs.js'))
 	.pipe(gulp.dest(paths.dist + '/js/vendor'));
 });

 gulp.task('concatAppJS:dist', function() {
 	return gulp.src([paths.srcAppJS])
 	.pipe(concat('app.js'))
 	.pipe(gulp.dest(paths.dist + '/js'));
 });

 gulp.task('concatJS:dist', ['concatVendorJS:dist', 'concatAppJS:dist']);

 gulp.task('compressImg:dist', function(){
 	return gulp.src(paths.srcImg)
 	.pipe(imagemin({ 
 		interlaced: true,
 		progressive: true,
 		svgoPlugins: [{removeViewBox: false}],
 		use: [pngquant()]
 	}))
 	.pipe(gulp.dest(paths.dist + '/img')); 
 });

 gulp.task('copyFonts:dist', function () {
 	return gulp.src(paths.srcFonts)
 	.pipe(gulp.dest(paths.dist + '/fonts'));
 });

 gulp.task('minVendorJS:dist', ['concatVendorJS:dist'], function() {
 	var vendorJS = 'libs.js';
 	return gulp.src(paths.distVendorJS)
 	.pipe(uglify(vendorJS))
 	.pipe(gulp.dest(paths.dist + '/js/vendor'));
 });

 gulp.task('minAppJS:dist', ['concatAppJS:dist'], function() {
 	var appJS = 'app.js';
 	return gulp.src(paths.distAppJS)
 	.pipe(uglify(appJS))
 	.pipe(gulp.dest(paths.dist + '/js/'));
 });

 gulp.task('minJS:dist', ['minVendorJS:dist', 'minAppJS:dist']);

 gulp.task('copyHTML:dist', function () {
 	return gulp.src(paths.srcHTML)
 	.pipe(fileinclude({
 		prefix: '@@',
 		basepath: '@file'
 	}))
 	.pipe(gulp.dest(paths.dist));
 });

 gulp.task('compilePug:dist', function() {
 	return gulp.src(paths.srcPug)
 	.pipe(pug({
 		pretty: true
 	}))
 	.pipe(gulp.dest(paths.dist));
 });

 if (config.pug) {
 	gulp.task('copy:dist', ['compilePug:dist', 'minCSS:dist', 'minJS:dist','compressImg:dist','copyFonts:dist']);
 } else {
 	gulp.task('copy:dist', ['copyHTML:dist', 'minCSS:dist', 'minJS:dist','compressImg:dist','copyFonts:dist']);
 }

 gulp.task('build:dist', ['copy:dist'], function () {
 	var css = gulp.src(paths.distCSS);
 	var js = gulp.src([paths.distVendorJS, paths.distAppJS]);
 	return gulp.src(paths.distHTML)
 	.pipe(inject(css, { relative:true } ))
 	.pipe(inject(js, { relative:true } ))
 	.pipe(gulp.dest(paths.dist));
 });

 gulp.task('dist', ['clean:dist','build:dist']);
/**
 * PRODUCTION END
 */