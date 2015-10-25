$.widget("ui.tabulator", {


data:[],//array to hold data for table
sortCurrrent:{col:null,dir:null}, //column name of currently sorted column
firstRender:true, //layout table widths correctly on first render

//setup options
options: {
	backgroundColor: "#777", //background color of tabulator
	borderColor:"#ccc", //border to tablulator

	textSize: "14px", //table text size

	headerBackgroundColor:"#e6e6e6", //border to tablulator
	headerTextColor:"#555", //header text colour
	headerBorderColor:"#aaa", //header border color
	headerSeperatorColor:"#999", //header bottom seperator color
	headerMargin:"4px",

	rowBackgroundColor:"#fff", //table row background color
	rowBorderColor:"#aaa", //table border color
	rowTextColor:"#333", //table text color
	rowHoverBackground:"#bbb", //row background color on hover

	colMinWidth:"20px", //minimum global width for a column

	height:false, //height of tabulator
	fitColumns:true, //fit colums to width of screen;

	columns:[],//stor for colum header info

	sortable:true, //global default for sorting
	dateFormat: "dd/mm/yyyy", //date format to be used for sorting
	sortArrows:{ //colors for sorting arrows
		active: "#000",
		inactive: "#bbb",
	},

	selectable:true, //highlight rows on hover

	ajaxURL:false, //url for ajax loading

	rowClick:function(){}, //do action on row click
	rowContext:function(){}, //context menu action
},

//constructor
_create: function() {
	var self = this;
	var options = self.options;
	var element = self.element;

	options.textSize = isNaN(options.textSize) ? options.textSize : options.textSize + "px";
	options.colMinWidth = isNaN(options.colMinWidth) ? options.colMinWidth : options.colMinWidth + "px";

	options.textSizeNum = parseInt(options.textSize.replace("px",""));
	headerMargin = parseInt(options.headerMargin.replace("px",""));
	options.headerHeight =  options.textSizeNum + (headerMargin*2) + 2;

	console.log("headerHeight",headerMargin )

	if(options.height){
		options.height = isNaN(options.height) ? options.height : options.height + "px";
		element.css({"height": options.height});
	}

	console.log("font-size:" +options.textSize)

	element.addClass("tabulator");
	element.css({
		position:"relative",
		"box-sizing" : "border-box",
		"background-color": options.backgroundColor,
		"border": "1px solid " + options.borderColor,
		"overflow-x":"auto",
	})

	self.header = $("<div class='tabulator-header'</div>")

	self.header.css({
		position:"relative",
		width:"100%",
		"background-color": options.headerBackgroundColor,
		"border-bottom":"1px solid " + options.headerSeperatorColor,
		"color": options.headerTextColor,
		"font-size":options.textSize,
		"font-weight":"bold",
		"white-space": "nowrap",
		"z-index":"1",
	});


	var tableHolder = $("<div class='tabulator-tableHolder'></div>");

	tableHolder.css({
		position:"absolute",
		"z-index":"1",
		"max-height":"calc(100% - " + (options.headerHeight + 1) + "px)",
		"white-space": "nowrap",
		"overflow-y":"auto",
		"width":"100%",
	});

	//create scrollable table holder
	self.table = $("<div class='tabulator-table'></div>");


	self.table.css({
		position:"relative",
		"font-size":options.textSize,
		"white-space": "nowrap",
		"z-index":"1",
		display:"inline-block",
	});

	//create sortable arrow chevrons
	var arrow = $("<div class='tabulator-arrow'></div>");
	arrow.css({
		display: "inline-block",
		position: "absolute",
		top:"9px",
		right:"8px",
		width: 0,
		height: 0,
		"border-left": "6px solid transparent",
		"border-right": "6px solid transparent",
		"border-bottom": "6px solid " + options.sortArrows.inactive,
	});


	$.each(options.columns, function(i, column) {

		column.sorter = typeof(column.sorter) == "undefined" ? "string" : column.sorter;
		column.sortable = typeof(column.sortable) == "undefined" ? options.sortable : column.sortable;

		var col = $('<span class="tabulator-col" style="display:inline-block" data-field="' + column.field + '" data-sortable=' + column.sortable + '>' + column.title + '</span>');

		if(typeof(column.width) != "undefined"){
			column.width = isNaN(column.width) ? column.width : column.width + "px"; //format number

			col.data("width", column.width);

			col.css({width:column.width});
		}

		//sort tabl click binding
		if(column.sortable){
			col.on("click", function(){
				self._sortClick(column, col);
			})
		}

		self.header.append(col);

	});

	if(options.fitColumns){
		self.header.css({width:"100%"});
		self.table.css({width:"100%"});
	}

	element.append(self.header);
	tableHolder.append(self.table);
	element.append(tableHolder);

	//layout headers
	$(".tabulator-col", self.header).css({
		"padding":"4px",
		"text-align":"left",
		"position":"relative",
		"border-right":"1px solid " + options.headerBorderColor,
		"box-sizing":"border-box",
		"user-select":"none",
		"white-space": "nowrap",
		"overflow": "hidden",
		"text-overflow": "ellipsis",
	});

	//append sortable arrows to sortable headers
	$(".tabulator-col[data-sortable=true]", self.header).css({"padding-right":"30px"})
	.data("sortdir", "desc")
	.on("mouseover", function(){$(this).css({cursor:"pointer", "background-color":"rgba(0,0,0,.1)"})})
	.on("mouseout", function(){$(this).css({"background-color":"transparent"})})
	.append(arrow.clone());

	//render or resize;

	element.resize(function(){
		console.log("resize");
	})
	//_firstRender

},

//set options
_setOption: function(option, value) {
	$.Widget.prototype._setOption.apply( this, arguments );
},

//load data
setData:function(data){

	if(typeof(data) === "string"){
		if (data.indexOf("http") == 0){
			//make ajax call to url to get data
			this._getAjaxData(this.options.ajaxURL);
		}else{
			//assume data is a json encoded string
			this._parseData(jQuery.parseJSON(data));
			this._renderTable();
		}
	}else{
		if(data){
			//asume data is already an object
			this._parseData(data);
		}else{
			//no data provided, check if ajaxURL is present;
			if(this.options.ajaxURL){
				this._getAjaxData(this.options.ajaxURL);
			}else{
				//empty data
				this._parseData([]);
			}
		}
		this._renderTable();
	}
},

//parse and index data
_parseData:function(data){

	var newData = [];

	$.each(data, function(i, item) {
		newData[item.id] = item;
	});

	this.data = newData;
},

//get json data via ajax
_getAjaxData:function(url){

	var self = this;

	$.ajax({
		url: url,
		type: "GET",
		async: true,
		dataType:'json',
		success: function (data) {
			this._parseData(data);
			self._renderTable();
		},
		error: function (xhr, ajaxOptions, thrownError) {
			console.log("Tablulator ERROR (ajax get): " + xhr.status + " - " + thrownError);
		},
	});
},

_renderTable:function(){
	var self = this;

	//hide table while building
	self.table.hide();

	//build rows of table
	self.data.forEach( function(item, i) {
		var row = $('<div class="tabulator-row" data-id="' + item.id + '"></div>');

		//bind row data to row
		row.data("data", item);

		//bind row click events
		row.on("click", function(e){self._rowClick(e, row, item)});
		row.on("contextmenu", function(e){self._rowContext(e, row, item)});

		$.each(self.options.columns, function(i, column) {
			//deal with values that arnt declared

			var value = typeof(item[column.field]) == 'undefined' ? "" : item[column.field];

			// set empty values to not break search
			if(typeof(item[column.field]) == 'undefined'){
				item[column.field] = "";
			}

			//set column text alignment
			var align = typeof(column.align) == 'undefined' ? "left" : column.align;

			var cell = $("<div class='tabulator-cell' data-field='" + column.field + "' data-value='" + self._safeString(value) + "' ></div>");

			cell.css({
				padding: "4px",
				"text-align": align,
				"box-sizing":"border-box",
				"display":"inline-block",
				"vertical-align":"middle",
				"min-height":self.options.headerHeight,
			})

			//format cell contents
			cell.html(self._formatCell(column.formatter, value, item, cell, row));

			//bind cell click function
			if(typeof(column.onClick) == "function"){
				cell.on("click", function(e){self._cellClick(e, cell)});
			}

			row.append(cell);
		});

		self.table.append(row);
	});

	self.table.css({//
		"background-color":self.options.rowBackgroundColor,
		"color":self.options.rowTextColor,
	});

	//style table rows
	self._styleRows();

	//sort data if already sorted
	if(self.sortCurrrent.col){
		self._sorter(self.sortCurrrent.col, self.sortCurrrent.dir);
	}


	//show table once loading complete
	self.table.show();

	if(self.firstRender){
		self._firstRender();
	}

},

//l;ayout coluns on first render
_firstRender:function(){
	var self = this;
	var options = self.options;
	var table = self.table;
	var header = self.header;
	var element = self.element;

	console.log("FIRST RENDER")
	self.firstRender = false;

	$.each(options.columns, function(i, column) {

		var max = 0;

		var col = $(".tabulator-cell[data-field=" + column.field + "], .tabulator-col[data-field=" + column.field + "]",element)

		col.each(function(){
			max = $(this).outerWidth() > max ? $(this).outerWidth() : max
		});

		col.css({width:max});

	});

	//set minimum width of cells
	/*if(options.colMinWidth){
		$(".tabulator-cell", self.table).css({"min-width": options.colMinWidth});
	}

	if(options.fitColumns){
		//full width resize
		//resize table to match header
		$.each(options.columns, function(i, column) {
			$("td[data-field=" + column.field + "]", table).css({"width": $(".tabulator-col[data-field=" + column.field + "]", header).outerWidth()});
		});
	}else{
		table.css({"table-layout":"fixed"});
		table.css({"table-layout":"header"});



		//part width resize
		//resize header to match table
		$.each(options.columns, function(i, column) {
			if(column.width){
				//if col width set match table to header
				$("td[data-field=" + column.field + "]", table).css({"width": column.width});

			}else{
				$(".tabulator-col[data-field=" + column.field + "]", header).css({"width": $("tr:first td[data-field=" + column.field + "]", table).outerWidth() + "px"});
			}
		});

		//if table col narrower than col heading title resize table columns
		$.each(options.columns, function(i, column) {
			if($("tr:first td[data-field=" + column.field + "]", table).outerWidth() < $(".tabulator-col[data-field=" + column.field + "]", header).outerWidth()){
				$("td[data-field=" + column.field + "]", table).css({"width": $(".tabulator-col[data-field=" + column.field + "]", header).outerWidth()});
			}
		});
	}*/


},

//style rows of the table
_styleRows:function(){

	var self = this;

	$(".tabulator-row", self.table).css({"background-color":"transparent"})

	//hover over rows
	if(self.options.selectable){
		$(".tabulator-row", self.table)
		.on("mouseover", function(){$(this).css({cursor:"pointer", "background-color":self.options.rowHoverBackground})})
		.on("mouseout", function(){$(this).css({"background-color":"transparent"})})
	}

	//color odd rows
	$(".tabulator-row:nth-of-type(even)", self.table).css({
		"background-color": "rgba(0,0,0,.1);" //shade even numbered rows
	})
	.on("mouseout", function(){$(this).css({"background-color": "rgba(0,0,0,.1);"})}); //make sure odd rows revert back to color after hover

	//add column borders to rows
	$(".tabulator-cell", self.table).css({
		"border-right":"1px solid " + self.options.rowBorderColor,
	});
},

//format cell contents
_formatCell:function(formatter, value, data, cell, row){
	var formatter = typeof(formatter) == 'undefined' ? "plaintext" : formatter;
	var formatter = typeof(formatter) == 'string' ? this.formatters[formatter] : formatter;

	return formatter(value, data, cell, row,  this.options);
},

//carry out action on row click
_rowClick: function(e, row, data){
	this.options.rowClick(e, row.data("id"), data, row);
},

//carry out action on row context
_rowContext: function(e, row, data){
	this.options.rowContext(e, row.data("id"), data, row);
},

//carry out action on cell click
_cellClick: function(e, cell){

	var column = this.options.columns.filter(function(column) {
		return column.field == cell.data("field");
	});

	column[0].onClick(e, cell.data("value"), cell, cell.closest("tr"));
},

//return escaped string for attribute
_safeString: function(value){
	return String(value).replace(/'/g, "&#39;");
},

_sortClick: function(column, element){
	var self = this;
	var header = self.header;
	var options = this.options;

	//reset all column sorts
	$(".tabulator-col[data-sortable=true][data-field!=" + column.field + "]", self.header).data("sortdir", "desc");
	$(".tabulator-col .tabulator-arrow", self.header).css({
		"border-top": "none",
		"border-bottom": "6px solid " + options.sortArrows.inactive,
	})

	if (element.data("sortdir") == "desc"){
		element.data("sortdir", "asc");
		$(".tabulator-arrow", element).css({
			"border-top": "none",
			"border-bottom": "6px solid " + options.sortArrows.active,
		});
	}else{
		element.data("sortdir", "desc");
		$(".tabulator-arrow", element).css({
			"border-top": "6px solid " + options.sortArrows.active,
			"border-bottom": "none",
		});
	}

	self._sorter(column, element.data("sortdir"));
},

_sorter: function(column, dir){

	var self = this;
	var table = self.table;
	var data = self.data;

	self.sortCurrrent.col = column;
	self.sortCurrrent.dir = dir;

	$(".tabulator-row", table).sort(function(a,b) {

		//switch elements depending on search direction
		el1 = dir == "asc" ? data[$(a).data("id")] : data[$(b).data("id")]
		el2 = dir == "asc" ? data[$(b).data("id")] : data[$(a).data("id")]

		//sorting functions
		switch(column.sorter){

			case "number": //sort numbers
			return parseFloat(el1[column.field]) - parseFloat(el2[column.field]);
			break;

			case "string": //sort strings
			return el1[column.field].toLowerCase().localeCompare(el2[column.field].toLowerCase());
			break;

			case "date": //sort dates
			return self._formatDate(el1[column.field]) - self._formatDate(el2[column.field]);
			break;

			case "boolean":
			el1 = el1[column.field] === true || el1[column.field] === 'true' || el1[column.field] === 'True' || el1[column.field] === 1 ? 1 : 0;
			el2 = el2[column.field] === true || el2[column.field] === 'true' || el2[column.field] === 'True' || el2[column.field] === 1 ? 1 : 0;

			return el1 - el2

			break

			default:
			//handle custom sorter functions
			if(typeof(column.sorter) == "function"){
				return column.sorter(el1, el2);
			}
		}
	}).appendTo(table);

	//style table rows
	self._styleRows();
},


//format date for date comparison
_formatDate:function(dateString){
	var format = this.options.dateFormat

	var ypos = format.indexOf("yyyy");
	var mpos = format.indexOf("mm");
	var dpos = format.indexOf("dd");

	var formattedString = dateString.substring(ypos, ypos+4) + "-" + dateString.substring(mpos, mpos+2) + "-" + dateString.substring(dpos, dpos+2);

	var newDate = Date.parse(formattedString)

	return isNaN(newDate) ? 0 : newDate;
},


//custom data formatters
formatters:{
	plaintext:function(value, data, cell, row, options){ //plain text value
		return value;
	},
	email:function(value, data, cell, row, options){
		return "<a href='mailto:" + value + "'>" + value + "</a>";
	},
	link:function(value, data, cell, row, options){
		return "<a href='" + value + "'>" + value + "</a>";
	},
	tick:function(value, data, cell, row, options){

		var tick = '<svg enable-background="new 0 0 24 24" height="' + options.textSize + '" width="' + options.textSize + '"  viewBox="0 0 24 24" xml:space="preserve" ><path fill="#2DC214" clip-rule="evenodd" d="M21.652,3.211c-0.293-0.295-0.77-0.295-1.061,0L9.41,14.34  c-0.293,0.297-0.771,0.297-1.062,0L3.449,9.351C3.304,9.203,3.114,9.13,2.923,9.129C2.73,9.128,2.534,9.201,2.387,9.351  l-2.165,1.946C0.078,11.445,0,11.63,0,11.823c0,0.194,0.078,0.397,0.223,0.544l4.94,5.184c0.292,0.296,0.771,0.776,1.062,1.07  l2.124,2.141c0.292,0.293,0.769,0.293,1.062,0l14.366-14.34c0.293-0.294,0.293-0.777,0-1.071L21.652,3.211z" fill-rule="evenodd"/></svg>';

		if(value === true || value === 'true' || value === 'True' || value === 1){
			return tick;
		}


	},
	tickCross:function(value, data, cell, row, options){
		var tick = '<svg enable-background="new 0 0 24 24" height="' + options.textSize + '" width="' + options.textSize + '"  viewBox="0 0 24 24" xml:space="preserve" ><path fill="#2DC214" clip-rule="evenodd" d="M21.652,3.211c-0.293-0.295-0.77-0.295-1.061,0L9.41,14.34  c-0.293,0.297-0.771,0.297-1.062,0L3.449,9.351C3.304,9.203,3.114,9.13,2.923,9.129C2.73,9.128,2.534,9.201,2.387,9.351  l-2.165,1.946C0.078,11.445,0,11.63,0,11.823c0,0.194,0.078,0.397,0.223,0.544l4.94,5.184c0.292,0.296,0.771,0.776,1.062,1.07  l2.124,2.141c0.292,0.293,0.769,0.293,1.062,0l14.366-14.34c0.293-0.294,0.293-0.777,0-1.071L21.652,3.211z" fill-rule="evenodd"/></svg>';
		var cross = '<svg enable-background="new 0 0 24 24" height="' + options.textSize + '" width="' + options.textSize + '"  viewBox="0 0 24 24" xml:space="preserve" ><path fill="#CE1515" d="M22.245,4.015c0.313,0.313,0.313,0.826,0,1.139l-6.276,6.27c-0.313,0.312-0.313,0.826,0,1.14l6.273,6.272  c0.313,0.313,0.313,0.826,0,1.14l-2.285,2.277c-0.314,0.312-0.828,0.312-1.142,0l-6.271-6.271c-0.313-0.313-0.828-0.313-1.141,0  l-6.276,6.267c-0.313,0.313-0.828,0.313-1.141,0l-2.282-2.28c-0.313-0.313-0.313-0.826,0-1.14l6.278-6.269  c0.313-0.312,0.313-0.826,0-1.14L1.709,5.147c-0.314-0.313-0.314-0.827,0-1.14l2.284-2.278C4.308,1.417,4.821,1.417,5.135,1.73  L11.405,8c0.314,0.314,0.828,0.314,1.141,0.001l6.276-6.267c0.312-0.312,0.826-0.312,1.141,0L22.245,4.015z"/></svg>';

		if(value === true || value === 'true' || value === 'True' || value === 1){
			return tick;
		}else{
			return cross;
		}
	},
	star:function(value, data, cell, row, options){
		var maxStars = 5;
		var stars=$("<span></span>");

		value = parseInt(value) < maxStars ? parseInt(value) : maxStars;

		var starActive = $('<svg width="' + options.textSize + '" height="' + options.textSize + '" viewBox="0 0 512 512" xml:space="preserve" style="margin:0 1px;"><polygon fill="#FFEA00" stroke="#C1AB60" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/></svg>');
		var starInactive = $('<svg width="' + options.textSize + '" height="' + options.textSize + '" viewBox="0 0 512 512" xml:space="preserve" style="margin:0 1px;"><polygon fill="#D2D2D2" stroke="#686868" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/></svg>');

		for(i=1;i<= maxStars;i++){

			var nextStar = i <= value ? starActive : starInactive;

			stars.append(nextStar.clone());
		}

		cell.css({
			"white-space": "nowrap",
			"overflow": "hidden",
			"text-overflow": "ellipsis",
		})

		return stars.html();
	},
	progress:function(value, data, cell, row, options){ //progress bar

		value = parseFloat(value) <= 100 ? parseFloat(value) : 100;

		cell.css({
			"min-width":"30px",
		});

		return "<div style='height:10px; background-color:#2DC214; width:" + value + "%;'></div>"
	},
},

//deconstructor
destroy: function() {

},


});