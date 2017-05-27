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
