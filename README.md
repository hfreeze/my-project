## gulp + webpack 构建多页面前端项目
最近想把目前的多页面项目目录整理记录下来，也重新回顾一下，之前项目一直都只是用gulp好好的，后来引入webpack。gulp和webpack分别所哪些任务请继续往下看，首先是目录结构。
### 目录结构
```
dist // 输出文件夹
  |——fonts
  |——images
  |——scripts
  |——styles
  |——index.html
node_modules // npm包
src // 生产文件夹
  |——img // 图片资源
  |——js
  |   |——lib // 存放第三方库
  |   |   |——jquery.js
  |   |——module // 存放公共的js模块 es6输出
  |   |   |——common.js
  |   |——index.js //对应页面js
  |——sprite // 这里放置需要合并雪碧图的图片，gulp生成的雪碧图及样式也会生成在此文件夹中,css需要手动添加到对应页面样式表里
  |——style // 样式表文件夹
  |   |——fonts // 字体文件
  |   |——less // 存放对应页面的样式文件，我把全站公用的common.less也放在这里方便页面引用
  |   |   |——common.less // 全站公共样式
  |   |   |——index.less // 对应页面样式
  |   |——lib // 存放第三方样式库（也包含mixins.less）
  |   |   |——font-awesome.less
  |   |   |——mixins.less // 包含全局样式变量和各个组件的模块样式（如果样式变量太多或者项目比较大可以考虑单独建个变量文件）
  |   |   |——normalize.less
  |——view // html文件放置这里
  |   |——common // 放置html公用块，页面include引入
  |   |   |——header.html
  |   |——index.html
gulpfile.js // gulp配置文件
package.json // npm配置文件
webpack.config.js // webpack配置文件
```
下载项目后首先安装npm依赖包：
```
npm install
```
启动开发环境。这里需要开启两个监听窗口，分别是gulp和webpack。后面我会仔细介绍这两个。
```
npm run dev // 监听gulp任务
npm run watch // 监听js
```
### 配置文件介绍
#### gulpfile.js
```javascript
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
```
gulp主要任务：
1. copy字体文件和图片，生产环境资源压缩。
2. less文件的编译生成map方便调试，自动添加浏览器前缀，生产环境资源压缩。
3. 用gulp-file-include处理html公共部分代码。
4. 合并雪碧图。
5. 监听文件并实时刷新。

这里使用gulp-util判断是生产环境（gulp --type pro）还是开发环境（gulp），如果是生产就对资源进行压缩处理。
#### webpack.config.js
```
var path = require('path');
var webpack = require('webpack');
var fs = require('fs');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var srcDir = path.resolve(process.cwd(), 'src');



function getEntry() {
  var jsPath = path.resolve(srcDir, 'js');
  var dirs = fs.readdirSync(jsPath);
  var matchs = [], files = {};

  dirs.forEach(function(item) {
    matchs = item.match(/(.+)\.js$/);
    if (matchs) {
      files[matchs[1]] = path.resolve(srcDir, 'js', item);
    }
  });
  return files;
}




module.exports = {
  entry: getEntry(),
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist/scripts/'),
    publicPath: 'dist/scripts/'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin(),
    new CopyWebpackPlugin([
      {
        from: './src/js/lib'
      }
    ])
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  }
};

```
webpack主要任务：
1. 多页面遍历入口文件。
2. copy第三方资源到输出目录（有些第三方组件没有npm包，不能import）。
3. 编译ES6。

#### package.json
```
{
  "name": "test",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "clean": "rimraf ./dist",
    "build": "webpack",
    "watch": "webpack --watch",
    "server": "webpack-dev-server --open",
    "dev": "gulp",
    "pro": "gulp --type pro",
    "predev": "npm run clean",
    "postdev": "npm run build && gulp watch",
    "prepro": "npm run clean",
    "postpro": "npm run build"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "babel-core": "^6.24.1",
    "babel-loader": "^7.0.0",
    "babel-preset-env": "^1.5.1",
    "browser-sync": "^2.18.12",
    "copy-webpack-plugin": "^4.0.1",
    "gulp": "^3.9.1",
    "gulp-autoprefixer": "^4.0.0",
    "gulp-changed": "^3.1.0",
    "gulp-clean-css": "^3.4.0",
    "gulp-concat": "^2.6.1",
    "gulp-file-include": "^1.1.0",
    "gulp-imagemin": "^3.2.0",
    "gulp-jshint": "^2.0.4",
    "gulp-less": "^3.3.0",
    "gulp-load-plugins": "^1.5.0",
    "gulp-plumber": "^1.1.0",
    "gulp-rename": "^1.2.2",
    "gulp-replace": "^0.5.4",
    "gulp-sourcemaps": "^2.6.0",
    "gulp-uglify": "^3.0.0",
    "gulp-util": "^3.0.8",
    "gulp.spritesmith": "^6.5.0",
    "jshint": "^2.9.4",
    "merge-stream": "^1.0.1",
    "webpack": "^2.6.1",
    "webpack-dev-server": "^2.4.5"
  },
  "dependencies": {
    "del": "^2.2.2"
  }
}
```
虽然gulp任务和webpack任务可以分别在命令行内执行，但还是推荐把任务命令统一写在package.json中方便管理，并且可以利用npm钩子方便任务在正确的顺序中调用。
