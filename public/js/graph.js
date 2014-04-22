var w = 600;
var h = 400
var bubble = d3.layout.pack()
	.sort(null)								 // arranged in the order given
	.size([w, h])
	.padding(1.2)
	.value(function(d) { return d.size; } ); // pack layout expects "value" but JSON stores this as "size", this returns size wherever value is called

var svg = d3.select('div#graph')
	.append('svg')
	.attr('width', w)
	.attr('height', h);

var viewModel = {
	words : ko.observable(""),
	messages : ko.observableArray([]),
	currentPoint : ko.observable({pop:[]}),
	percentage : ko.observable(0)
}

viewModel.compWords = ko.computed(function(){
	var arr = this().split(",").map(function(str){
		return str.replace(/\s+/g, '').toLowerCase()
			})
	return arr;	
},viewModel.words);

viewModel.compDict = ko.computed(function(){
	var arr = this();
	var dict = {};
	arr.forEach(function(data){
		dict[data] = [];
	})

	viewModel.messages().forEach(function(x){
		var phrase = "";
		if(x.message != null){
			phrase = x.message;
		}else if(x.story != null){
			if(x.story.indexOf("are now friends") < 0){
				phrase = x.story;
			}else{
				return;
			}
		}
		phrases = phrase.split(" ").map(function(s){
				return s.replace(/\s+/g, '').replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase()
		});

		var words = [];
		phrases.forEach(function(w){
			if(w != ""){
				words.push(w);
			}
		})
		phrases = words;

		for(var i in dict){
			if(phrases.indexOf(i) >= 0){
				var pop = 0;
				if(x.comments != null){
					pop+= x.comments.data.length
				}
				if(x.likes != null){
					pop += x.likes.data.length
				}
				var obj = {text : phrase, pop : pop};
				if(x.likes != null) {obj.likes = x.likes.data.length}else obj.likes=0;
				if(x.comments != null){obj.comments = x.comments.data.length}else obj.comments = 0;
				dict[i].push(obj)
			}
		}
	});

	return dict;
},viewModel.compWords);

viewModel.compFreq = ko.computed(function(){
	var dict = this();
	var freq = [];
	for(var i in dict){
		var obj = {
			name : i, 
			pop : dict[i].map(function(e){return e.text}),
			size: dict[i].reduce(function(prev,curr)
				{ return prev + curr.pop},0),
			likes : dict[i].reduce(function(prev,curr)
				{ return prev + curr.likes},0),
			comments : dict[i].reduce(function(prev,curr)
				{ return prev + curr.comments},0)
			};
		freq.push(obj);
	}
	var data = {name : "WORDS", children : freq};
	if(freq[0] != "")
		update(data);
	return freq;
},viewModel.compDict);

$.getJSON("/facebook/feed", function(data){
	var msg = [];
	data.forEach(function(s){
		msg.push(s);
	});
	console.log(msg);
	viewModel.messages(msg);
	ko.applyBindings(viewModel, document.getElementById("page"));
})


function update(data) {
	console.log(data);
	var range = data.children.reduce(function(prev,curr){
		prev.push(curr.pop.length);
		return prev;
	},[]);

	var colors = colorbrewer.YlGnBu[9];

	// returns all the leaf nodes, throw out ones that have chidren (in this case BEVs)
	var data = bubble.nodes(data).filter(function(d) { return !d.children; });				

	// var node will be some sort of confusing d3 object, it binds the data with elements of class 'node'
	var node = svg.selectAll('.node')
		.data(data, function(d) { return d.name; }) // data.children b/c we're not running var bubble thing

    // for every new element, we want to make a new svg circle element, have to give it class 'node' for when we want to update later

	// ENTER
	var enter = node.enter().append('g')
		.attr('class', 'node')
		.attr('transform', function(d) {return 'translate(' + d.x + ',' + d.y + ')'; });

	enter.append('circle')
		.attr('r', 0)										// start elements with radius of 0 to watch them grow using transition
		.style('fill', function(d) { 
			return colors[d.pop.length]; })
		.style("cursor", "pointer")
		.on("click", function(d){
			viewModel.currentPoint(d);
			switchVals([d.likes+1,d.comments+1]);
			viewModel.percentage(100*(d.likes/(d.comments + d.likes)));
			$("#graph").slideToggle()
			$("#piechart").slideToggle()
		})
		

	enter.append('text')
		.style('opacity', 0)
		.style('fill', 'black')
		.style('text-anchor', 'middle')
		.text(function(d) { return d.name + "("+d.size + ")("+d.pop.length+")"; });


	// UPDATE
	var update = node.transition()
		.attr('transform', function(d) {return 'translate(' + d.x + ',' + d.y + ')'; });

	update.select('circle')
			.attr('r' , function(d) { return d.r; });	 		// updates size of radius when values change
	update.select('text')
			.style('opacity', 1);

	// EXIT
	var exit = node.exit()
		.transition()
			.remove();
	exit.select('circle').attr('r', 0);
	exit.select('text').style('opacity', 0);

}

