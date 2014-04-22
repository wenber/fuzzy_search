/**
 * 排序页面
 */
;
(function() {

	"use strict";

	// render route
	var fuzzyRoute = new FuzzyRoute();
	fuzzyRoute.init();

	// render list
	var fuzzyListTop = new FuzzyListTop();
	fuzzyListTop.init();

	// addvertise
	AD_Manage.load();
})();