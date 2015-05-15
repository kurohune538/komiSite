// gulpfile.js
//imageminをresponsiveより先に呼ぶ
//でないと圧縮された画像にリサイズがかからない気がするから
//gulpをインポートする
var gulp = require('gulp');
var path = require('path');
var watch = require('gulp-watch');
//gulp-compassをインポートしてcompassを有効化
var compass = require('gulp-compass');
var autoprefixer = require('gulp-autoprefixer');
var cssmin = require('gulp-cssmin');
var csscomb = require('gulp-csscomb');
var rename = require('gulp-rename');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var webserver = require('gulp-webserver');
var browserSync = require('browser-sync');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var changed = require('gulp-changed');
var cache = require('gulp-cached');
var responsive = require('gulp-responsive');
var filelog     = require('gulp-filelog'); //fileの進捗を表示する
var imageResize = require('gulp-image-resize');
var exec = require('gulp-exec');
var sketch = require('gulp-sketch');
var uglify = require('gulp-uglify');
//html
var jade = require('gulp-jade');
var prettify = require('gulp-prettify');
var htmlhint = require("gulp-htmlhint");

var paths = {
		app: 'app',
		dest: 'dist'
}

//html
gulp.task('jade', function() {
		gulp.src('app/**/*.jade')
			.pipe(jade())
			.pipe(htmlhint())
			.pipe(prettify({indent_size:2}))
			.pipe(gulp.dest('dist/'));
});


//compassの設定
//compassとその名前のタスクを登録する
//実際にそのタスクが何をするのかの登録
gulp.task('compass',function(){
		//ここからタスクの内容
		return gulp.src(['./app/styles/*.scss'])
			.pipe(watch('./app/styles/*.scss'))
			.pipe(cache( 'compass' ))
			.pipe(plumber({
				errorHandler: notify.onError("Error: <%= error.message %>")
			}))
			.pipe(compass({
				config_file: './config.rb',//compass設定ファイルの場所
				comments: false,//コメントを残すか
				css: './dist/styles/',//吐き出すcssの場所
				sass: './app/styles/'//sassファイルの場所
			}));
});

//watch
gulp.task('watch',function() {
	gulp.watch('app/styles/**/*.scss',['compass']);
	gulp.watch('dist/styles/**/*.css', ['autoprefixer']);
	gulp.watch('app/styles/**/*.css', ['cssmin']);
	//gulp.watch('app/*.html',['copy','bs-reload']);
	gulp.watch('app/images/*',['imagemin']);
	gulp.watch('app/styles/**/*.scss',['bs-reload']);
	gulp.watch('app/js/*.js', ['uglify','bs-reload']);
	gulp.watch('app/**/*.jade',['jade','bs-reload']);
});

//Browsing------------------------------------------------------------------------
//serve
gulp.task('serve', function() {
	gulp.src('app/')
		.pipe(webserver({
			livereload: true,
			directoryListening: true,
			open: true
		}));
});

//browserSync
gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: paths.dest
		},
		ghostMode: {
			location: true
		}
	});
});

// Reload all Browsers
gulp.task('bs-reload', function () {
	browserSync.reload();
});

//image-----------------------------------------------------------------------------
//imageoptim
gulp.task('image-optim', ['imagemin']);
//image-optim:thumbnail

gulp.task('image-optim:thumb', function() {
	var resizeOptions = {
		width: 200,
		height: 200,
		gravity: 'Center',
		crop: true,
		upscale: false,
		imageMagick: true
	};
	
	var imageminOptions = {
		optimizationLevel: 7
	};
	
	return gulp.src('app/images/thumb/*')
		.pipe(changed('dist/images/thumb'))
		.pipe(imageResize( resizeOptions ))
		.pipe(imagemin(imageminOptions))
		.pipe(gulp.dest('dist/images/thumb'))
		.pipe(filelog());
});
		
//imagemin
gulp.task('imagemin', function() {	
	gulp.src('app/images/*')
		.pipe(plumber({
		  errorHandler: notify.onError("Error: <%= error.message %>")
		 }))
		.pipe(changed('dist/images'))
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()],
			optimizationLevel:7
		}))
		.pipe(gulp.dest('dist/images'));
});


//copy
gulp.task('copy', function() {
	gulp.src('./app/*.html')
		.pipe(gulp.dest('./dist'));
});

//responsive
gulp.task('responsive', function() {
	var responsiveOptions = [{
		name: 'sp-*',
		width: 200
	}]
	
	return gulp.src('app/images/*')
		.pipe(responsive(responsiveOptions))
		.pipe(gulp.dest('dist/images'));
	});

//sketch-tool
/*
gulp.task('sketchtool', function() {
	var sketchToolOptions = {
		dstDir : 'dist/images/sketchimg/'
	};
	
	gulp.src('../design/*.sketch')
		.pipe(exec( 'sketchtool export artboards <%= file.path %> --output=<%= options.dstDir %>', sketchToolOptions))
		.pipe(exec.reporter());
	});
*/

//sketchExport
gulp.task('sketchExport:slices', function() {
	var sketchOptions = {
		export : 'slices'
	};
	
	var imageminOptions = {
		optimizationLevel: 7
	};
	
	return gulp.src('../design/*.sketch')
		.pipe(sketch( sketchOptions ))
		.pipe(imagemin( imageminOptions ))
		.pipe(gulp.dest('dist/images/sketchimg'))
		.pipe(filelog());
}); 
//sketch
gulp.task('sketch',['sketchExport:slices']);
//css----------------------------------------------------------------------
//autoprefxer
//ファイル名を明示的に示さないとエラーになるらしい？
gulp.task('autoprefixer', function() {
	gulp.src('dist/styles/*.css')
		.pipe(autoprefixer());
});

//cssmin
gulp.task('cssmin',function() {
	gulp.src('dist/styles/*.css')
	.pipe(csscomb())
	.pipe(cssmin())
	.pipe(rename({suffix: '.min'}))
	.pipe(gulp.dest('dist/styles/cssmin'));
});

//js----------------------------------------------------------------------
//uglify
gulp.task('uglify', function() {
	gulp.src('app/js/*')
		.pipe(uglify())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest('dist/js/min'));
});
//deploy

//gulp.task('deploy', function() {
//	var key = JSON.parse(fs.readFileSync('./awsUpload.json'));
//	var publisher = awspublish.create(key);
//	var headers = {
//		'Cache-Control': 'max-age=315360000, no-transform, public'
//	};
//	
//	gulp.src('dist/**/*')
//		.pipe(publisher.publish(headers))
//		.pipe(publisher.cache())
//		.pipe(awspublish.reporter());
//});

//gulp本来のタスクを登録する
gulp.task('default', ['watch','serve','browser-sync']);

