var webpack = require('webpack');
var path = require('path');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');

var environment = process.env.NODE_ENV || 'development';

/*
var htmlPlugin = new HtmlWebpackPlugin({
      title: '0xBitcoin',
     filename: 'index.html',
      template: 'app/index.html',
});
*/
/*var extractPlugin = new ExtractTextPlugin({
   filename: 'app/assets/main.css'
});*/


var extractPlugin = new MiniCssExtractPlugin({
     // Options similar to the same options in webpackOptions.output
     // both options are optional
     filename: 'app/assets/main.css'
   });


var webpackPlugins = [
    extractPlugin,
    new CleanWebpackPlugin(),
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
    entry: ['@babel/polyfill','./app/assets/javascripts/index', './app/assets/stylesheets/application.scss' ],
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.[hash:12].js',
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
                            presets: ['@babel/preset-env']
                        }
                    }
                ]
            },
            {
                test: /\.scss$/,
                use: [
               {
                 loader: MiniCssExtractPlugin.loader,
                 options: {

                 },
               },
               'css-loader','sass-loader'
             ],
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
