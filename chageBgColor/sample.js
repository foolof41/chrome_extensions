function onClickHandler(info,tab){
	console.log("item:"+info.menuItemId + " was clicked");
	console.log("info"+JSON.stringify(info));
	console.log("tab"+JSON.stringify(tab));
	alert(info.menuItemId)
}

chrome.contextMenus.onClicked.addListener(onClickHandler);

chrome.runtime.onInstalled.addListener(function(){
	var contexts = ["page","selection","link","editable","image","video","audio"];
	for (var i = 0; i < contexts.length; i++) {
		var context = contexts[i];
		var title = "Test '" + context + "' menu item";
		var id = chrome.contextMenus.create({
			"title":title,
			"contexts":[context],
			"id":"context"+context
		});
		console.log("'"+context+"' item:"+id);
	};

	chrome.contextMenus.create({"title": "Test parent item", "id": "parent"});
	chrome.contextMenus.create({"title": "Child 1", "parentId": "parent", "id": "child1"});
	chrome.contextMenus.create({"title": "Child 2", "parentId": "parent", "id": "child2"});
	console.log("parent clild1 clide2");

	chrome.contextMenus.create({"title": "Radio 1", "type": "radio", "id": "radio1"});
	chrome.contextMenus.create({"title": "Radio 2", "type": "radio", "id": "radio2"});
	console.log('radio1  radio2');

	chrome.contextMenus.create({"title": "Checkbox 1", "type": "checkbox", "id": "checkbox1"});
	chrome.contextMenus.create({"title": "Checkbox 2", "type": "checkbox", "id": "checkbox2"});
	console.log('checkbox1  checkbox2');

	console.log('About to try creating an invalid item - an error about cuplicate item child1 should show up');
	chrome.contextMenus.create({"title":"Oops","id":"child1"},function(){
		if (chrome.extension.lastError) {
			console.log("Got expected error :" + chrome.extension.lastError.message);
		};
	})
})