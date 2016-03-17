/**
 * calendar
 */
var calendarDemoApp = angular.module('Calendar', ['ui.bootstrap.modal', 'ui.bootstrap.dropdown', 'ui.bootstrap.tooltip', 'ui.bootstrap.dateandtime', 'ui.calendar']);

calendarDemoApp.directive('ngFocus', function($timeout) {
    return {
        link: function ( scope, element, attrs ) {
            scope.$watch( attrs.ngFocus, function ( val ) {
                if ( angular.isDefined( val ) && val ) {
                    $timeout( function () { element[0].focus(); } );
                }
            }, true);

            element.bind('blur', function () {
                if ( angular.isDefined( attrs.ngFocusLost ) ) {
                    scope.$apply( attrs.ngFocusLost );

                }
            });
        }
    };
});

calendarDemoApp.controller('CalendarCtrl', function($scope, $compile, $timeout, $http, $sce, uiCalendarConfig) {
	$scope.events = [];
	$scope.sevents = [];
	$scope.loggedin = false;
	$scope.storageExists = false;
	$scope.show_attempt_event = false;
    $scope.userProfile = {};
    $scope.newevent = {};
    $scope.metadata = "app-calendar";
    $scope.prefix = "event_";
    $scope.appurl = "http://mzereba.github.io/calendar/";
    $scope.apptypes = ["http://motools.sourceforge.net/event/event.html", "http://www.w3.org/ns/pim/schedule"];
    
    var CREATE = 0;
    var UPDATE = 1;
    
    $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
	$scope.format = $scope.formats[0];
	
	var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();
    
    var providerURI = '//linkeddata.github.io/signup/index.html?ref=';
    $scope.widgetURI = $sce.trustAsResourceUrl(providerURI+window.location.protocol+'//'+window.location.host);
    
    // Define the appuri, used as key when saving to sessionStorage
    $scope.appuri = window.location.origin;
    
    $scope.status = {
        isopen: false
	};

	$scope.toggled = function(open) {
		$log.log('Dropdown is now: ', open);
	};
	

	$scope.toggleDropdown = function($event) {
		$event.preventDefault();
		$event.stopPropagation();
		$scope.status.isopen = !$scope.status.isopen;
	};
	
	$scope.today = function() {
	    $scope.dt = new Date();
	};
	
	$scope.today();

	$scope.clear = function () {
		$scope.dt = null;
	};

	// Disable weekend selection
	$scope.disabled = function(date, mode) {
		return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
	};

	$scope.toggleMin = function() {
		$scope.minDate = $scope.minDate ? null : new Date();
	};
  
	$scope.toggleMin();
	$scope.maxDate = new Date(2020, 5, 22);

	$scope.openStart = function($event) {
		$scope.dateStatusStart.opened = true;
	};
	
	$scope.openEnd = function($event) {
		$scope.dateStatusEnd.opened = true;
	};

	$scope.setDate = function(year, month, day) {
		$scope.dt = new Date(year, month, day);
	};

	$scope.dateOptions = {
		formatYear: 'yy',
		startingDay: 1
	};

	$scope.dateStatusStart = {
		opened: false
	};
	
	$scope.dateStatusEnd = {
		opened: false
	};

	var tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	var afterTomorrow = new Date();
	afterTomorrow.setDate(tomorrow.getDate() + 2);
	$scope.dateevents =
	    [
	      {
	        date: tomorrow,
	        status: 'full'
	  },
	  {
	    date: afterTomorrow,
	    status: 'partially'
	      }
	    ];

	$scope.getDayClass = function(date, mode) {
		if (mode === 'day') {
			var dayToCheck = new Date(date).setHours(0,0,0,0);

			for (var i=0;i<$scope.dateevents.length;i++){
				var currentDay = new Date($scope.dateevents[i].date).setHours(0,0,0,0);

				if (dayToCheck === currentDay) {
					return $scope.dateevents[i].status;
				}
			}
		}

		return '';
	};
	
	$scope.newevent.starttime = new Date();
	$scope.newevent.starttime.setHours(0);
	$scope.newevent.starttime.setMinutes(0);
	
	$scope.newevent.endtime = new Date();
	$scope.newevent.endtime.setHours(0);
	$scope.newevent.endtime.setMinutes(0);

	$scope.hstep = 1;
	$scope.mstep = 15;
	$scope.ismeridian = false;
		
	$scope.changed = function () {
	  $log.log('Time changed to: ' + $scope.mytime);
	};
	
	// Simply returns item matching given value
    $scope.get = function (items, value) {
        for (i in items) {
            if (items[i] == value) {
                return items[i];
            }
        }
    };
    
    $scope.getEvent = function (id) {
	    for (i in $scope.events) {
	        if ($scope.events[i].id == id) {
	        	return $scope.events[i];
	        }
	    }
    };
    
    $scope.authenticate = function(webid) {
        if (webid.slice(0,4) == 'http') {
        	$scope.loggedin = true;
            notify('Success', 'Authenticated user.');
        } else {
            notify('Failed', 'Authentication failed.');
        }
    };
       
    // Save profile object in sessionStorage after login
    $scope.saveCredentials = function () {
        var app = {};
        var _user = {};
        app.userProfile = $scope.userProfile;
        sessionStorage.setItem($scope.appuri, JSON.stringify(app));
    };
    
    // Logs user out
    $scope.logout = function() {
    	$scope.events.length = 0;
    	$scope.userProfile = {};
    	$scope.clearLocalCredentials();
    	$scope.loggedin = false;
    };
    
    // Clears sessionStorage on logout
    $scope.clearLocalCredentials = function () {
        sessionStorage.removeItem($scope.appuri);
    };
    
    $scope.openAuth = function() {
    	$scope.authenticationModal = true;	 
    };
    
    $scope.closeAuth = function() {
    	$scope.authenticationModal = false;
    };
    
    // Opens the pop up for creating an event
    $scope.add = function() {
    	$scope.modalTitle = "New Event";
    	$scope.addEventModal = true;
    	$scope.newevent = {};
    	$scope.isFocused = true;
    };
    
    // Simply search event list for given contact
    // and replaces the contact object if found
    $scope.replace = function (event) {
        for (i in $scope.events) {
            if ($scope.events[i].id == event.id) {
                $scope.events[i] = angular.copy(event);
            }
        }
    };
    
    // Creates an event resource
    $scope.save = function(newevent) {
    	if (newevent.id == null) {
            //if this is new event, add it in events array
    		//generate unique id
    		newevent.id = new Date().getTime();
            var dStart = new Date(newevent.start.getFullYear(), newevent.start.getMonth(), newevent.start.getDate(), newevent.starttime.getHours(), newevent.starttime.getMinutes());
            var dEnd = new Date(newevent.end.getFullYear(), newevent.end.getMonth(), newevent.end.getDate(), newevent.endtime.getHours(), newevent.endtime.getMinutes());
            var event = {id:newevent.id, title:newevent.title, start:dStart, end:dEnd};
            $scope.insertEvent(event, CREATE);
        } else {
            //for existing event, find this event using id
            //and update it.
            for (i in $scope.events) {
                if ($scope.events[i].id == newevent.id) {
                	$scope.insertEvent(newevent, UPDATE);
                }
            }
        }
    	
    	$scope.closeEditor();
    };
        
    $scope.closeEditor = function() {
    	$scope.addEventModal = false;
    	$scope.isFocused = false;
    	$scope.newevent = {};
    	$scope.newevent.starttime = new Date();
    	$scope.newevent.starttime.setHours(0);
    	$scope.newevent.starttime.setMinutes(0);
    	
    	$scope.newevent.endtime = new Date();
    	$scope.newevent.endtime.setHours(0);
    	$scope.newevent.endtime.setMinutes(0);
    };
    
    $scope.myStorage = function() {
    	$scope.modalTitle = "My Storage";
    	$scope.myStorageModal = true;
    	$scope.mystorage = {};
    	$scope.mystorage.workspace = $scope.userProfile.workspaces[0];
    	$scope.isFocused = true;
    	$scope.noteTitle = "";
    	
    	if($scope.userProfile.calendarStorage != null) {
    		var split = $scope.userProfile.calendarStorage.split("/");
    		var ws ="";
    		$scope.mystorage.storagename = split[split.length-2];
    		for(var i=0; i<split.length-2; i++){
    			ws += split[i] + "/";
    		}
    		$scope.mystorage.workspace = $scope.get($scope.userProfile.workspaces, ws);
    	}else{
    		$scope.noteTitle = "Please create a storage location for your calendar events";
    	}
    };
    
    $scope.closeMyStorage = function() {
    	$scope.myStorageModal = false;
    	$scope.isFocused = false;
    	$scope.mystorage = {};
    };
    
    $scope.newStorage = function(mystorage) {
    	var storage = mystorage.workspace + mystorage.storagename + "/";
    	var dir = $scope.userProfile.preferencesDir;
    	var uri = dir + $scope.metadata;  
    	$scope.createOrUpdateMetadata(uri, CREATE, storage);
    	$scope.closeMyStorage();
    };
    
    $scope.checkStorage = function(mystorage) {
    	$scope.isContainerExisting(mystorage);
    };
    
    $scope.toggleAttemptEvent = function() {
    	if($scope.show_attempt_event) {
    		$scope.eventSources.push($scope.tentatives_scheduler_events);
    	} else {
    		for(i=0; i<$scope.eventSources.length; i++){
    		    if($scope.eventSources[i].name == 'tentatives'){
    		    	$scope.eventSources.splice(i, 1);
    		    }
    		}
    	}
    };

    // Gets workspaces
    $scope.getWorkspaces = function (uri) {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    f.nowOrWhenFetched(uri,undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
	
			var evs = g.statementsMatching($rdf.sym($scope.userProfile.webid), SPACE('preferencesFile'), $rdf.sym(uri));
			if (evs.length > 0) {
                var workspaces = [];
				for (var e in evs) {
					var ws = g.statementsMatching(evs[e]['subject'], SPACE('workspace'));
					
					for (var s in ws) {
						var workspace = ws[s]['object']['value'];
						workspaces.push(workspace);
					}
                    //$scope.$apply();
                }
                $scope.userProfile.workspaces = workspaces;
                $scope.saveCredentials();
                $scope.$apply();
			}
			
			$scope.isMetadataExisting();
	    });
    };
    
    // Gets user info
    $scope.getUserInfo = function () {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    var uri = ($scope.userProfile.webid.indexOf('#') >= 0)?$scope.userProfile.webid.slice(0, $scope.userProfile.webid.indexOf('#')):$scope.userProfile.webid;
	    
	    f.nowOrWhenFetched(uri ,undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
			var FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
	
			var evs = g.statementsMatching($rdf.sym($scope.userProfile.webid), RDF('type'), FOAF('Person'));
			if (evs.length > 0) {
				for (var e in evs) {
					var storage = g.anyStatementMatching(evs[e]['subject'], SPACE('storage'))['object']['value'];
					var prfs = g.anyStatementMatching(evs[e]['subject'], SPACE('preferencesFile'))['object']['value'];
					
					var fullnamePredicate = g.anyStatementMatching(evs[e]['subject'], FOAF('name'));
					var fullname = "";
					if(fullnamePredicate != null)
						fullname = fullnamePredicate ['object']['value'];
					else
						fullname = $scope.userProfile.webid;
					
					var imagePredicate = g.anyStatementMatching(evs[e]['subject'], FOAF('img'));
					var image = "";
					if(imagePredicate != null)
						image = imagePredicate ['object']['value'];
					else
						image = $scope.appurl + "images/generic_photo.png";

					$scope.userProfile.storage = storage;
                    if (prfs && prfs.length > 0) {
                        $scope.userProfile.preferencesFile = prfs;
                        $scope.getWorkspaces(prfs);

                        var split = $scope.userProfile.preferencesFile.split("/");
                        var prfsDir = "";
                        for(var i=0; i<split.length-1; i++){
                            prfsDir += split[i] + "/";
                        }
                        
                        $scope.userProfile.preferencesDir = prfsDir;
                    } 

				    $scope.userProfile.fullname = fullname;
					$scope.userProfile.image = image;
				    
					//$scope.saveCredentials();
                    //$scope.$apply();
                }
			}
			
            //$scope.getEndPoint($scope.userProfile.storage);
	    });  
    };
            
    // Gets calendar storage
    $scope.getStorage = function (uri) {
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    
	    f.nowOrWhenFetched(uri + '',undefined,function(){	
		    var DC = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var APP = $rdf.Namespace('https://example.com/');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
	
			var evs = g.statementsMatching(undefined, RDF('type'), APP('application'));
			if (evs != undefined) {
				for (var e in evs) {
					var id = evs[e]['subject']['value'];
					var storage = g.anyStatementMatching(evs[e]['subject'], SPACE('storage'))['object']['value'];
										
					$scope.userProfile.calendarStorage = storage;
					$scope.saveCredentials();
					$scope.storageExists = true;
                    $scope.$apply();
                }
			}
			//fetch user events
			$scope.loadCalendarEvents($scope.userProfile.calendarStorage);
	    });
    };
    
    // Gets calendar storage
    $scope.getSchedulerStorage = function () {
    	var uri = $scope.userProfile.preferencesDir;
		var g = $rdf.graph();
	    var f = $rdf.fetcher(g);
	    
	    f.nowOrWhenFetched(uri + '*',undefined,function(){	
		    var TITLE = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
			var APP = $rdf.Namespace('https://example.com/');
			var SPACE = $rdf.Namespace('http://www.w3.org/ns/pim/space#');
	
			var evs = g.statementsMatching(undefined, RDF('type'), APP('application'));
			if (evs != undefined) {
				for (var e in evs) {
					var title = g.anyStatementMatching(evs[e]['subject'], TITLE('title'))['object']['value'];
					if(title == "Scheduler") {
						var storage = g.anyStatementMatching(evs[e]['subject'], SPACE('storage'))['object']['value'];
											
						$scope.userProfile.schedulerStorage = storage;
						$scope.saveCredentials();
						//$scope.storageExists = true;
	                    $scope.$apply();
					}
                }
			}
			//fetch user events
			$scope.loadSchedulerContainers($scope.userProfile.schedulerStorage);
	    });
    };
    
    // Lists events resources
    $scope.loadCalendarEvents = function (uri) {
		var g = $rdf.graph();
		var f = $rdf.fetcher(g);
	    f.nowOrWhenFetched(uri + '*',undefined,function() {
	    	var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
		    var TITLE = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var TIMELINE = $rdf.Namespace('http://purl.org/NET/c4dm/timeline.owl#');
			var EVENT = $rdf.Namespace('http://purl.org/NET/c4dm/event.owl#');
			var MAKER = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
			
			var evs = g.statementsMatching(undefined, RDF('type'), EVENT('Event'));
			if (evs != undefined) {
				for (var e in evs) {
					var id = evs[e]['subject']['value']; 
					var sId = id.split("_");
					
					var title = g.anyStatementMatching(evs[e]['subject'], TITLE('title'))['object']['value'];
					
					var sStart = g.anyStatementMatching(evs[e]['subject'], TIMELINE('start'))['object']['value'];
					var start = new Date(sStart);
					start = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes());
		            
					var sEnd = g.anyStatementMatching(evs[e]['subject'], TIMELINE('end'))['object']['value'];
					var end = new Date(sEnd);
					end = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes());
					
					var webid = g.anyStatementMatching(evs[e]['subject'], MAKER('maker'))['object']['value'];
															
					var sevent = {
					    id: sId[1],
					    title: title,
					    start: start,
					    end: end,
						webid: webid
					}
										
					$scope.events.push(sevent);
                    $scope.$apply();
                }
			}
	    });  
    };
    
    // Lists containers resources
    $scope.loadSchedulerContainers = function (uri) {
		var containers = [];
    	var g = $rdf.graph();
		var f = $rdf.fetcher(g);
	    f.nowOrWhenFetched(uri ,undefined,function() {
	    	var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
		    var TITLE = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var TIMELINE = $rdf.Namespace('http://purl.org/NET/c4dm/timeline.owl#');
			var EVENT = $rdf.Namespace('https://meccano.io/scheduler#');
			var LDP = $rdf.Namespace('http://www.w3.org/ns/ldp#');
			var STAT = $rdf.Namespace('http://www.w3.org/ns/posix/stat#');
			
			var evs = g.statementsMatching(undefined, RDF('type'), LDP('Container'));
			if (evs != undefined) {
				for (var e in evs) {
					var contains = g.statementsMatching(evs[e]['subject'], LDP('contains'));
					for (var c in contains) {
						var container = contains[c]['object']['value'];
						containers.push(container);
						$scope.$apply();
					}															
                }
			}
			
			$scope.loopSchedulerContainers(containers);
	    });
    };
    
    // Loops containers 
    $scope.loopSchedulerContainers = function (containers) {
    	for (var i in containers) {
    		$scope.loadSchedulerEvents(containers[i]);
    	}
    };
    
    // Lists events resources
    $scope.loadSchedulerEvents = function (uri) {
		var title = uri.split("/");
    	var g = $rdf.graph();
		var f = $rdf.fetcher(g);
	    f.nowOrWhenFetched(uri + '*',undefined,function() {
	    	var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
		    var TITLE = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var TIMELINE = $rdf.Namespace('http://purl.org/NET/c4dm/timeline.owl#');
			var EVENT = $rdf.Namespace('https://meccano.io/scheduler#');
			var MAKER = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
			
			var evs = g.statementsMatching(undefined, RDF('type'), EVENT('schedulerResponse'));
			if (evs != undefined) {
				for (var e in evs) {
					var id = evs[e]['subject']['value'];
					var sId = id.split("_");
					
					var partecipant = g.anyStatementMatching(evs[e]['subject'], EVENT('partecipant'))['object']['value'];
					
					if(partecipant == $scope.userProfile.webid) {
						title = title[title.length-2];
						
						var confirmed = g.statementsMatching(evs[e]['subject'], EVENT('confirmed'));
						var dates = [];
						for (var p in confirmed) {
							var prop = confirmed[p]['object']['value'];
							var date = new Date(prop);
							date = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours());
							var s_event = {
								    id: sId[sId.length-1],
								    title: title,
								    start: date,
								    end: date,
							}
							
							$scope.tentatives_scheduler_events.events.push(s_event);
							$scope.$apply();
						}
					}
                }
			}
	    });  
    };
    
    // Lists schedulable events resources
    $scope.loadSchedules = function (uri) {
		var g = $rdf.graph();
		var f = $rdf.fetcher(g);
	    f.nowOrWhenFetched(uri + '*',undefined,function() {
	    	var RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
		    var TITLE = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var CREATED = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			var SEVENT = $rdf.Namespace('http://www.w3.org/ns/pim/schedule#');
			var AUTHOR = $rdf.Namespace('http://purl.org/dc/elements/1.1/');
			
			var evs = g.statementsMatching(undefined, RDF('type'), SEVENT('SchedulableEvent'));
			if (evs != undefined) {
				for (var e in evs) {
					var id = evs[e]['subject']['value']; 
					var sId = id.split("/");
					
					var title = g.anyStatementMatching(evs[e]['subject'], TITLE('title'))['object']['value'];
					
					var sStart = g.anyStatementMatching(evs[e]['subject'], CREATED('created'))['object']['value'];
					var start = new Date(sStart);
					var end = new Date(sStart);
					
					var webid = g.anyStatementMatching(evs[e]['subject'], AUTHOR('author'))['object']['value'];
																				
					var sEvent = {
					    id: sId[sId.length-1],
					    title: title,
					    start: start,
					    end: end,
						webid: webid
					}
										
					$scope.sEvents.events.push(sEvent);
                    $scope.$apply();
                }
			}
	    });  
    };
        
    // Check if metadata for calendar app exists, if not create it
    $scope.isMetadataExisting = function () {
    	var uri = $scope.userProfile.preferencesDir;
	    uri += $scope.metadata;
	    
        $http({
          method: 'HEAD',
          url: uri,
          withCredentials: true
        }).
        success(function(data, status, headers) {
        	//container found, load metadata
        	$scope.getStorage(uri);
        	$scope.getSchedulerStorage();
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create a directory for: '+$scope.user);
          } else if (status == 403) {
        	  notify('Forbidden', 'You are not allowed to access storage for: '+$scope.user);
          } else if (status == 404) {
        	  //open dialog to create metadata containing calendar storage
        	  $scope.myStorage();
          } else {
        	  notify('Failed - HTTP '+status, data, 5000);
          }
        });
    };
    
    // Creates or updates calendar metadata
    $scope.createOrUpdateMetadata = function (uri, action, container) {
    	var resource = $scope.metadataTemplate(uri, container);
		$http({
          method: 'PUT', 
	      url: uri,
          data: resource,
          headers: {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
            if(action == CREATE){
            	notify('Success', uri + " created");
            	$scope.createContainer(action, container);
            } else {
            	notify('Success', uri + " updated");
            	$scope.createContainer(action, container);
            }
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create new directory.');
          } else if (status == 403) {
            notify('Forbiddenn', 'You are not allowed to create new directory.');
          } else {
            notify('Failed: '+ status + data);
          }
        });
    };
            
    // Creates container
    $scope.createContainer = function (action, container) {
    	var uri = container;
	    
		$http({
          method: 'PUT', 
	      url: uri,
          data: '',
          headers: {
            'Content-Type': 'text/turtle',
			'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
        	  notify('Success', 'Calendar container has been created under ' + container);
        	  var path = $scope.userProfile.preferencesDir + $scope.metadata;
        	  $scope.getStorage(path);
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create new directory.');
          } else if (status == 403) {
            notify('Forbiddenn', 'You are not allowed to create new directory.');
          } else {
            notify('Failed: '+ status + data);
          }
        });
    };
        
    // Insert or update an event resource
    $scope.insertEvent = function (event, operation) {
	    var uri = $scope.userProfile.calendarStorage + $scope.prefix + event.id;
        var resource = $scope.eventTemplate(event, uri);
        $http({
          method: 'PUT', 
          url: uri,
          data: resource,
          headers: {
            'Content-Type': 'text/turtle',
            'Link': '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
          },
          withCredentials: true
        }).
        success(function(data, status, headers) {
          if (status == 200 || status == 201) {
            if(operation == CREATE){
            	notify('Success', 'Resource created.');
            	//update view
            	$scope.events.push(event);
            }
            else {
            	notify('Success', 'Resource updated.');
    	    	$scope.replace(event);
          	}
            $scope.newevent = {};
          }
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create new resource.');
          } else if (status == 403) {
            notify('Forbidden', 'You are not allowed to create new resource.');
          } else {
            notify('Failed '+ status + data);
          }
        });
    };
    
    // Iterate through events list and delete event
    $scope.remove = function (index) {
    	var event = $scope.events[index];
        var uri = $scope.userProfile.calendarStorage + $scope.prefix + event.id;
    	$http({
    	      method: 'DELETE',
    	      url: uri,
    	      withCredentials: true
    	    }).
    	    success(function(data, status, headers) {
    	      if (status == 200) {
    	    	notify('Success', 'Resource deleted.');
    	        //update view
   	    		$scope.events.splice(index, 1);
    	      }
    	    }).
    	    error(function(data, status) {
    	      if (status == 401) {
    	    	  notify('Forbidden', 'Authentication required to delete '+uri);
    	      } else if (status == 403) {
    	    	  notify('Forbidden', 'You are not allowed to delete '+uri);
    	      } else if (status == 409) {
    	    	  notify('Failed', 'Conflict detected. In case of directory, check if not empty.');
    	      } else {
    	    	  notify('Failed '+status, data);
    	      }
    	});
    };
    
    // Checks if a container exists
    $scope.isContainerExisting = function (mystorage) {
    	var uri = mystorage.workspace + mystorage.storagename + "/";
    	$http({
          method: 'HEAD',
          url: uri,
          withCredentials: true
        }).
        success(function(data, status, headers) {
        	//container found, warn user to create a different one
        	$scope.noteTitle = "Warning: name already existing in the selected workspace!";
    		$scope.$digest();
        }).
        error(function(data, status) {
          if (status == 401) {
            notify('Forbidden', 'Authentication required to create a directory for: '+$scope.user);
          } else if (status == 403) {
        	  notify('Forbidden', 'You are not allowed to access storage for: '+$scope.user);
          } else if (status == 404) {
        	  //container not existing, proceed
        	  $scope.newStorage(mystorage);
          } else {
        	  notify('Failed - HTTP '+status, data, 5000);
          }
        });
    };
    
    // Composes an event as RDF resource
    $scope.eventTemplate = function (event, uri) {	// YYYY-MM-ddTHH:mm:ss.000Z
    	var sStart = buildDate(event.start);
    	var sEnd = buildDate(event.end);
    	
    	var rdf =   "<" + uri + ">\n" +
    				"a <http://purl.org/NET/c4dm/event.owl#Event> ;\n" +
    				"<http://purl.org/dc/elements/1.1/title> \"" + event.title + "\" ;\n" +
    				"<http://purl.org/NET/c4dm/timeline.owl#start> \"" + sStart + "\"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;\n" + 
					"<http://purl.org/NET/c4dm/timeline.owl#end> \"" + sEnd + "\"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;\n" +
					"<http://xmlns.com/foaf/0.1/maker> <" + $scope.userProfile.webid + "> .\n" ;
    	return rdf;
    };
    
    // Composes the app metadata as RDF resource
    $scope.metadataTemplate = function (uri, container) {  	
    	var rdf = "";
		var sTypes = "";
	    if($scope.apptypes.length > 0) {
    		for(i in $scope.apptypes) {
    			sTypes += "<" + $scope.apptypes[i] + ">";
    			if(i != $scope.apptypes.length-1)
    				sTypes += ", ";	    				
     		}
    	}
	    
	    var aWorkspace = container.split("/");
	    var sWorkspace = "";
		for(var j=0; j<aWorkspace.length-2; j++){
			sWorkspace += aWorkspace[j] + "/";
		}
	    
	    rdf = "<" + uri + ">\n" +
 		 "a <https://example.com/application> ;\n" +
 		 "<http://purl.org/dc/elements/1.1/title> \"Calendar\" ;\n" +
 		 "<https://example.com/app-url> <" + $scope.appurl + "> ;\n" + 
 		 "<https://example.com/logo> <" + $scope.appurl + "images/calendar.gif" + "> ;\n" +
 		"<http://www.w3.org/ns/pim/space#workspace> <" + sWorkspace + "> ;\n" +
 		 "<http://www.w3.org/ns/pim/space#storage> <" + container + "> ;\n" +
 		 "<https://example.com/types> " + sTypes + " ." ;	    
		         
    	return rdf;
    };
                
    /* event source that calls a function on every view switch */
    $scope.eventsF = function (start, end, timezone, callback) {
      var s = new Date(start).getTime() / 1000;
      var e = new Date(end).getTime() / 1000;
      var m = new Date(start).getMonth();
      var events = [{title: 'Feed Me ' + m,start: s + (50000),end: s + (100000),allDay: false, className: ['customFeed']}];
      callback(events);
    };

    $scope.tentatives_scheduler_events = {
       name: 'tentatives',
       color: '#f5f5f5',
       textColor: '#4771A5',
       borderColor: '#4771A5',
       events: [
          //{type:'party',title: 'Lunch',start: new Date(y, m, d, 12, 0),end: new Date(y, m, d, 14, 0),allDay: false},
          //{type:'party',title: 'Lunch 2',start: new Date(y, m, d, 12, 0),end: new Date(y, m, d, 14, 0),allDay: false},
          //{type:'party',title: 'Click for Google',start: new Date(y, m, 28),end: new Date(y, m, 29),url: 'http://google.com/'}
        ]
    };
    
    $scope.completed_scheduler_events = {
       name: 'completed',
       color: '#4771A5',
       textColor: '#ffffff',
       borderColor: '#29568F',
       events: [
          //{type:'party',title: 'Lunch',start: new Date(y, m, d, 12, 0),end: new Date(y, m, d, 14, 0),allDay: false},
          //{type:'party',title: 'Lunch 2',start: new Date(y, m, d, 12, 0),end: new Date(y, m, d, 14, 0),allDay: false},
          //{type:'party',title: 'Click for Google',start: new Date(y, m, 28),end: new Date(y, m, 29),url: 'http://google.com/'}
        ]
    };
    
    /* alert on eventClick */
    $scope.alertOnEventClick = function(date, jsEvent, view){
        //$scope.alertMessage = (date.title + ' was clicked ');
    };
    
    /* alert on Drop */
     $scope.alertOnDrop = function(event, delta, revertFunc, jsEvent, ui, view){
    	 var currentEvent = $scope.getEvent(event.id);
    	 var start = currentEvent.start;
    	 var end = currentEvent.end;
    	 var diffDays = delta/1000/60/60/24;
    	 currentEvent.start = start.AddDays(diffDays);
    	 currentEvent.end = end.AddDays(diffDays);
    	 
    	 $scope.insertEvent(currentEvent, UPDATE);
    	 
    	 $scope.alertMessage = ('Event \'' + currentEvent.title + '\' moved ' + diffDays + ' days');
    };
    
    /* alert on Resize */
    $scope.alertOnResize = function(event, delta, revertFunc, jsEvent, ui, view ){
    	 var currentEvent = $scope.getEvent(event.id);
	   	 var start = currentEvent.start;
	   	 var end = currentEvent.end;
	   	 var diffMinutes = delta/1000/60;
	   	 //currentEvent.start = start.AddMinutes(diffMinutes);
	   	 currentEvent.end = end.AddMinutes(diffMinutes);
   	 
	   	 $scope.insertEvent(currentEvent, UPDATE);
	   	 
	   	 $scope.alertMessage = ('Event \'' + currentEvent.title + '\' resized ' + diffMinutes + ' minutes');
    };
    
    /* Change View */
    $scope.changeView = function(view,calendar) {
      uiCalendarConfig.calendars[calendar].fullCalendar('changeView',view);
    };
    
    /* Change View */
    $scope.renderCalender = function(calendar) {
      $timeout(function() {
        if(uiCalendarConfig.calendars[calendar]){
          uiCalendarConfig.calendars[calendar].fullCalendar('render');
        }
      });
    };
    
     /* Render Tooltip */
    $scope.eventRender = function( event, element, view ) {
        element.attr({'tooltip': event.title,
                      'tooltip-append-to-body': true});
        $compile(element)($scope);
    };
    
    /* config object */
    $scope.uiConfig = {
      calendar:{
        height: 450,
        editable: true,
        header:{
          left: 'title',
          center: '',
          right: 'today prev,next'
        },
        eventClick: $scope.alertOnEventClick,
        eventDrop: $scope.alertOnDrop,
        eventResize: $scope.alertOnResize,
        eventRender: $scope.eventRender
      }
    };
   
    /* event sources array*/
    $scope.eventSources = [$scope.events, $scope.eventsF, $scope.completed_scheduler_events];
    //$scope.eventSources2 = [$scope.sEvents, $scope.eventsF, $scope.events, $scope.sevents];
    
    //Builds a customized timestamp date
    function buildDate(date){
    	var year = date.getFullYear();
    	var month = date.getMonth()+1;
    	var day = date.getDate();
    	var hours = date.getHours();
    	var minutes = date.getMinutes();
    	var seconds = "0";
    	
    	if(month < 10){
    		month = "0" + month;
    	}
    	
    	if(day < 10){
    		day = "0" + day;
    	}
    	
    	if(hours < 10){
    		hours = "0" + hours;
    	}
    	
    	if(minutes < 10){
    		minutes = "0" + minutes;
    	}
    	
    	if(seconds < 10){
    		seconds = "0" + seconds;
    	}
    		
    	var sDate = year + "-" + month + "-" + day + "T" + hours + ":" + minutes + ":" + seconds + ".000Z";
    	return sDate;
    }
    
    //Adds or subtracts date by days
    Date.prototype.AddDays = function(nDays) {
        this.setTime(this.getTime() + (nDays * (1000 * 60 * 60 * 24)));
        return this;
    }
    
    //Adds or subtracts date by minutes
    Date.prototype.AddMinutes = function(nMinutes) {
        this.setTime(this.getTime() + (nMinutes * (1000 * 60)));
        return this;
    }
    
    // Listen to WebIDAuth events
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventListener = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
    eventListener(messageEvent,function(e) {
        if (e.data.slice(0,5) == 'User:') {          
            $scope.authenticate(e.data.slice(5, e.data.length));
            $scope.userProfile.webid = e.data.slice(5);
            //get user properties
            $scope.getUserInfo();
        }
        
        $scope.closeAuth();
    },false);
    
    // Retrieve from sessionStorage
    if (sessionStorage.getItem($scope.appuri)) {
        var app = JSON.parse(sessionStorage.getItem($scope.appuri));
        if (app.userProfile) {
          //if (!$scope.userProfile) {
          //  $scope.userProfile = {};
          //}
          $scope.userProfile = app.userProfile;
          $scope.getWorkspaces($scope.userProfile.preferencesFile);
          $scope.loggedin = true;
        } else {
          // clear sessionStorage in case there was a change to the data structure
          sessionStorage.removeItem($scope.appuri);
        }
    }
});
/* EOF */
