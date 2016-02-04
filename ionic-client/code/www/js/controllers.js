angular.module('songhop.controllers', ['ionic', 'songhop.services'])


.controller('SplashCtrl', function($scope, $state, User) {

  // attempt to signup/login via User.auth
  $scope.submitForm = function(username, signingUp) {
    User.auth(username, signingUp).then(function(){
      // session is now set, so lets redirect to discover page
      $state.go('tab.discover');

    }, function() {
      // error handling here
      alert('Hmm... try another username.');
    });
  }
})
/*
Controller for the discover page
*/
.controller('DiscoverCtrl', function($scope, $ionicLoading, $timeout, User, Recommendations) {
  // helper functions for loading
  var showLoading = function() {
    $ionicLoading.show({
      template: '<i class="ion-loading-c"></i>',
      noBackdrop: true
    });
  }

  var hideLoading = function() {
    $ionicLoading.hide();
  }

  // set loading to true first time while we retrieve songs from server.
  showLoading();
  // get our first songs
  Recommendations.init()
    .then(function(){

      $scope.currentSong = Recommendations.queue[0];

      return Recommendations.playCurrentSong();

    })
    .then(function(){
      // turn loading off
      hideLoading();
      $scope.currentSong.loaded = true;
    });

  // fired when we favorite / skip a song.
  $scope.sendFeedback = function (bool) {
  	// first, add to favorites if they favorited
    if (bool) User.addSongToFavorites($scope.currentSong);
    // set variable for the correct animation sequence
    $scope.currentSong.rated = bool;
    $scope.currentSong.hide = true;

    // prepare the next song
    Recommendations.nextSong();

    $timeout(function() {
      // $timeout to allow animation to complete
      $scope.currentSong = Recommendations.queue[0];
      $scope.currentSong.loaded = false;
    }, 250);

    Recommendations.playCurrentSong().then(function() {
    	$scope.currentSong.loaded = true;
    });

  }
  // used for retrieving the next album image.
  // if there isn't an album image available next, return empty string.
  $scope.nextAlbumImg = function() {
    if (Recommendations.queue.length > 1) {
      return Recommendations.queue[1].image_large;
    }

    return '';
  }
})


/*
Controller for the favorites page
*/
.controller('FavoritesCtrl', function($scope, User) {
  // get the list of our favorites from the user service
  $scope.favorites = User.favorites;
  $scope.username = User.username;
  $scope.removeSong = function(song, index) {
    User.removeSongFromFavorites(song, index);
  }
  $scope.openSong = function(song) {
    $window.open(song.open_url, "_system");
  }
})

.controller('SettingsCtrl', function($scope, User) {

  $scope.settings = [
    {
      "name":"server url",
      "value":"https://kevin-songhop.herokuapp.com"
    },
    {
      "name":"Kevin, where are you?",
      "value":"I'm in Seoul"
    },
    {
      "name":"Kevin, where are you?",
      "value":"I'm in Seoul"
    },
    {
      "name":"Kevin, where are you?",
      "value":"I'm in Seoul"
    },
    {
      "name":"Kevin, where are you?",
      "value":"I'm in Seoul"
    }
  ];

})


/*
Controller for our tab bar
*/
.controller('TabsCtrl', function($scope, $window, User, Recommendations) {
  // expose the number of new favorites to the scope
  $scope.favCount = User.favoriteCount;

  // stop audio when going to favorites page
  $scope.enteringFavorites = function() {
  	User.newFavorites = 0;
    Recommendations.haltAudio();
  }
  $scope.leavingFavorites = function() {
    Recommendations.init();
  }
  $scope.logout = function() {
    User.destroySession();

    // instead of using $state.go, we're going to redirect.
    // reason: we need to ensure views aren't cached.
    $window.location.href = 'index.html';
  }
});