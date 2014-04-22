/**
 * 模糊搜索行程信息
 */
;
(function($, exports, Q) {

	'use strict';

	var de = decodeURI;

	// oneway or roundway map
	var MAP = {
		// className map
		TRIP_CLASS: {
			oneway: "one_way",
			roundtrip: "ret_way"
		},
		// tripType map
		TRIP_TYPE: {
			oneway: "单程",
			roundtrip: "往返"
		},
		// tripLink map
		TRIP_LINK: {
			oneway: "",
			roundtrip: " - "
		}
	};

	/**
	 * [FuzzyRoute description]: trip information about time places oneway or roundway
	 * @param {obj} ops [description]:related ID
	 */
	function FuzzyRoute(ops) {
		this.searchId = '#research_id';
		this.closeId = "#fuz_close_id";
		this.searchBoxId = "#fuz_search_id";
		this.titId = "#title_id";
		$.extend(this, ops);
		/**
		 * public : init()
		 */

	}

	$.extend(FuzzyRoute.prototype, {

		// logic access
		init: function() {
			this._render();
			this._bindEvent();
		},

		// parse URL to object
		_parseURL: function() {

			return $jex.parseQueryParam();

		},

		// render roundtrip
		_render: function() {

			var obj = this._setContent();

			$(this.titId).html(Q.FuzzyRoute.render(obj));

		},

		// set way information
		_setContent: function() {

			var obj = this._parseURL();

			obj.to = Boolean(obj.to) ? obj.to : "任意国家";

			obj.flightTypeClass = MAP.TRIP_CLASS[obj.type];
			obj.flightType = MAP.TRIP_TYPE[obj.type];
			obj.flag = MAP.TRIP_LINK[obj.type];

			obj.fromDate = this._changeDate(obj.fromDate, true);
			obj.toDate = this._changeDate(obj.toDate, true);

			return obj;

		},

		// change time when search time is dim 
		_changeDate: function(date, boolean) {

			date = de(date);

			return QunarDate.getFuzzyDate(date) ?
				date : date.replace(/(\d{2,4})-(\d{1,2})-(\d{1,2})/, "$1年$2月$3日");
		},

		// bind event on research button
		_bindEvent: function() {

			var self = this;

			// close search  && do research
			$(self.closeId).bind('click', function(event) {

				event.preventDefault();

				$(this).closest('.fuz_search').hide();

			});

			$(self.searchId).bind('click', function(event) {

				event.preventDefault();

				$(self.searchBoxId).show();

				new internationalFlightSearch($jex.$('ifsForm'));

				window.scrollTo(0, 0);

			});
		}

	});

	// export module
	exports.FuzzyRoute = FuzzyRoute;

})(jQuery, window, QTMPL);