/**
 * 模糊搜索页列表
 */
;
(function($, exports, Q) {

	'use strict';

	var de = decodeURI;

	var api = {
		"ACU_SEARCH": "/site/fuzzy_select.html?",
		"TRIP_SEARCH": "http://flight.qunar.com/twell/flight/Search.jsp?"
	};

	var MAP = {
		SPECIAL_CITY: {
			"中国香港": "香港",
			"中国澳门": "澳门"
		},

		SEARCH_TYPE: {
			oneway: "OnewayFlight",
			roundtrip: "RoundTripFlight"
		},

		FROM_TO: {
			from: "inter_sugdep_search",
			to: "inter_sugarr_search"
		}
	};

	/**
	 * [FuzzyList description]:flight information list
	 * @param {object} data [description]:data depends on user search information
	 */
	function FuzzyList(data) {

		this.data = data || {};

		/**
		 * public : init()
		 */

	}

	$.extend(FuzzyList.prototype, {

		// is dim or not,set default value false
		_isDimFag: false,

		// logic access
		init: function() {

			this._render();
			this._bindEvent();

		},

		// render flight list
		_render: function() {

			$("#fu_de_lst_id").html(Q.FuzzyList.render(this.data));

		},

		// parse URL to object
		_parseURL: function() {

			return $jex.parseQueryParam();

		},

		// judge time is dim or not
		_isDimTime: function(date) {

			return QunarDate.getFuzzyDate(date) ? true : false;

		},

		// set href when choose a flight way
		_bindEvent: function() {

			var self = this;

			// especial places map
			function _map(param) {

				var param = de(param);

				return MAP.SPECIAL_CITY[param] || param;

			}

			// set url
			$("#fu_de_lst_id").delegate('.fu_column_link', 'click', function(event) {

				var $this = $(this),
					obj = self._parseURL(),
					ajaxData = self.data;

				self._isDimFag = self._isDimTime(obj.fromDate);

				obj.from = de($("#locale_id").text());
				obj.to = de($this.find(".c0:first").text());

				// go other page
				if (ajaxData.fromType === "city" && (ajaxData.toType === "city" || obj.to === "中国香港" || obj.to === "中国澳门")) {

					// go to choose accurate time
					if (self._isDimFag) {
						$this.attr("href", api.ACU_SEARCH + de($.param(obj)));
					} else {

						// go to search page
						var urlParse = self._parseURL(),
							from, to;

						// when select from
						if (ajaxData.locType === "from") {

							from = _map(obj.to);
							to = _map(urlParse.to);

						} else {

							// when select to
							from = _map(urlParse.from);
							to = _map(obj.to);

						}

						// construct sendObj
						var sendObj = {
							fromCity: from || "中国",
							toCity: to,
							fromDate: obj.fromDate,
							toDate: obj.toDate,
							searchType: MAP.SEARCH_TYPE[obj.type],
							from: MAP.FROM_TO[ajaxData.locType]
						};

						$this.attr("href", api.TRIP_SEARCH + $.param(sendObj));

					}
				} else {
					// choose city
					$this.attr("href", location.pathname + "?" + de($.param(obj)));
				}
			});
		}
	});

	exports.FuzzyList = FuzzyList;

})(jQuery, window, QTMPL);