/**
 * @module Components
 *
 */
import Ember from 'ember';
import moment from 'moment';
import Assert from 'busy-utils/assert';
import layout from '../../templates/components/interfaces/date-picker';

/**
 * `Component/DatePicker`
 *
 * @class DatePicker
 * @namespace Components
 * @extends Ember.Component
 */
export default Ember.Component.extend({

  /**
   * @private
   * @property classNames
   * @type String
   * @default date-picker
   */
  classNames: ['paper-date-picker'],
  layout: layout,

  /**
   * timestamp that is passed in when using date picker
   *
   * @private
   * @property timestamp
   * @type Number
   */
  timestamp: null,

  /**
   * timestamp that controls the dates for the calendar
   *
   * @private
   * @property calendarDate
   * @type Number
   */
  calendarDate: null,

  /**
   * can be passed in so a date before the minDate cannot be selected
   *
   * @private
   * @property minDate
   * @type Number
   * @optional
   */
  minDate: null,

  /**
   * can be passed in so a date after the maxDate cannot be selected
   *
   * @private
   * @property maxDate
   * @type Number
   * @optional
   */
  maxDate: null,

  /**
   * can be passed in as true or false, true sets timepicker to handle unix timestamp * 1000, false sets it to handle unix timestamp
   *
   * @private
   * @property isMilliseconds
   * @type boolean
   * @optional
   */
  isMilliseconds: false,

  /**
   * day of the month shown on the calendar header - based off timestamp
   *
   * @private
   * @property day
   * @type String
   */
  day: null,

  /**
   * month of year shown on the calendar header - based off timestamp
   *
   * @private
   * @property month
   * @type String
   */
  month: null,

  /**
   * year shown on the calendar header - based off timestamp
   *
   * @private
   * @property year
   * @type String
   */
  year: null,

  /**
   * month + year string - based off calendarTimestamp
   *
   * @private
   * @property monthYear
   * @type String
   */
  monthYear: null,

  /**
   * array of all days in the current month of calendarTimestamp
   *
   * @private
   * @property daysArray
   * @type Array
   */
  daysArray: null,

  /**
   * based on daysArray, Adds blank days to the front and back of array according to starting day of month
   *
   * @private
   * @property completeDaysArray
   * @type Array
   */
  completeDaysArray: null,

  /**
   * based on completeDaysArray, Adds current day and minDate - maxDate properties
   *
   * @private
   * @property completeArray
   * @type Array
   */
  completeArray: null,

  /**
   * based on completeArray, groups days into 6 week arrays
   *
   * @private
   * @property groupedArray
   * @type Array
   */
  groupedArray: null,

  /**
   * becomes string 'active' (binded to classes in template) if monthActive is active
   *
   * @private
   * @property monthActive
   * @type String
   */
  monthActive: null,

  /**
   * becomes string 'active' (binded to classes in template) if dayActive is active
   *
   * @private
   * @property monthActive
   * @type dayActive
   */
  dayActive: null,

  /**
   * becomes string 'active' (binded to classes in template) if yearActive is active
   *
   * @private
   * @property yearActive
   * @type String
   */
  yearActive: null,

  /**
   * becomes string 'active' (binded to classes in template) if monthYearActive is active
   *
   * @private
   * @property monthYearActive
   * @type String
   */
  monthYearActive: null,


  /**
   * @private
   * @method init
   * @constructor
   */
  init() {
    this._super();
    this.resetCalendarDate();
    this.keepCalendarUpdated();
    this.updateActiveSection();
  },

  /**
   * Get a monent object from a timestamp that could be seconds or milliseconds
   *
   * @public
   * @method getMomentDate
   * @param timestamp {number}
   * @return {moment}
   */
  getMomentDate(timestamp) {
    if (this.get('isMilliseconds')) {
      return moment.utc(timestamp);
    } else {
      return moment.utc(timestamp*1000);
    }
  },

  /**
   * sets the calendarDate to the timestamp and sets the values for the date picker headers
   *
   * @private
   * @method resetCalendarDate
   */
  resetCalendarDate: Ember.observer('timestamp', function() {
    Ember.assert("timestamp must be a valid unix timestamp", Ember.isNone(this.get('timestamp')) || typeof this.get('timestamp') === 'number');

    const time = this.getMomentDate(this.get('timestamp'));

    if (!Ember.isNone(this.get('timestamp'))) {
      if (moment.isMoment(time) && time.isValid()) {
        this.set('calendarDate', this.get('timestamp'));

        this.set('year', time.format('YYYY'));
        this.set('month', time.format('MMM').toUpperCase());
        this.set('day', time.format('DD'));
        this.set('dayOfWeek', time.format('dddd'));
      }
    } else {
      Ember.assert("timestamp must be a valid unix timestamp", moment.isMoment(time) && time.isValid());
    }
  }),

  /**
   * updates to the new active header  (day, month, or year)
   *
   * @private
   * @method updateActiveSection
   */
  updateActiveSection: Ember.observer('calendarActiveSection', function() {
    let section = this.get('calendarActiveSection');

    if (section === 'day') {
      this.set('dayActive', 'active');
      this.set('monthActive', null);
      this.set('yearActive', null);
      this.set('monthYearActive', null);
    } else if (section === 'month') {
      this.set('monthActive', 'active');
      this.set('dayActive', null);
      this.set('yearActive', null);
      this.set('monthYearActive', null);
    } else if (section === 'year') {
      this.set('yearActive', 'active');
      this.set('monthActive', null);
      this.set('dayActive', null);
      this.set('monthYearActive', null);
    } else if (section === 'month-year') {
      this.set('monthYearActive', 'active');
      this.set('monthActive', null);
      this.set('dayActive', null);
      this.set('yearActive', null);
    }
  }),

  /**
   * re configures the calendar when calendarDate is changed, sets the monthYear calendar header
   *
   * @private
   * @method keepCalendarUpdated
   */
  keepCalendarUpdated: Ember.observer('calendarDate', function() {
    const calendarObject = this.getMomentDate(this.get('calendarDate'));
    this.buildDaysArrayForMonth();
    this.set('monthYear', calendarObject.format('MMM YYYY'));
  }),

  /**
   * makes moment objects for each day in month, disables them if they exceed max/min date
   *
   * @private
   * @method buildDaysArrayForMonth
   */
  buildDaysArrayForMonth: function() {
		const calendarDate = this.get('calendarDate');
    const minDate = this.getMomentDate(this.get('minDate'));
    const maxDate = this.getMomentDate(this.get('maxDate'));
    const firstDay = this.getMomentDate(calendarDate).startOf('month');
    const lastDay = this.getMomentDate(calendarDate).add(1, 'month').startOf('month');

    const daysArray = Ember.A();
    let currentDay = firstDay;
    while (currentDay.isBefore(lastDay)) {
      if (!Ember.isNone(this.get('minDate')) || !Ember.isNone(this.get('maxDate'))) {
        if (currentDay.isBetween(minDate, maxDate)) {
          currentDay.isDisabled = false;
          daysArray.pushObject(currentDay);
          currentDay = currentDay.clone().add(1, 'days');
        } else {
          currentDay.isDisabled = true;
          daysArray.pushObject(currentDay);
          currentDay = currentDay.clone().add(1, 'days');
        }
      } else {
        currentDay.isDisabled = false;
        daysArray.pushObject(currentDay);
        currentDay = currentDay.clone().add(1, 'days');
      }
    }
    this.currentDayOnCalendar(daysArray);
  },

  /**
   * sets active to the current active day
   *
   * @private
   * @method currentDayOnCalendar
   */
  currentDayOnCalendar(daysArray) {
    let completeDaysArray = Ember.A();
    let currentTime = this.getMomentDate(this.get('timestamp'));

    daysArray.forEach((item) => {
      let startItem = item.clone();
      let endItem = item.clone();
      let startOfDay = startItem.startOf('day');
      let endOfDay = endItem.endOf('day');

      if (currentTime.isBetween(startOfDay, endOfDay)) {
        item.isCurrentDay = true;
        item.dayOfMonth = item.date();
        completeDaysArray.push(item);
      } else {
        item.isCurrentDay = false;
        item.dayOfMonth = item.date();
        completeDaysArray.push(item);
      }
    });

    this.buildCompleteArray(completeDaysArray);
  },

  /**
   * builds an array of days in a month, starting at sunday
   *
   * @private
   * @method buildCompleteArray
   */
  buildCompleteArray(completeDaysArray) {
    let nullHeadLength = 0;
    let monthArrayLength = 42;
    let firstDayPosition = completeDaysArray.get('firstObject').day();
    let numberOfDays = completeDaysArray.get('length');

    let completeArray = Ember.A();

    for (let i=0; i<firstDayPosition; i++) {
      nullHeadLength++;
      completeArray.push(null);
    }

    completeDaysArray.forEach(function(day) {
      completeArray.push(day);
    });

    let nullTailLength = monthArrayLength - nullHeadLength - numberOfDays;

    for (let x=0; x<nullTailLength; x++) {
      nullHeadLength++;
      completeArray.push(null);
    }

    this.groupByWeeks(completeArray);
  },

   /**
   * groups days into week objects
   *
   * @private
   * @method groupByWeeks
   */
  groupByWeeks(completeArray) {
    let grouped = Ember.A([]);

    grouped.pushObject(completeArray.filter(this.inRange(0, 7)));
    grouped.pushObject(completeArray.filter(this.inRange(7, 14)));
    grouped.pushObject(completeArray.filter(this.inRange(14, 21)));
    grouped.pushObject(completeArray.filter(this.inRange(21, 28)));
    grouped.pushObject(completeArray.filter(this.inRange(28, 35)));
    grouped.pushObject(completeArray.filter(this.inRange(35, 42)));

    this.set('groupedArray', grouped);
  },

  /**
   * puts days into week objects
   *
   * @private
   * @method inRange
   * @param lower {number} first number in week
   * @param upper {number} last number in week
   * @return {boolean} true if day is in week, otherwise false
   */
  inRange(lower, upper) {
    Assert.isNumber(lower);
    Assert.isNumber(upper);

    return function (each, index) {
      return (index >= lower && index < upper);
    };
  },

  /**
   * receives a moment object and sets it to timestamp
   *
   * @private
   * @method setTimestamp
   * @param moment {object} moment object
   */
  setTimestamp(date) {
    Assert.isMoment(date);

    if (this.get('isMilliseconds')) {
      this.set('timestamp', date.valueOf());
    } else {
      this.set('timestamp', date.unix());
    }
  },

  /**
   * receives a moment object and sets it to calendarTimestamp
   *
   * @private
   * @method setCalendarTimestamp
   * @param moment {object} moment object
   */
  setCalendarDate(date) {
    Assert.isMoment(date);

    if (this.get('isMilliseconds')) {
      this.set('calendarDate', date.valueOf());
    } else {
      this.set('calendarDate', date.unix());
    }
  },

  actions: {

    /**
     * sets the timestamp to the clicked day
     *
     * @param day {object} moment object of the clicked day
     * @event dayClicked
     */
    dayClicked(day) {
      Assert.isMoment(day);

      const newDay = day.date();
      const newMonth = day.month();
      const newYear = day.year();

      let timestamp = this.getMomentDate(this.get('timestamp'));
      timestamp.date(newDay);
      timestamp.month(newMonth);
      timestamp.year(newYear);

      this.setTimestamp(timestamp);
    },

    /**
     * subtracts 1 month to the calendarDate
     *
     * @event subtractMonth
     */
    subtractMonth() {
      const calDate = this.getMomentDate(this.get('calendarDate'));
      this.setCalendarDate(calDate.subtract('1', 'months'));
      this.set('calendarActiveSection', 'month-year');
    },

    /**
     * adds 1 month to the calendarDate
     *
     * @event addMonth
     */
    addMonth() {
      const calDate = this.getMomentDate(this.get('calendarDate'));
      let add = calDate.add('1', 'months');

      this.setCalendarDate(add);
      this.set('calendarActiveSection', 'month-year');
    }
  }
});
