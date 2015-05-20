
$(document).ready(function(){
  var loadingImg = function (){
		 $("#loading-img").rotate({
				angle: 0,
				animateTo: -360,
				callback: loadingImg
		 });
	}
});
