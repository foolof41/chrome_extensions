var export_settings={};export_settings.groups={};export_settings.dials={};export_settings.settings={};function exportData(){speeddial.storage.open();speeddial.storage.getGroups(function(a,c){for(var d=0;d<c.rows.length;d++){export_settings.groups[d]=c.rows.item(d)}speeddial.storage.getAllItems(function(e,f){for(var g=0;g<f.rows.length;g++){export_settings.dials[g]=f.rows.item(g)}for(var g=0;g<window.localStorage.length;g++){key=localStorage.key(g);if(speeddial.storage.filtersync(key)){value=localStorage.getItem(localStorage.key(g));export_settings.settings[key]=value}}$("#export textarea").val(JSON.stringify(export_settings,null,2));$("#export").show();$("#export #download").unbind().on("click",function(){window.open("data:Application/octet-stream,"+encodeURIComponent(JSON.stringify(export_settings,null,2)))})})})}function import_settings(){var a=$("#import_textarea").val();if(a){try{var d=jQuery.parseJSON(a)}catch(c){show_message("抱歉，这看起来不像是一个 JSON 文件，请使用 JSON 验证器修复。",true,5000);return false}show_message("导入中 ...",true,16000);b.import_settings(a,function(){setTimeout(function(){show_message("导入成功")},2000)})}}function moveSettings(a){$("#import,#export").hide();if(a=="import"){$("#import").show();$("#import_textarea").val("")}else{if(a=="export"){exportData()}}};