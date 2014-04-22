
!function($, T) {

	'use strict';

	var cls = {
		SELECTED: 'selected',
		NEXT_DISABLED: 'n_disabled',
		PREV_DISABLED: 'p_disabled',
		WEEDEND: 'weekend',
		NO_PRICE: 'noprices',
		DISABLED: 'disabled'
	};

	var selector = {

		CONTAINER: '#container',
		MONTH_LABEL: '.js-month-label',
		BTN_MONTH_LABEL: '[data-month-label]',
		BTN_PREV: '.month_selector_prev',
		BTN_NEXT: '.month_selector_next',
		BOOKING: '.js-booking',
		MONTH_SELECTOR_HOLDER: '.month_selector',
		MONTH_SELECTOR: '.month_selector_months',
		MONTH_SELECTOR_ITEM: '.month_selector_months li',
		CHART_BAR: 'li.chart_bar:not(.disabled)',
		PRICE_TIPS: '.fuz_chart_tip',
		MONTH_DATA_HOLDER: '.month_data_chart',
		SELECTED: 'li.selected'

	};

	var WEEK = {
		"0": "日",
		"1": "一",
		"2": "二",
		"3": "三",
		"4": "四",
		"5": "五",
		"6": "六"
	};


	var CUR_MONTH = new Date(
		SERVER_TIME.getFullYear(),
		SERVER_TIME.getMonth()
	);

	var TODAY = new Date(
		SERVER_TIME.getFullYear(),
		SERVER_TIME.getMonth(),
		SERVER_TIME.getDate()
	);


	var api = {
		MONTH_DATA: 'http://l-lp3.f.dev.cn6.qunar.com:8000/fuzzy_search?callback=?',
		PKG_PRICE: 'http://l-lp3.f.dev.cn6.qunar.com:8000/api/route_lowprice?callback=?'
	};

	var param = $.query();

	var roundtrip = param.type == 'roundtrip';

	var depDate = QunarDate.getFuzzyDate(param.fromDate);

	var q = {
		from: param.from,
		to: param.to,
		fromDate: depDate.start,
		toDate: depDate.end,
		flightType: roundtrip ? 2 : 1
	};

	if (roundtrip) {

		var retDate = QunarDate.getFuzzyDate(param.toDate);
		$.extend(q, {
			retFromDate: retDate.start,
			retToDate: retDate.end
		})

	}


	/**
	 * 月份选择
	 * @param {object} opts
	 * @constructor
	 */
	function MonthSelector(opts) {

		$.extend(this, opts);

	}

	MonthSelector.prototype.set = function(data) {

		var date = new Date(CUR_MONTH.getFullYear(), CUR_MONTH.getMonth());

		var date_month = new Date(data.cur_month);

		var months = data.months;

		data.months = $.map(new Array(12), function() {

			var pr = months[toMonthStr(date)];

			var year = date.getFullYear(),
				month = date.getMonth();

			var _data = {
				pr: pr ? '&yen;' + pr : null,
				label: toMonthZh(date),
				month: year + '/' + (month + 1) + '/1'
			};

			date.setMonth(month + 1);

			return _data;

		});

		date.setMonth(date.getMonth() - 1);

		data.cur_month = toMonthZh(data.cur_month);

		data.show_prev = !monthEqual(date_month, CUR_MONTH);

		data.show_next = !monthEqual(date_month, date);

		this.maxMonth = date;

		this.data = data;

		return this;

	};


	MonthSelector.prototype.render = function() {

		return this.T.render(this.data)

	};


	function MonthData(opts) {

		$.extend(this, opts);

		this.data = {};

	}

	MonthData.prototype.set = function(data) {

		data.middle = Math.round((data.max+data.min)/2);

		$.extend(this.data, data);


		if (data.list) {

			this.data.list = this.parse(data.max, data.list);

		}

		return this;

	};

	MonthData.prototype.get = function(index) {

		return this.data.list[index];

	};

	MonthData.prototype.parse = function(max, list) {

		var selected = this.mgr.selected,
			type = this.mgr.type;

		var ref_sel = this.mgr.ref ? this.mgr.ref.selected : null;

		var ref_date = null;

		if (ref_sel) {
			ref_date = toDate(ref_sel.date);
		}

		var zIndex = 31;

		return $.map(list, function(item, i) {

			var d = toDate(item.date),
				wd = d.getDay(),
				h = Math.round(item.pr / max * 100 * 0.7);

			var isSel = selected ? selected.date == item.date : false,
				disabled = d < TODAY;

			if (ref_date) {
				disabled = disabled || (type == 'out' ? d > ref_date : d < ref_date);
			}

			var _cls = [];

			if (wd == 0 || wd == 6) _cls.push(cls.WEEDEND);
			if (!item.pr) _cls.push(cls.NO_PRICE);

			return  {
				pr: item.pr,
				week: WEEK[wd],
				day: d.getDate(),
				date: item.date,
				cls: _cls.join(' '),
				zIndex: zIndex--,
				height: h,
				tip_height: 100 - h - 20,
				data_index: i,
				disabled: disabled,
				selected: isSel
			}

		});

	};


	MonthData.prototype.render = function() {

		return this.T.render(this.data);

	};

	MonthData.prototype.update = function(date, type) {

		var selected = this.mgr.selected;

		$.each(this.data.list, function(i, item) {

			var d = toDate(item.date);

			if (date) {
				item.disabled = type == 'ret' ?
					d < date : d > date;
			} else {
				item.disabled = d < TODAY;

			}

			item.selected = selected ? selected.date == item.date : false;

		});

	};


	function PriceTable(opts) {

		$.extend(this, opts);

		this.month_selector = new MonthSelector({
			T: T.MonthSelector
		});

		this.month_data = new MonthData({
			T: T.MonthData,
			mgr: this
		});

	}


	PriceTable.prototype.parse = function() {

		return {
			label: this.label,
			month_selector: this.month_selector.render(),
			month_data: this.month_data.render(),
			index: this.index
		};

	};

	PriceTable.prototype.render = function() {

		this.el = $(this.T.render(this.parse()));

		this.bind();

		this.holder.append(this.el);

	};

	PriceTable.prototype.set = function(data) {

		this.month = new Date(data.month.replace(/-/g, '/') + '/1');

		this.month_selector.set({
			cur_month: data.month + '-01',
			months: data.monthPr
		});

		this.month_data.set(data);

		return this;

	};

	PriceTable.prototype.setMonth = function() {

		this.el
			.find(selector.MONTH_LABEL)
			.text(toMonthZh(this.month));

		this.el
			.find(selector.BTN_PREV)
			.toggleClass(cls.PREV_DISABLED, monthEqual(this.month, CUR_MONTH));

		this.el
			.find(selector.BTN_NEXT)
			.toggleClass(cls.NEXT_DISABLED, monthEqual(this.month, this.month_selector.maxMonth));

		if (roundtrip) {
			if ((this.type == 'out' && this.month > this.ref.month) ||
				(this.type == 'ret' && this.month < this.ref.month)) {
				this.ref.month = new Date(this.month.getFullYear(), this.month.getMonth());
				this.ref.setMonth();
			}
		}

		this.select(null);

		this.loadMonthData();

	};

	PriceTable.prototype.select = function(index) {

		var type = this.type;

		if (index !== null) {

			var item = this.month_data.get(index);

			var $cur = this.el.find(selector.SELECTED),
				$sel = this.el.find('[data-date=' + item.date + ']'),
				flag = $cur && $cur.data('date') != item.date;

			if (flag) {
				$cur
					.removeClass(cls.SELECTED)
					.find(selector.PRICE_TIPS)
					.hide();
			}

			$sel
				.toggleClass(cls.SELECTED, flag)
				.find(selector.PRICE_TIPS)
				.toggle(flag);

			if ($cur && $cur.data('date') == item.date) {
				this.select(null);
				return;
			}

			this.selected = item;

			$('#' + type + '_date').text(item.date);

			if (roundtrip) {

				this.ref.update(toDate(item.date));

				var ref_sel = this.ref.selected;

				if (ref_sel) {


					var data = {
						fromDate: type == 'ret' ?  ref_sel.date : item.date,
						toDate: type == 'ret' ? item.date : ref_sel.date,
						from: encodeURIComponent(param.from),
						to: encodeURIComponent(param.to)
					};

					this.loadPkgPrice(data, function(r) {

						var pr = item.pr && ref_sel.pr ? item.pr + ref_sel.pr : null;

						if (pr && r.pkg) {

							if (pr < r.pkg) {
								r.pkg = null;
							}

						}

						$(selector.BOOKING)
							.html(T.PriceDetail.render($.extend({
								pr: pr,
								type: 'RoundTripFlight'
							}, data, r)))
							.show();

					});

				}

			} else {
				$(selector.BOOKING).html(T.PriceDetail.render({
					pr: item.pr,
					fromDate: item.date,
					from: encodeURIComponent(param.from),
					to: encodeURIComponent(param.to),
					type: 'OnewayFlight'
				})).show();
			}

		} else {

			roundtrip && this.ref.update();

			this.selected = null;

			$(selector.BOOKING).hide();

			$('#' + type + '_date').empty();

		}

	};



	PriceTable.prototype.update = function(date) {

		this.month_data.update(date, this.type);

		this.updateMonthData();


	};


	// 绑定事件
	PriceTable.prototype.bind = function() {

		var cur = null;

		var self = this;

		var $body = $(document.body);

		this.el.on('click', selector.BTN_MONTH_LABEL, function(evt) {

			var ul = $(this).find(selector.MONTH_SELECTOR);

			ul.show();

			$body.on('click.month_selector', function() {

				ul.hide();

				$body.off('.month_selector');

			});

			evt.stopPropagation();

		}).on('mousedown', selector.MONTH_SELECTOR_ITEM, function(evt) {

			self.month = new Date($(this).data('month'));

			self.setMonth();

			$(this).parent().hide();

			$body.off('.month_selector');

			evt.stopPropagation();
			evt.preventDefault();

		}).on('mouseover', selector.CHART_BAR, function() {

			$(this).find(selector.PRICE_TIPS).show();

		}).on('mouseout', selector.CHART_BAR, function() {

			var index = $(this).data('index');

			if (self.selected &&
				self.selected.date == self.month_data.get(index).date) return;

			$(this).find(selector.PRICE_TIPS).hide();

		}).on('click', selector.CHART_BAR, function() {

			self.select($(this).data('index'));


		}).on('click', selector.BTN_NEXT, function(evt) {

			evt.preventDefault();

			var m = self.month.getMonth();

			if (m == CUR_MONTH.getMonth() - 1) {

				return;

			}

			self.month.setMonth(m + 1);

			self.setMonth();

		}).on('click', selector.BTN_PREV, function(evt) {

			evt.preventDefault();

			var m = self.month.getMonth();

			if (monthEqual(self.month, CUR_MONTH)) {

				return;

			}

			self.month.setMonth(m - 1);

			self.setMonth();


		})

	};

	PriceTable.prototype.updateMonthData = function(data) {

		if (data) this.month_data.set(data);

		this.el.find(selector.MONTH_DATA_HOLDER).html(this.month_data.render());

	};

	PriceTable.prototype.updateMonthSelector = function(data) {

		if (data) this.month_selector.set(data);

		this.el.find(selector.MONTH_SELECTOR_HOLDER).html(this.month_selector.render());

	};

	PriceTable.prototype.loadMonthData = function() {

		var self = this;

		//var chart_container = this.el.find(selector.MONTH_DATA_HOLDER);
		//chart_container.html('<img class="ico_loading" src="http://source.qunar.com/site/images/new_main/m_loading.gif" />');

		var s = {};
		s[this.type + 'Month'] = toMonthStr(this.month);

		$.ajax({
			url: api.MONTH_DATA,
			data: $.extend({}, q, s),
			dataType: 'jsonp',
			cache: false,
			success: function(res) {

				var data = res.data[self.type];

				self.updateMonthSelector({
					cur_month: data.month + '-01',
					months: data.monthPr
				});

				self.updateMonthData(data);

			}
		});

	};

	PriceTable.prototype.loadPkgPrice = function(param, func) {

		var p = {
			fromCity: param.from,
			toCity: param.to,
			depDate: param.fromDate,
			retDate: param.toDate
		};

		$.ajax({
			url: api.PKG_PRICE,
			data: p,
			dataType: 'jsonp',
			cache: false,
			success: function(res) {

				func({
					pkg: $.isEmptyObject(res.data) ? null: res.data
				})

			}
		});

	};

	var $holder = $(selector.CONTAINER);

	var out = new PriceTable({
		type: 'out',
		T: T.PriceTable,
		label: '去程时间',
		holder: $holder,
		index: 99
	});

	if (roundtrip) {

		var ret = new PriceTable({
			type: 'ret',
			T: T.PriceTable,
			label: '回程时间',
			holder: $holder,
			index: 98
		});

		out.ref = ret;

		ret.ref = out;
	}


	// init
	$.ajax({
		url: api.MONTH_DATA,
		data: q,
		dataType: 'jsonp',
		cache: false,
		success: function(res) {

			var data = res.data;

			out.set(data.out).render();

			roundtrip && ret.set(data.ret).render();
			
		}
	});

	new FuzzyRoute({
		titId: '#header_route'
	}).init();

	$('#ret_date').parent().toggle(roundtrip);

	$('#footer_route').html(function() {

		var r = [];
		r.push('<span class="locale">', param.from, '</span>');
		r.push('<em>到</em>');
		r.push('<span class="locale">', param.to, '</span>');
		r.push('<span class="fzline">｜</span>');
		r.push('<span class="turn">', roundtrip ?  '往返' : '单程', '</span>');

		return r.join('');

	});


	AD_Manage.load();



	function toMonthZh(date) {

		if (typeof date == 'string') {
			date = toDate(date);
		}

		return date.getFullYear() + '年' + (date.getMonth() + 1) + '月';
	}

	function toMonthStr(date) {

		return date.getFullYear() + '-' +
			 (date.getMonth() + 1).toString().replace(/^(\d)$/, '0$1');

	}

	function toDate(str) {

		if (str.indexOf('-') > 0) {
			return new Date(str.replace(/-/g, '/'));
		}

	}

	function monthEqual(d1, d2) {

		return d1.getFullYear() == d2.getFullYear() &&
			d1.getMonth() == d2.getMonth();

	}


}(jQuery, QTMPL);