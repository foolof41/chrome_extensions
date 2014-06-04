function displayNotification(callback){
	var id = "noti01";
	var obj = {
		'type':'basic',
		'priority':99,
		'buttons':[],
		'iconUrl':'16.png',
		'title':'Test Notification',
		'message':'Test Content'
	};

	var notify = {
		'url':null,
		'buttons':[],
		'callback':callback
	}

	chrome.notifications.create(id,obj,callback);
}

function popAndShow(){
	displayNotification(function(){alert('notifications callback')})
}

chrome.notifications.onClosed.addListener(function(id,byUser){
	if (byUser) {
		alert('notification closed');
	}else{
		alert('click content')
	}
})

setTimeout(popAndShow,5000);


chrome.omnibox.onInputChanged.addListener(function(text,suggest){
	console.log('inputChanged: '+text);
	suggest([
		{content:text + ' one',description:"the first one"},
		{content:text + ' 2',description:"the second entry"}
	])
})

chrome.omnibox.onInputEntered.addListener(
	function(text){
		console.log('inputEntered:'+text);
		if(text == 'img'){
			//window.open("http://webplat.ied.com","_blank")
			document.location = "http://webplat.ied.com";
		}
		//alert('you just typed "' + text + '"');
	}
)


