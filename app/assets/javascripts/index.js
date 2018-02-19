
const $ = require('jquery');

import logo from '../images/0xbitcoin.png'
import githubLogo from '../images/GitHub-Mark-64px.png'

import Vue from 'vue'

import AlertRenderer from './alert-renderer'

import DashboardRenderer from './dashboard-renderer'
import AccountRenderer from './account-renderer'

import EthHelper from './ethhelper'


import HomeDashboard from './home-dashboard'
import AccountDashboard from './account-dashboard'


//var web3 = this.connectWeb3();

var dashboardRenderer = new DashboardRenderer();
var accountRenderer = new AccountRenderer();
var alertRenderer = new AlertRenderer();
var ethHelper = new EthHelper();
var home = new HomeDashboard();
var account = new AccountDashboard();


var navbar = new Vue({
  el: '#navbar',
  data: {
    brandImageUrl: logo,
    githubLogo: githubLogo
  }
})


$(document).ready(function(){


      if($("#home").length > 0){
        var web3 = ethHelper.init( alertRenderer);

        home.init(ethHelper,web3,dashboardRenderer);
      }



      if($("#account").length > 0){
        var web3 = ethHelper.init( alertRenderer);

        account.init(ethHelper,web3,accountRenderer);
      }


});


//dashboardRenderer.hide();
