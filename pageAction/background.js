/*chrome.runtime.onInstalled.addListener(function(){
	chrome.declarativeContent.onPageChanged.removeRules(undefined,function(){
		chrome.declarativeContent.onPageChanged.addRules([{
			conditions:[
				new chrome.declarativeContent.PageStateMatcher({
					pageUrl:{urlContains:'g'}
				})
			],
			actions:[new chrome.declarativeContent.ShowPageAction()]
		}])
	});
});

page action with url

*/

var lastTabId = 0;
var tab_clicks = {};

chrome.tabs.onSelectionChanged.addListener(function(tabId){
	lastTabId = tabId;
	chrome.pageAction.show(lastTabId);
});

chrome.tabs.query({
		active:true,
		currentWindow:true
	},function(tabs){
		lastTabId = tabs[0].id;
		chrome.pageAction.show(lastTabId);
});

chrome.pageAction.onClicked.addListener(function(tab){
	var clicks = tab_clicks[tab.id] || 0;
	chrome.pageAction.setIcon({
		path:(clicks + 1) + ".png",
		tabId:tab.id
	});
	if (clicks%2) {
		chrome.pageAction.show(tab.id);
	}else{
		chrome.pageAction.hide(tab.id);
		setTimeout(function(){chrome.pageAction.show(tab.id)},200)
	};

	chrome.pageAction.setTitle({title:"click:"+clicks,tabId:tab.id});

	clicks ++;
	if (clicks>3) {clicks = 0};
	tab_clicks[tab.id] = clicks;
});


var i= 0;
window.setInterval(function(){
	var clicks = tab_clicks[lastTabId] || 0;

	if (clicks>0) return;

	if (lastTabId == 0) return;
	i++;
	chrome.pageAction.setIcon({iamgeData:draw(i*2,i*4),tabId:lastTabId});
},50)

function draw(starty,startx){
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	context.clearRect(0,0,canvas.width,canvas.height);
	context.fillStyle = "rgba(0,200,0,255)";
	context.fillRect(startx%19,starty%19,8,8);
	context.fillStyle = "rgba(0,0,200,255)";
	context.fillRect((startx+5)%19,(starty+5)%19,8,8);
	context.fillStyle = "rgba(200,0,0,255)";
	context.fillRect((startx+10)%19,(starty+10)%19,8,8);
	return context.getImageData(0,0,19,19);
}