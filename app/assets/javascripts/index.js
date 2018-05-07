
const $ = require('jquery');

import logo from '../images/TMPlogo.png'
import githubLogo from '../images/GitHub-Mark-64px.png'

import Vue from 'vue'

import AlertRenderer from './alert-renderer'

import OverviewRenderer from './overview-renderer'
import HomeRenderer from './home-renderer'
import AccountRenderer from './account-renderer'
import ProfileRenderer from './profile-renderer'

import EthHelper from './ethhelper'


import HomeDashboard from './home-dashboard'
import AccountDashboard from './account-dashboard'
import OverviewDashboard from './overview-dashboard'


//var web3 = this.connectWeb3();

var overviewRenderer = new OverviewRenderer();
var homeRenderer = new HomeRenderer();
var accountRenderer = new AccountRenderer();
var alertRenderer = new AlertRenderer();
var profileRenderer = new ProfileRenderer();
//var ethHelper = new EthHelper();
var home = new HomeDashboard();
var account = new AccountDashboard();
var overview = new OverviewDashboard();

var navbar = new Vue({
  el: '#navbar',
  data: {
    brandImageUrl: logo,
    githubLogo: githubLogo
  }
})


$(document).ready(function(){


      if($("#home").length > 0){
      //  var web3 = ethHelper.init( alertRenderer);

        home.init(homeRenderer);
      }

      if($("#profile").length > 0){
        profileRenderer.init()
      }


      if($("#account").length > 0){
        //var web3 = ethHelper.init( alertRenderer);

        account.init(accountRenderer);
      }


      if($("#overview").length > 0){
      //  var web3 = ethHelper.init( alertRenderer);

        overview.init(overviewRenderer);
      }

});


//dashboardRenderer.hide();
