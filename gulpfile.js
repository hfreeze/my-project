var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var reload = require('browser-sync').create();
var stream = require('merge-stream')();



// paths
var paths = {
  // dev
  src: {
    img: 'src/img',
    js: 'src/js',
    less: 'src/style/less',
    font: 'src/style/fonts',
    sprite: 'src/sprite',
    html: 'src/view'
  },

  // pro
  dist: {
    img: 'dist/images',
    js: 'dist/scripts',
    css: 'dist/styles',
    font: 'dist/fonts'
  }
};




// --------------- build ----------------------


// del
gulp.task('clean', function() {
  return del(['dist']);
});



// copy (img and fonts) 如果是生产环境执行图片压缩
gulp.task('copy', function() {
  var img = gulp.src(paths.src.img + '/*')
    .pipe($.changed(paths.dist.img))
    .pipe($.util.env.type === 'pro' ? $.imagemin() : $.util.noop())
    .pipe(gulp.dest(paths.dist.img));

  var font = gulp.src(paths.src.font + '/*')
    .pipe($.changed(paths.dist.font))
    .pipe(gulp.dest(paths.dist.font));

  stream.add(img);
  stream.add(font);
  return stream.isEmpty() ? null : stream;
});



// sprite
gulp.task('sprite', function() {
  return gulp.src(paths.src.sprite + '/*')
    .pipe($.spritesmith({
      imgName: 'sprite.png',
      cssName: 'sprite.css',
      padding: 2
    }))
    .pipe(gulp.dest(paths.src.sprite));
});



// less 如果是生产环境执行压缩
gulp.task('less', function() {
  return gulp.src(paths.src.less + '/*.less')
    .pipe($.changed(paths.dist.css, {
      extension: '.css'
    }))
    .pipe($.plumber({
      errorHandler: function(err) {
        console.log(err);
        this.emit('end');
      }
    }))
    .pipe($.sourcemaps.init())
    .pipe($.less())
    .pipe($.sourcemaps.write())
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie 9'],
      cascade: false
    }))
    .pipe($.util.env.type === 'pro' ? $.cleanCss() : $.util.noop())
    .pipe(gulp.dest(paths.dist.css));
});



// file include
gulp.task('fileinclude', function() {
  return gulp.src(paths.src.html + '/*.html')
    .pipe($.changed('dist', {
      extension: '.html'
    }))
    .pipe($.fileInclude({
      prefix: '@@',
      basepath: '@file',
      indent: true
    }))
    .pipe(gulp.dest('dist'));
});



// watch
gulp.task('watch', function() {
  reload.init({
    server: {
      baseDir: 'dist'
    },
    files: ['dist/*.html', paths.dist.css + '/*.css']
  });

  gulp.watch(paths.src.less + '/*.less', ['less']);
  gulp.watch(paths.src.html + '/*.html', ['fileinclude']);
});




// dev: ($ gulp)
// pro: ($ gulp --type pro)
gulp.task('default', ['copy', 'less', 'fileinclude']);


// js 由 webpack 处理




/*gulp.task('replace', function() {
  return gulp.src(paths.src.html + '/common/*.html')
    .pipe($.replace('src="img/', 'src="images/'))
    .pipe(gulp.dest('del'));
});*/
