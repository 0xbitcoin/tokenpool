var webpack = require('webpack');
var path = require('path');

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');

var environment = process.env.NODE_ENV || 'development';

/*
var htmlPlugin = new HtmlWebpackPlugin({
      title: '0xBitcoin',
     filename: 'index.html',
      template: 'app/index.html',
});
*/
var extractPlugin = new ExtractTextPlugin({
   filename: 'app/assets/main.css'
});


var webpackPlugins = [
    extractPlugin,
    new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        }
      })
]



const routesData = {
  routes: [
    {url: '/', title: 'Token Mining Pool', template: 'app/index.html', filename: 'index.html'},
    {url: '/account', title: 'Mining Accounts', template: 'app/account.html', filename: 'account/index.html'},
    {url: '/profile/:address', title: 'Mining Profile', template: 'app/profile.html', filename: 'profile/index.html'},
    {url: '/overview', title: 'Overview', template: 'app/overview.html', filename: 'overview/index.html'},
  ]
}


routesData.routes.forEach(function(element){

  var htmlPlugin = new HtmlWebpackPlugin({
        title: element.title,
        filename: element.filename,
        template: element.template
  });

 webpackPlugins.push(htmlPlugin)

})



module.exports = {
    entry: ['./app/assets/javascripts/index', './app/assets/stylesheets/application.scss' ],
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.js',
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['es2016']
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                use: extractPlugin.extract({
                    use: ['css-loader', 'sass-loader']
                })
            },
            {
              test: /\.(png|jpg|gif)$/,
              use: [
                {
                  loader: 'file-loader',
                  options: {
                    name: '[path][name].[ext]',
                     publicPath: '/',
                  }
                }
              ]
            }
        ]
    },
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
      }
    },
    plugins: webpackPlugins
};
