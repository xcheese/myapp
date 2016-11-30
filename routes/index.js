var express = require('express');
var router = express.Router();
var utility = require('utility');
var superagent = require('superagent');
var cheerio = require('cheerio');
var urllib = require('urllib');
var EventProxy = require('eventproxy');
/* GET home page. */
var now = new Date().getTime();
router.get('/', function(req, res, next) {
	// var arr = []
	// urllib.request('http://odds.caipiao.163.com/matchanalysis/oupei.html?cache=1478968160927', {
	//   method: 'POST',
	//   headers: {
	//     'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
	//   },
	//   dataType:'json',
	//   data: {
	//    timeType:0,
	// 	lType:0,
	// 	lName:'全部',
	// 	cType:0,
	// 	cName:'全部',
	// 	matchId:2116280,
	// 	oddsQueryType:'oupei',
	//   }
	// },
	//   function (err, data, res2){
	//   	// console.log(err)
	//   	// console.log(data)
	//   	// console.log(res)
	//   	var oddsList = data.data.oddsList;
	//   	oddsList.forEach(function(v,k){
	//   		if(k == 1 || k == 2){
	//   			var data = {
	//   				cName:v.cName,
	//   				iW:v.iW,
	//   				iL:v.iL,
	//   				result: v.iW < v.iL ? '胜' : '负',
	//   				result_need: v.iW < v.iL ? v.iW : v.iL
	//   			}
	// 			arr.push(data);
	//   		}
	//   	})
	//   	res.send(arr);

	//   });
superagent.get('http://caipiao.163.com/order/jczq/').end(function(err, sres){
		 if (err) {
	        return next(err);
	      }
	      var $ = cheerio.load(sres.text);
	      var items = [];
	      $('#docBody .dataBody.unAttention dl').eq(0).find('dd').each(function (idx, element) {
	      	  var $element = $(element);
	      	    var endtime = $element.attr('endtime');
  	  	        if(now < endtime){
		        	var data = {
		        		matchnumcn: $element.attr('matchnumcn'),
		        		leaguename:$element.attr('leaguename'),
			          	hostname: $element.attr('hostname'),
			          	guestname: $element.attr('guestname'),
			          	mid: $element.attr('matchid'),
			          	// mId:$element.attr('matchid'),
			        	// mId:$element.attr('matchid'),
			          	content:{}
			          	// href:"http://zx.caipiao.163.com/library/football/match.html?mId=1256066&hId=965&vId=2266"
		        	}
		        	var mId =  $element.attr('matchid')
		        	var hId =  $element.attr('hostteamid')
		        	var vId =  $element.attr('visitteamid')
		        	var href= "http://zx.caipiao.163.com/library/football/match.html?mId="+mId+"&hId="+hId+"&vId="+vId+""
		        	data.href = href;
		        	items.push(data);
		        }
	      })

		  var ep1 = new EventProxy();
		  	ep1.after('get_mid', items.length, function (list) {
			  // 在所有文件的异步执行结束后将被执行
			  // 所有文件的内容都存在list数组中
			  list.forEach(function(v,k){
			  		items[k].real_mid = v;
			  })

			  get_data_by_real_mid();
			  // res.send(items);
			});	
	      items.forEach(function(v,k){
	      	// console.log(v.href)
				urllib.request(v.href, function (err, data, res) {
				  if (err) {
				    throw err; // you need to handle error
				  }
				  if(res.headers.location){
				  	var match = res.headers.location.match(/\/\d+\//g)
				  	var mid = match[match.length - 1].replace(/\//g,'');
				  }
				 ep1.emit('get_mid', mid);
				    // console.log(res.headers);
				  // data is Buffer instance
				});
		  })
			



	
		function get_data_by_real_mid(){
		      var ep = new EventProxy();
			ep.after('get_data', items.length, function (list) {
			  // 在所有文件的异步执行结束后将被执行
			  // 所有文件的内容都存在list数组中
			  list.forEach(function(v,k){
			  		items[k].content = v;
			  })
			  res.send(items);
			});

			for (var i = 0; i < items.length; i++) {
			  	urllib.request('http://odds.caipiao.163.com/matchanalysis/oupei.html?cache='+new Date().getTime(), {
				  method: 'POST',
				  headers: {
				    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
				  },
				  dataType:'json',
				  data: {
				   timeType:0,
					lType:0,
					lName:'全部',
					cType:0,
					cName:'全部',
					matchId:items[i].real_mid,
					oddsQueryType:'oupei',
				  }
				},
				  function (err, data, res2){
				  	var _arr = [];
				  	if(data.code != 200){
				  		_arr.push({
				  			code:data.code
				  		})
				  	}
				  	else if(data && data.data && data.data.oddsList && data.data.oddsList.length > 0){
				  		var oddsList = data.data.oddsList;
				  	// console.log(oddsList)
				  		
				  		oddsList.forEach(function(v,k){
					  		if(v.cId == 42 || v.cId == 229){
					  			var data = {
					  				cName:v.cName,
					  				// iW:v.iW,
					  				// iL:v.iL,
					  				result: v.iW < v.iL ? '胜' : '负',
					  				result_need: v.iW < v.iL ? v.iW : v.iL
					  			}
					  			
					  			_arr.push(data)
					  		}
			  			})
				  	}
			  			ep.emit('get_data', _arr);
				  	
				})
			}
		}	
	      
})

	
	// superagent.get('http://caipiao.163.com/order/jczq/')
	// .end(function(err, sres){

	// })
	// 	 if (err) {
	//         return next(err);
	//       }
	//       var $ = cheerio.load(sres.text);
	//       var items = [];
	//       $('#docBody .dataBody.unAttention dl').eq(0).find('dd').each(function (idx, element) {
	//         var $element = $(element);
	//         // console.log($element.attr('endtime'))
	//         var endtime = $element.attr('endtime');
	//         if(now < endtime){
	//         	var data = {
	//         		matchnumcn: $element.attr('matchnumcn'),
	// 	        	mId:$element.attr('matchid'),
	// 	          	hostname: $element.attr('hostname'),
	// 	          	hId: $element.attr('hostteamid'),
	// 	          	guestname: $element.attr('guestname'),
	// 	          	vId: $element.attr('visitteamid'),
	// 	          	content:{}
	// 	          	// href:"http://zx.caipiao.163.com/library/football/match.html?mId=1256066&hId=965&vId=2266"
	//         	}
	//         	data.href = 'http://zx.caipiao.163.com/library/football/match.html?mId='+data.mId+'&hId='+data.hId+'&vId='+data.vId+''
	// 			items.push(data);
	// 			return false;
	//         }
	//       });
	// 	        urllib.request(items[0].href, function (err, data, res) {
	// 			  if (err) {
	// 			    throw err; // you need to handle error
	// 			  }
	// 			  if(res.headers.location){
	// 			  	var n = res.headers.location.lastIndexOf('/');
	// 			  	var target_url = res.headers.location.substr(0,n+1) + 'oupei.html';

	// 			  	console.log(target_url)
	// 					superagent.get(target_url)
	// 					.end(function(err, sres){
	// 						 if (err) {
	// 					        return next(err);
	// 					      }
	// 				          var $ = cheerio.load(sres.text);

	// 				          $('.e-tbWrap tbody tr').each(function (idx, tr) {
	// 				          	 $(tr).eq(1).find('td').each(function(idy,td){
	// 				          	 	var $td = $(td)
	// 				          	 	console.log($td.eq(1).text())
	// 				          	 })
	// 				          })
	// 					})		
	// 			  }
	// 			});
	//       res.send(items);
	// })
  // res.render('index', { title: 'Express' });
});

module.exports = router;
