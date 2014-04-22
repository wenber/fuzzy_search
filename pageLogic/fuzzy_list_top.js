/**
 * 模糊搜索页列表顶部
 */
;
(function($, exports, Q) {

	'use strict';

	var api = {
		"LIST_URL_JSONP": "http://l-lp3.f.dev.cn6.qunar.com:8000/fuzzy_search?callback=?"
	};

	var arrClass = ["btn_price_down", "btn_price_up"],
		arrCallback = ["_priceDown", "_priceUp"];

	/**
	 * [FuzzyListTop description]:list table top  information
	 */
	function FuzzyListTop() {

		this.pageWrap = $("#q_fuz_pagewrap_id");
		this.holderId = "#l_lside_detail_id";
		/**
		 * public:init()
		 */
	}

	$.extend(FuzzyListTop.prototype, {

		// is dim or not,set default value false
		_isDimFag: true,

		// data cache
		cache: {

			defaultData: null,
			priceUpData: null,
			priceDownData: null,

			clearCache: function() {

				this.defaultData = null;
				this.priceUpData = null;
				this.priceDownData = null;

			}
		},

		// logic access
		init: function() {

			this._getShowData();

		},

		// do _callback when ajax success
		_callback: function(data) {

			this.cache.clearCache();

			this.cache.defaultData = data;

			this._renderSortTitle();
			this.sort._priceUp();
			this._bindEvent();

		},

		// parse URL to object
		_parseURL: function() {

			return $jex.parseQueryParam();

		},

		// get data list depends on URL
		_getShowData: function() {
			//parse URL
			var self = this,
				postData = {},
				URLData = this._parseURL();

			//ensure place
			postData.from = URLData.from === "台湾" ? "中国台湾" : URLData.from;
			postData.to = URLData.to === "台湾" ? "中国台湾" : (URLData.to === "" ? "任意国家" : URLData.to);

			//ensure flightType
			postData.flightType = URLData.type === "oneway" ? 1 : 2;

			//ensure fromDate
			if (this._isDimTime(URLData.fromDate)) {

				var cache = this._changeDate(URLData.fromDate);

				postData.fromDate = cache.start;
				postData.toDate = cache.end;

			} else {

				this._isDimFag = false;

				postData.fromDate = URLData.fromDate;
				postData.toDate = URLData.fromDate;

			}

			//ensure toDate
			if (this._isDimTime(URLData.toDate)) {

				var cache = this._changeDate(URLData.toDate);

				postData.retFromDate = cache.start;
				postData.retToDate = cache.end;

			} else {

				postData.retFromDate = URLData.toDate;
				postData.retToDate = URLData.toDate;

			}

			//get information
			$.when($.ajax({
				url: api.LIST_URL_JSONP,
				type: "get",
				dataType: "json",
				data: postData
			})).then(function(data) {

				self._callback(data);

			}, function(e) {

				throw new Error(e);

			});
		},

		// set list top after ajax query
		_renderSortTitle: function() {
			// get cache
			var data = this.cache.defaultData,
				obj = {};

			// change text
			this.pageWrap.find("#locale_id").text(data.from);

			// to select destination
			if (data.locType === "to") {
				obj.fromTo = "选择目的地";

				if (data.fromType === "country" && data.toType === "country") {

					obj.cityCountry = '国家/地区';

				} else {

					obj.cityCountry = '城市';

				}

			} else { // from  select start place

				obj.fromTo = "选择出发地";
				obj.cityCountry = '城市';

			}

			var html = Q.FuzzyListTop.render(obj);

			$(this.holderId).html(html);
		},

		// price up && price down
		sort: {
			_priceUp: function() {

				var self = FuzzyListTop.prototype,
					data = self.cache.defaultData;

				function _sort(a, b) {
					return Number(a.pr) > Number(b.pr) ? 1 : -1;
				}

				// render priceUp
				if (self.cache.priceUpData === null) {

					data.data.length && data.data.sort(_sort);

					self.cache.priceUpData = $.extend(true, {}, data);

					var fuzzyList = new FuzzyList(self.cache.priceUpData);

					fuzzyList.init();
					fuzzyList = null;

				} else {

					var fuzzyList = new FuzzyList(self.cache.priceUpData);

					fuzzyList.init();
					fuzzyList = null;

				}
			},

			_priceDown: function() {
				var self = FuzzyListTop.prototype,
					data = self.cache.defaultData;

				// render priceDown
				if (self.cache.priceDownData === null) {

					data.data.reverse();

					self.cache.priceDownData = $.extend(true, {}, data);

					var fuzzyList = new FuzzyList(self.cache.priceDownData);

					fuzzyList.init();
					fuzzyList = null;

				} else {

					var fuzzyList = new FuzzyList(self.cache.priceDownData);

					fuzzyList.init();
					fuzzyList = null;

				}
			}
		},

		// change time when search time is dim 
		_changeDate: function(date) {

			return QunarDate.getFuzzyDate(date) || date;

		},

		// judge time is dim or not
		_isDimTime: function(date) {

			return QunarDate.getFuzzyDate(date) ? true : false;

		},

		// bind event on the sort button
		_bindEvent: function() {
			var self = this;

			// sort operation
			$("#price_sort").click(function(event) {

				event.preventDefault();

				var $this = $(this),
					curr = _changeUI(),
					callback = arrCallback[curr];

				self.sort[callback]();

				function _changeUI() {

					var state = $this.data("state");

					state = state == 1 ? 0 : 1;

					$this.data("state", state);

					$this.removeClass().addClass(arrClass[state]);

					return state;

				}



			});

		}
	});

	exports.FuzzyListTop = FuzzyListTop;

})(jQuery, window, QTMPL);