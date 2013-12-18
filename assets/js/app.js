var pimusicApp = angular.module('pimusicApp',  ['ngRoute', 'pimusicControllers' ]);

/* F I L T E R I N G */
pimusicApp.filter('groupRow', function() {
  return function(items, groupedBy) {
  	if (! items) return ; var finalItems = [],thisGroup; for (var i = 0; i < items.length; i++) {
      if (!thisGroup) {thisGroup = [];} thisGroup.push(items[i]); if (((i+1) % groupedBy) == 0) {
        finalItems.push(thisGroup); thisGroup = null; } } if (thisGroup) finalItems.push(thisGroup); return finalItems;
  };
});

/* INFINITE SCROLL HANDLER */
pimusicApp.factory( 'infiniteScrollHandler',  [ '$filter', function( $filter ){
  return function( $scope, entities, methodeName ) {
    var offset = 0 , slice = 40 ;
    $scope.tilesGroups = [] ;
    $scope[methodeName] = function(){ 
      angular.forEach( $filter('groupRow')(entities.slice(offset, offset+slice ), 4),function(g) {
        $scope.tilesGroups.push(g) ;
      }) ; offset=offset+slice ; } ;
    $scope[methodeName]() ;
  } ;
}] ) ;

/* L O A D E R */
pimusicApp.factory('mEntitiesLoader', ['$http' , function ($http) {
  var loadcb = { progress: [] ,finish: [] } ;
  return {
    load: function(callback) {
      return $http.get('/assets/api/songs_all.json').success(function(data) {
        var percent = -1 , newp = 0 ;
        angular.forEach(data, function ( song , i ) {
          callback(song, i) ;
          newp = parseInt(i/data.length*100) ;
          if( newp != percent ) {
            percent = newp ;
            angular.forEach( loadcb.progress, function(cb) { cb(percent) ; } ) ; //invoke registered progress callbacks
          }
        }) ;
        angular.forEach(loadcb.finish, function(cb) { cb() ; }) ; //invoke registered finish callbacks
      });
    },
    onLoadProgress: function( cb ) { loadcb.progress.push(cb) ; } , //register progress callbacks
    onLoadFinish: function( cb ) { loadcb.finish.push(cb) ; } , //register finish callbacks
  } ;
}]);

/* P L A Y E R */
pimusicApp.factory('mPlayer', ['$http' , function ($http) {
  return {
    startPlay: function ( songId , cb ) {
      return $http.get('/play/songs/' + songId ).success(function(data){cb();}) ;
    }
  }
}]) ;

/* E N T I T I E S */
pimusicApp.factory('mEntitiesInit', ['mEntities' , function (mEntities) {
    return mEntities.init();
}]);
pimusicApp.factory('mEntities', [ 'mEntitiesLoader' , function(mEntitiesLoader){
  var musicIndex = { songs:{}, artists:{} , albums:{} } ;
  var iToa = function(io){ return Object.keys(io).map(function(i){return io[i];}) ; } ;
	return {
    init: function(){ 
      return mEntitiesLoader.load(function(song){

        var artistId     = song.artist.trim() ;
        var albumId      = song.album.trim() ;
        var songId       = song.id ;
        var artistName   = song.artist ;
        var albumName    = song.album ;
        if( ! artistId ) artistId = 'unknow' ;
        if( ! albumId )  albumId  = 'unknow' ;
        if( ! artistName ) artistName = 'unknow' ;
        if( ! albumName )  albumName  = 'unknow' ;
        var artistArtUrl = 'http://placehold.it/512x256';
        var albumArtUrl  = 'http://placehold.it/512x512';
        if(song.hasOwnProperty('artistArtRef')) artistArtUrl = song.artistArtRef[0].url ;
        if(song.hasOwnProperty('albumArtRef'))  albumArtUrl  = song.albumArtRef[0].url ;

        var eSong = { id:songId,title:song.title } , eAlbum, eArtist ;
        if( !musicIndex.albums.hasOwnProperty(albumId)) eAlbum = { id:albumId, name:albumName, imageUrl:albumArtUrl, songs:{}} ;
        else eAlbum = musicIndex.albums[albumId] ;
        eSong.album = eAlbum ; eAlbum.songs[songId] = eSong ;
        if( !musicIndex.artists.hasOwnProperty(artistId)) eArtist = { id:artistId, name:artistName, imageUrl:artistArtUrl, albums:{} } ;
        else eArtist = musicIndex.artists[artistId] ;
        eArtist.albums[albumId] = eAlbum ;

        musicIndex.songs[songId] = eSong ;
        musicIndex.albums[albumId] = eAlbum ;
        musicIndex.artists[artistId] = eArtist ;

      });},
		getAllArtists: function() { return iToa(musicIndex.artists) ;  } ,
		getAlbumsByArtistId: function(artistId) { return iToa(musicIndex.artists[artistId].albums) ; },
    getAllAlbums: function() { return iToa(musicIndex.albums) ; },
		getSongsByAlbumId: function(albumId){ return iToa(musicIndex.albums[albumId].songs) ; }
	};
} ] ) ;

