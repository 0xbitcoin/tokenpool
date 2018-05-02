const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const extractPlugin = new ExtractTextPlugin({
	filename: 'app/assets/main.css'
})

const routesData = {
	routes: [
		{url: '/', title: 'Token Mining Pool', template: 'app/index.html', filename: 'index.html'},
		{url: '/account', title: 'Mining Accounts', template: 'app/account.html', filename: 'account/index.html'},
		{url: '/profile/:address', title: 'Mining Profile', template: 'app/profile.html', filename: 'profile/index.html'},
		{url: '/overview', title: 'Overview', template: 'app/overview.html', filename: 'overview/index.html'},
	]
}

const htmlRoutes = routesData.routes.map(element => {
	return new HtmlWebpackPlugin({
		title: element.title,
		filename: element.filename,
		template: element.template
	})
})

const webpackPlugins = [
	...htmlRoutes,
	new LodashModuleReplacementPlugin({
		currying: true,
		flattening: true,
		paths: true,
		placeholders: true,
		shorthands: true
	}),
	new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
	new webpack.optimize.ModuleConcatenationPlugin(),
	new webpack.optimize.UglifyJsPlugin({
		compress: {
			screw_ie8: true,
			warnings: false,
			dead_code: true,
			drop_console: true
		},
		mangle: {
			screw_ie8: true
		},
		output: {
			comments: false,
			screw_ie8: true
		}
	}),
	extractPlugin,
	new webpack.DefinePlugin({
		'process.env': {
			NODE_ENV: JSON.stringify('production')
		}
	}),
	// new BundleAnalyzerPlugin()
]

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
				exclude: /node_modules/,
				test: /\.js$/,
				use: [
					{
						loader: 'babel-loader'
					}
				]
			},
			{
				test: /\.scss$/,
				use: extractPlugin.extract({
					use: [
						{
							loader: 'css-loader',
							options: {
								importLoaders: 1,
								modules: false,
								sourceMap: false,
								minimize: true,
								discardComments: { removeAll: true }
							}
						},
						'sass-loader'
					]
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
}
