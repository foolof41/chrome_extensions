function bookmarksLoad(a){if(a){$("#bookmarks").addClass("loading");$("#bookmarks ul").html("");chrome.bookmarks.get(a,function(b){if(b[0].parentId>-1){$("#bookmarks ul").append('<li class="bookmark_folder bookmark_back" parent="'+(b[0].parentId)+'" rel="'+(b[0].parentId)+'">返回</li>')}});chrome.bookmarks.getChildren(a,function(b){for(var c=0;c<b.length;c++){renderBookmark(b[c])}});$("#bookmarks").removeClass("loading")}}function renderBookmark(d){var b=document.createElement("li");var c=document.createElement("a");if(d.url){b.style.backgroundImage="url(chrome://favicon/"+d.url+")";b.setAttribute("class","bookmark_link openurl");b.setAttribute("rel",d.url);c.setAttribute("href",d.url);if(d.title==""){d.title=d.url}c.innerHTML=(getValue("options.sidebar.showBookmarksURL")==1)?"<b>"+safestr(d.title)+"</b><span>"+d.url+" </span> ":"<b>"+safestr(d.title)+"</b>"}else{b.setAttribute("class","bookmark_folder");b.setAttribute("rel",d.id);b.addEventListener("click",function(){bookmarksLoad(d.id)});if(d.title==""){d.title=d.url}c.innerHTML=safestr(d.title)}b.appendChild(c);$("#bookmarks ul").append(b)}$(function(){$(document).on("click",".bookmark_back",function(){bookmarksLoad($(this).attr("rel"))});$("#bookmarks-search").keyup(function(a){if(a.keyCode==27){bookmarksLoad("1");$(this).val("");return false}query=$(this).val();if(query.length<3){return false}$("#bookmarks ul").html("").append('<li class="bookmark_folder bookmark_back" rel="0">返回</li>');chrome.bookmarks.search(query,function(b){for(var c=0;c<b.length;c++){renderBookmark(b[c])}})})});