/* R O U T I N G */
pimusicApp.config(['$routeProvider',function($routeProvider) {
	var prefix_partial = '/assets/templates/' , resolve = {wait:'mEntitiesInit'} ;
    $routeProvider.
      when('/artists', {templateUrl: prefix_partial + 'tileset.html', controller: 'ArtistsCtrl', resolve:resolve}).
      when('/artists/:artistId',  {templateUrl: prefix_partial + 'tileset.html', controller: 'AlbumsCtrl', resolve:resolve}).
      when('/albums/:albumId',  {templateUrl: prefix_partial +  'songs.html',   controller: 'SongsCtrl', resolve:resolve}).
      when('/albums',           {templateUrl: prefix_partial +  'tileset.html',   controller: 'AlbumsCtrl', resolve:resolve}).
      when('/play/songs/:songId',  {templateUrl: prefix_partial +  'songs.html',   controller: 'SongsCtrl', resolve:resolve}).
      otherwise({redirectTo: '/artists'});
  }]);


/* C O N T R O L S */
var pimusicControllers = angular.module('pimusicControllers', [ 'infinite-scroll' ] );
pimusicControllers.controller('HeaderCtrl', // header
  ['$scope' , function ( $scope ) {
    $scope.playing = false ;
    $scope.playPause = function() { $scope.playing = !$scope.playing ; } ;
}]);
pimusicControllers.controller('LoadCtrl', // preLoad
  ['$scope' , '$interval', 'mEntitiesLoader', function ( $scope, $interval, mEntitiesLoader ) {
    $scope.load = 0 ;
    var fakeval = 0 ;
    var fake = $interval( function() {$scope.load = fakeval + 1 ; fakeval = $scope.load ; }, 300 ) ;
    mEntitiesLoader.onLoadProgress(function( percent ) { 
      if( fake ) { $interval.cancel( fake ) ; fake = false ; }
      $scope.load = parseInt( (100-fakeval)*percent/100 ) + fakeval ;}) ;
    mEntitiesLoader.onLoadFinish(function( ) { $scope.finish = true ;}) ;
}]);
pimusicControllers.controller('ArtistsCtrl', // Artists
  ['$scope', 'mEntities', 'infiniteScrollHandler' , function ($scope, mEntities, infiniteScrollHandler ) {
    infiniteScrollHandler( $scope,  mEntities.getAllArtists() , 'addSlice' ) ;
    $scope.tileLinkUrl = function( tile ) { return '#/artists/' + tile.id ; } ;
    $scope.tileType = 'artist' ;
}]);
pimusicControllers.controller('AlbumsCtrl', // Albums
  ['$scope' , 'mEntities', '$routeParams' , 'infiniteScrollHandler', function ($scope, mEntities, $routeParams , infiniteScrollHandler ) {
    var albums = ($routeParams.artistId) ? 
      mEntities.getAlbumsByArtistId($routeParams.artistId) : 
      mEntities.getAllAlbums() ;
    infiniteScrollHandler( $scope, albums , 'addSlice' ) ;
    $scope.tileLinkUrl = function( tile ) { return '#/albums/' + tile.id ; } ;
    $scope.tileType = 'album' ;
}]);
pimusicControllers.controller('SongsCtrl', // Songs
  ['$scope', 'mEntities', '$routeParams', 'mPlayer' , function ($scope, mEntities, $routeParams, mPlayer  ) {
  	$scope.songs = mEntities.getSongsByAlbumId($routeParams.albumId) ;
    $scope.playSong = function(song) { mPlayer.startPlay( song.id , function() {
      console.log('song started : controller callback() !') ;
    }) ; } ;
}]);