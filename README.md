
## gulp + webpack 构建多页面前端项目
最近想把目前的多页面项目目录整理记录下来，也重新回顾一下，之前项目一直都只是用gulp好好的，后来引入webpack来单独处理js部分，其他的交给gulp完成。先介绍下目录结构
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
      |——lib // 存放第三方库
          |——jquery.js
      |——module // 存放公共的js模块 es6输出
          |——common.js
      |——index.js //对应页面js
  |——sprite // 这里放置需要合并雪碧图的图片，gulp生成的雪碧图及样式也会生成在此文件夹中,css需要手动添加到对应页面样式表里
  |——style // 样式表文件夹
      |——fonts // 字体文件
      |——less // 存放对应页面的样式文件，我把全站公用的common.less也放在这里方便页面引用
          |——common.less // 全站公共样式
          |——index.less // 对应页面样式
      |——lib // 存放第三方样式库（也包含mixins.less）
          |——font-awesome.less
          |——mixins.less // 包含全局样式变量和各个组件的模块样式（如果样式变量太多或者项目比较大可以考虑单独建个变量文件）
          |——normalize.less
  |——view // html文件放置这里
      |——common // 放置html公用块，页面include引入
          |——header.html
      |——index.html
gulpfile.js // gulp配置文件
package.json // npm配置文件
webpack.config.js // webpack配置文件
```

MarkdownHTMLPreview78 words
