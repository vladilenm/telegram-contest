if (!window.Graph)
  (function(window) {

    var DRAG_CURSOR = 'pointer',
      DRAG2_CURSOR = 'pointer';
    var document = window.document;

// Date utils
    var MINUTE = 60, HOUR = 60 * MINUTE, DAY = 24 * HOUR, MONTH = 28 * DAY, YEAR = 365 * DAY, MAXSCALE = 2 * DAY + HOUR;
    var xscales = [
      {base: HOUR, format: ['hour'], sub: -1},
      {base: 2 * HOUR, format: ['hour'], sub: HOUR},
      {base: 3 * HOUR, format: ['hour'], sub: HOUR},
      {base: 6 * HOUR, format: ['dayHour'], sub: HOUR},
      {base: 8 * HOUR, format: ['dayHour'], sub: HOUR},
      {base: 12 * HOUR, format: ['dayHour'], sub: HOUR},
      {base: DAY, format: ['dayFull', 'day'], sub: -1},
      {base: 2 * DAY, format: ['dayFull', 'day'], sub: DAY},
      {base: 3 * DAY, format: ['dayFull', 'day'], sub: DAY},
      {base: 4 * DAY, format: ['dayFull', 'day'], sub: DAY},
      {base: MONTH, format: ['monthFull', 'month'], sub: -1},
      {base: 2 * MONTH, format: ['monthFull', 'month'], sub: MONTH},
      {base: 3 * MONTH, format: ['monthFull', 'month'], sub: MONTH},
      {base: 4 * MONTH, format: ['monthFull', 'month'], sub: MONTH},
      {base: 6 * MONTH, format: ['monthFull', 'month'], sub: MONTH},
      {base: YEAR, format: ['yearFull'], sub: -1}]; // using 'year' ('00, '01, '02...) seems a bad idea
    var DEF_TIME = Math.round((new Date()).getTime() / 1000);
    var dateFormats = {
      hour: "{hour}:00",
      day: getLang('stats_day_mon').split("{month}").join("{dayMonth}"),
      dayFull: getLang('stats_day_mon').split("{month}").join("{dayMonth}"),
      dayFullYear: getLang('stats_day_month_year').split("{month}").join("{dayMonth}"),
      dayHour: getLang('graph_day_fullmon_year_hour'),
      dayHourMin: getLang('graph_day_fullmon_year_hour_min'),
      month: "{shortMonth}'{shortYear}",
      monthFull: "{month}'{shortYear}",
      year: "'{shortYear}",
      yearFull: "{year}"
    };
    var noHoursDateFormats = {
      day: true,
      dayFull: true,
      dayFullYear: true,
      month: true,
      monthFull: true,
      year: true,
      yearFull: true
    };
    var colors = [0x597da3, 0xb05c91, 0x4d9fab, 0x569567, 0xac4c4c, 0xc9c255, 0xcd9f4d, 0x876db3,
      0x6f9fc4, 0xc77bb1, 0x70c5c8, 0x80bb88, 0xce5e5e, 0xe8e282, 0xedb24a, 0xae97d3,
      0x6391bc, 0xc77bb1, 0x62b1bc, 0x80bb88, 0xb75454, 0xc9c255, 0xdca94f, 0x997fc4,
      0x85afd0, 0xc77bb1, 0x8ecfce, 0x80bb88, 0xe47070, 0xc9c255, 0xf7be5a, 0xbeaadf];

    var globalTouchCount = 0;
    var _2x = (window.devicePixelRatio >= 2);
    var cs = _2x ? 2 : 1;

    function moveTo(ctx, x, y) {
      ctx.moveTo(cs * x, cs * y);
    }
    function lineTo(ctx, x, y) {
      ctx.lineTo(cs * x, cs * y);
    }
    function lineWidth(ctx, lw) {
      ctx.lineWidth = cs * lw;
    }
    function clearRect(ctx, x, y, w, h) {
      ctx.clearRect(cs * x, cs * y, cs * w, cs * h);
    }
    function fillRect(ctx, x, y, w, h) {
      ctx.fillRect(cs * x, cs * y, cs * w, cs * h);
    }
    function strokeRect(ctx, x, y, w, h) {
      ctx.strokeRect(cs * x, cs * y, cs * w, cs * h);
    }
    function fillText(ctx, text, x, y, max_w) {
      if (typeof max_w !== 'undefined') {
        ctx.fillText(text, cs * x, cs * y, cs * max_w);
      } else {
        ctx.fillText(text, cs * x, cs * y);
      }
    }
    function arc(ctx, x, y, r, sa, ea, ccw) {
      ctx.arc(cs * x, cs * y, cs * r, sa, ea, ccw);
    }
    function bezierCurveTo(ctx, cp1x, cp1y, cp2x, cp2y, x, y) {
      ctx.bezierCurveTo(cs * cp1x, cs * cp1y, cs * cp2x, cs * cp2y, cs * x, cs * y);
    }
    function cWidth(canvas, w) {
      canvas.width = cs * w;
      canvas.style.width = w + "px";
    }
    function cHeight(canvas, h) {
      canvas.height = cs * h;
      canvas.style.height = h + "px";
    }
    function getFont(size, orig) {
      if (!orig) size = cs * size;
      return size + 'px Open Sans, tahoma, arial, verdana, sans-serif, Lucida Sans';
    }

    function fullDate(time, params) {
      var fmt = 'dayFullYear';
      if (params) {
        if (params.show_time) {
          fmt = params.show_minutes ? 'dayHourMin' : 'dayHour';
        } else if (params.only_month) {
          fmt = 'monthFull';
        }
      }
      return formatDate(time, fmt);
    }

    function formatDate(time, format) {
      if (time == -1) {
        var h = (format == 'dayHour' ? '0' : '88'), m = '88', d = '88',
          mmmm = 'Mmmmmmmm', mmmm2 = 'Mmmmmmmm', mmm = 'mmm', mmm2 = 'mmm', yyyy = '88888', yy = '.88';
      } else {
        if (noHoursDateFormats[format]) {
          time = fixTime(time, fixTimeDiff(time));
        }
        var date = new Date(time * 1000);
        var h = date.getHours(), m = date.getMinutes().toString();
        var h12 = h % 12;
        if (h12 == 0) h12 = 12;
        var am_pm = h < 12 ? 'AM':'PM';
        h = h.toString();
        if (m.length == 1) m = '0' + m;
        var d = date.getDate().toString(),
          mmmm = getLang('Month' + (date.getMonth() + 1) + '_of'), mmmm2 = getLang('Month' + (date.getMonth() + 1)),
          yyyy = date.getFullYear().toString(), yy = yyyy.substr(2);
        mmm = se('<textarea>' + mmmm + '</textarea>').value.substr(0, 3).toLowerCase();
        mmm2 = se('<textarea>' + mmmm2 + '</textarea>').value.substr(0, 3).toLowerCase();
      }
      var fmt = dateFormats[format];
      return fmt.split('{month}').join(mmmm2).
      split('{shortMonth}').join(mmm2).
      split('{shortYear}').join(yy).
      split('{year}').join(yyyy).
      split('{day}').join(d).
      split('{dayMonth}').join(mmmm).
      split('{shortDayMonth}').join(mmm).
      split('{hour}').join(h).
      split('{hour12}').join(h12).
      split('{min}').join(m).
      split('{am/pm}').join(am_pm);
    }

    function fixTimeDiff(time) {
      var date = new Date(time * 1000);
      var hours = (date.getHours() + 1) % 24;
      return (hours < 5) ? 3 : 0;
    }
    function fixTime(time, fix_diff) {
      return time + fix_diff * 3600;
    }

    function incDate(time, step, inc) {
      var fix_diff = fixTimeDiff(time);
      time = fixTime(time, fix_diff);
      var date = new Date(time * 1000);
      if (step >= YEAR) {
        var count = step / YEAR;
        date = new Date((Math.floor(date.getFullYear() / count) + inc) * count, 0, 1, 0, 0);
        return Math.floor(date.getTime() / 1000);
      } else
      if (step < YEAR && step >= MONTH) {
        var count = step / MONTH;
        date = new Date(date.getFullYear(), (Math.floor(date.getMonth() / count) + inc) * count, 1, 0, 0);
        return Math.floor(date.getTime() / 1000);
      } else
      if (step < MONTH) {
        time = fixTime(time, -fix_diff);
        var tz = (new Date).getTimezoneOffset() * 60;
        return Math.floor((time - tz) / step + inc) * step + tz;
      }
    }

// Other utils
    function addEventEx(graph, element, event, listener) {
      element.graph = graph;
      addEvent(element, event, listener);
    }
    function removeEventEx(element, event, listener) {
      removeData(element, "graph");
      removeEvent(element, event, listener);
    }
    function prepareEvent(event, pass) {
      if (event.touches) {
        if (event.touches.length > 1 || globalTouchCount > 1) {
          event.currentTarget.graph.endDrag();
          return false;
        } else {
          if (!pass) cancelEvent(event);
          return event.touches[0];
        }
      }
      cancelEvent(event);
      return event;
    }

    function getContext(e) {
      var ctx = e.getContext("2d");
      if (!ctx) return ctx;
      if (!ctx.measureText || !ctx.measureText(getLang('Month1')))
        return null;
      return ctx;
    }

    function getFirstControlPoints(rhs) {
      var n = rhs.length, x = [], tmp = [], b = 2.0;
      x[0] = rhs[0] / b;
      for (var i = 1; i < n; i++) {
        tmp[i] = 1 / b;
        b = (i < n - 1 ? 4.0 : 3.5) - tmp[i];
        x[i] = (rhs[i] - x[i - 1]) / b;
      }
      for (var i = 1; i < n; i++)
        x[n - i - 1] -= tmp[n - i] * x[n - i];
      return x;
    }

    function getYStep(maxValue, intScale) {
      var step = Math.pow(10, Math.floor(Math.LOG10E * Math.log(maxValue)));
      if (maxValue / step <= 2)
        step /= 4.0; else
      if (maxValue / step <= 4)
        step /= 2.0;

      if (intScale) {
        step = Math.max(step, 1);
        if (step == 2.5) {
          step = 2;
        }
      }
      return step;
    }

    function formatValue(value) { // something like -10 000 000.000001
      var sgn = (value < 0) ? '-' : '';
      value = Math.abs(value);
      var intv = Math.floor(value), fltv = value - intv;
      fltv = Math.round(fltv * 100000.0) / 100000.0;
      var res = '';
      while (intv > 0) {
        var q = (intv % 1000).toString();
        res = (intv > 999 ? '000'.substr(0, 3 - q.length) : '') + q + (res == '' ? '' : ' ') + res;
        intv = Math.floor(intv / 1000);
      }
      if (res == '') res = '0';
      if (fltv > 0) res += fltv.toString().substr(1);
      return sgn + res;
    }

    function drawCheck(e, color, color2, checked, over) {
      var ctx = getContext(e);
      clearRect(ctx, 0, 0, 20, 20);
      if (checked) { // shadow
        lineWidth(ctx, 2);
        ctx.strokeStyle = color2;
        ctx.beginPath();
        moveTo(ctx, 6.5, 11);
        lineTo(ctx, 9.5, 14);
        lineTo(ctx, 17.5, 6);
        ctx.stroke();
      }
      if (over) {
        ctx.fillStyle = color2;
        fillRect(ctx, 3, 3, 14, 14);
      }
      lineWidth(ctx, 1);
      ctx.strokeStyle = color;
      strokeRect(ctx, 3.5, 3.5, 13, 13);
      if (checked) {
        lineWidth(ctx, 2);
        ctx.beginPath();
        moveTo(ctx, 6.5, 10);
        lineTo(ctx, 9.5, 13);
        lineTo(ctx, 17.5, 5);
        ctx.stroke();
      }
    }

    function drawLines(ctx, x, y, w, h, lines, stTime, enTime, xfactor, yfactor, yDelta, zoomedOut, active, smooth) {
      smooth = (!zoomedOut) && smooth;
      var stIdxs = [], enIdxs = [], _lines = [];
      for (var l = 0; l < lines.length + (active ? 1 : 0); l++) {
        var line = (l < lines.length) ? (active != lines[l] ? lines[l] : null) : active;
        if (line && line.shown) {
          var stIdx = 0, enIdx = line.d.length - 1;
          while ((stIdx < line.d.length - 2) && (line.d[stIdx + 2].x < stTime)) stIdx++;
          while ((enIdx > 2) && (line.d[enIdx - 2].x > enTime)) enIdx--;
          if (enIdx - stIdx > w / 5) // dots overload
            smooth = false;
          if (enIdx >= stIdx && (line.d[enIdx].x >= stTime) && (line.d[stIdx].x <= enTime)) {
            _lines.push(line);
            stIdxs.push(stIdx);
            enIdxs.push(enIdx);
          }
        }
      }

      lines = _lines;
      for (var l = 0; l < lines.length; l++) {
        var stIdx = stIdxs[l], enIdx = enIdxs[l], ps = lines[l].d;

        if (smooth && (enIdx - stIdx + 1 > 2)) {
          var knots = [], n = 0;
          for (var i = stIdx; i <= enIdx; i++) {
            knots[n] = {X: x + (ps[i].x - stTime) * xfactor, Y: y + h - (ps[i].y + yDelta) * yfactor};
            n++;
          }
          n--;

          var rhs = [];
          for (var i = 1; i < n - 1; ++i)
            rhs[i] = 4 * knots[i].X + 2 * knots[i + 1].X;
          rhs[0] = knots[0].X + 2 * knots[1].X;
          rhs[n - 1] = (8 * knots[n - 1].X + knots[n].X) / 2.0;
          var xs1 = getFirstControlPoints(rhs);

          for (var i = 1; i < n - 1; ++i)
            rhs[i] = 4 * knots[i].Y + 2 * knots[i + 1].Y;
          rhs[0] = knots[0].Y + 2 * knots[1].Y;
          rhs[n - 1] = (8 * knots[n - 1].Y + knots[n].Y) / 2.0;
          var ys1 = getFirstControlPoints(rhs), xs2 = [], ys2 = [];
          for (var i = 0; i < n; ++i) {
            if (i < n - 1) {
              xs2[i] = 2 * knots[i + 1].X - xs1[i + 1];
              ys2[i] = 2 * knots[i + 1].Y - ys1[i + 1];
            } else {
              xs2[i] = (knots[n].X + xs1[n - 1]) / 2;
              ys2[i] = (knots[n].Y + ys1[n - 1]) / 2;
            }
          }
        }

        // fill
        if (lines[l].f && stIdx < enIdx) {
          ctx.globalAlpha = (active == null || active != lines[l]) ? 0.2 : 0.4;
          ctx.fillStyle = lines[l].hexColor;
          ctx.strokeStyle = lines[l].hexColor;
          lineWidth(ctx, zoomedOut ? 1 : 2);
          if (lines[l].b) {
            for (var i = stIdx; i <= enIdx; i++) {
              var cx1 = Math.floor(x + ((i > stIdx ? (ps[i - 1].x + ps[i].x) / 2 : ps[i].x) - stTime) * xfactor);
              var cx2 = Math.floor(x + ((i < enIdx ? (ps[i].x + ps[i + 1].x) / 2 : ps[i].x) - stTime) * xfactor);
              var cy = (ps[i].y + yDelta) * yfactor;
              fillRect(ctx, cx1, y + h - cy, cx2 - cx1, ps[i].y * yfactor);
            }
          } else {
            ctx.beginPath();
            var px = x + (ps[stIdx].x - stTime) * xfactor;
            moveTo(ctx, px, y + h - yDelta * yfactor);
            for (var i = stIdx; i <= enIdx; i++) {
              var cx = x + (ps[i].x - stTime) * xfactor;
              if (smooth && (i > stIdx) && (enIdx - stIdx + 1 > 2))
                bezierCurveTo(ctx, Math.min(Math.max(px, xs1[i - stIdx - 1]), cx), Math.min(y + h, Math.max(ys1[i - stIdx - 1], 0)), Math.min(Math.max(px, xs2[i - stIdx - 1]), cx), Math.min(y + h, Math.max(ys2[i - stIdx - 1], 0)), cx, y + h - (ps[i].y + yDelta) * yfactor);
              else
                lineTo(ctx, cx, y + h - (ps[i].y + yDelta) * yfactor);
              px = cx;
            }
            lineTo(ctx, px, y + h - yDelta * yfactor);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }

        // stroke
        ctx.strokeStyle = lines[l].hexColor;
        lineWidth(ctx, zoomedOut ? 1 : 2);
        ctx.beginPath();
        var px = x + (ps[stIdx].x - stTime) * xfactor, py = y + h - (ps[stIdx].y + yDelta) * yfactor;
        moveTo(ctx, px, py);
        if (lines[l].b) {
          for (var i = stIdx; i <= enIdx; i++) {
            var cx = Math.floor(x + ((i < enIdx ? (ps[i].x + ps[i + 1].x) / 2 : ps[i].x) - stTime) * xfactor);
            var cy = y + h - (ps[i].y + yDelta) * yfactor;
            lineTo(ctx, cx, cy);
            if (i < enIdx)
              if (zoomedOut)
                lineTo(ctx, cx, y + h - (ps[i + 1].y + yDelta) * yfactor);
              else {
                ctx.stroke();
                ctx.beginPath();
                moveTo(ctx, cx, y + h - (ps[i + 1].y + yDelta) * yfactor);
              }
          }
        } else {
          for (var i = stIdx + 1; i <= enIdx; i++) {
            var cx = x + (ps[i].x - stTime) * xfactor, cy = y + h - (ps[i].y + yDelta)* yfactor;
            if (ps[i].s == 'x') {
              ctx.stroke();
              ctx.beginPath();
              moveTo(ctx, cx, cy);
            } else {
              if (ps[i].s == '-' || ps[i].s == '--' || ps[i].s == '.') {
                ctx.stroke();
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                moveTo(ctx, px, py);
              }

              if (smooth && (i > stIdx) && (enIdx - stIdx + 1 > 2))
                bezierCurveTo(ctx, Math.min(Math.max(px, xs1[i - stIdx - 1]), cx), Math.min(y + h, Math.max(ys1[i - stIdx - 1], 0)), Math.min(Math.max(px, xs2[i - stIdx - 1]), cx), Math.min(y + h, Math.max(ys2[i - stIdx - 1], 0)), cx, y + h - (ps[i].y + yDelta) * yfactor);
              else
                lineTo(ctx, cx, y + h - (ps[i].y + yDelta) * yfactor);

              if (ctx.globalAlpha != 1) {
                ctx.stroke();
                ctx.beginPath();
                moveTo(ctx, cx, cy);
              }
            }
            ctx.globalAlpha = 1;
            px = cx;
            py = cy;
          }
        }
        ctx.stroke();

        // dots
        if (smooth || (enIdx - stIdx < 2 && !zoomedOut)) {
          ctx.strokeStyle = lines[l].hexColor;
          ctx.fillStyle = '#ffffff';
          lineWidth(ctx, 2);
          for (var i = stIdx; i <= enIdx; i++) {
            ctx.beginPath();
            arc(ctx, x + (ps[i].x - stTime) * xfactor, y + h - (ps[i].y + yDelta) * yfactor, 3.5, 0, Math.PI*2, true);
            ctx.fill();
            ctx.stroke();
          }
        }
      }
    }

    function drawBars(ctx, x, y, w, h, lines, labels, barW, xfactor, yfactor, yDelta) {
      for (var l = 0; l < lines.length; l++) {
        var ps = lines[l].d;
        for (i = 0; i < ps.length; i++) {
          if (!labels[ps[i].x]) {
            continue;
          }
          var cx = Math.floor(getBarXValue(x, xfactor, barW, l, ps[i].x));
          var psy = Math.max(ps[i].y, 2 / yfactor);
          var cy = (psy + yDelta) * yfactor;

          ctx.fillStyle = lines[l].hexColor;
          fillRect(ctx, cx, Math.floor(y + h - cy), barW, Math.ceil(psy * yfactor));
        }
      }
    }

    function getBarXValue(xOffset, xStep, barsWidth, lineIndex, barIndex) {
      return xOffset + barsWidth / 2 + lineIndex * barsWidth + barIndex * xStep;
    }

    function clearSelection() {
      if(document.selection && document.selection.empty) {
        document.selection.empty();
      } else if(window.getSelection) {
        var sel = window.getSelection();
        sel.removeAllRanges();
      }
    }

    function dataObjectToArray(data_object) {
      var data_array = [];
      for (var name in data_object) {
        data_array.push(data_object[name]);
      }
      return data_array;
    }

// Graph constructor

    function Graph(id, data, params, width, height) {
      var graph = this;
      params = extend({}, params);
      width = width ? width : 585;
      height = height ? height : 385;
      extend(this, {params: params, width: width, height: height, viewWidth: width, viewHeight: height - 80});
      this.params.yunits = this.params.yunits || '';

      // create basic DOM tree
      this.graphDiv = ge(id);
      if (!this.graphDiv) {
        return;
      }
      setStyle(this.graphDiv, {fontFamily: 'Open Sans, tahoma, arial, verdana, sans-serif, Lucida Sans', fontSize: '11px', color: '#36638e', width: this.viewWidth + 'px', clear: 'both', lineHeight: '130%', textAlign: 'left'});
      this.graphDiv.innerHTML = '<div style="float: left"><canvas style="padding-top: 20px"></canvas></div>\
    <div style="float: left">\
      <div style="height: 20px; float: right;"></div>\
      <div style="height: 20px; padding-left: 10px;"></div>\
      <div style="position: relative; height: ' + this.viewHeight + 'px;">\
        <canvas height="' + (this.viewHeight * cs) + '" style="height: ' + this.viewHeight + 'px;"></canvas>\
        <canvas height="' + ((this.viewHeight - 17) * cs) + '" style="position: absolute; top: 0; left: 0; height: ' + (this.viewHeight - 17) + 'px;"></canvas>\
        <div style="position: absolute; border: 1px solid #5f7d9d; color: #5f7d9d;\
            background-color: #eeeeee; padding: 2px 3px 2px 4px; white-space: nowrap; display: none;">' + cur.graphVars['lang.data_empty'] + '</div>\
      </div>\
      <div style="position: relative; height: 40px;">\
        <canvas height="' + (40 * cs) + '" style="height: 40px;"></canvas>\
        <div style="position: absolute; top: 0; height: 38px; border: 1px solid #b8c5d4; border-width: 1px 0px 1px 1px; border-top-color: #d3dee8;"><div style="background: white; opacity: 0.5; filter: alpha(Opacity=50); width: 100%; height: 100%;"></div></div>\
        <div style="position: absolute; top: 0; height: 38px; border: 1px solid #b8c5d4; cursor: ' + DRAG_CURSOR + ';"></div>\
        <div style="position: absolute; top: 0; height: 38px; border: 1px solid #b8c5d4; border-width: 1px 1px 1px 0px; border-top-color: #d3dee8;"><div style="background: white; opacity: 0.5; filter: alpha(Opacity=50); width: 100%; height: 100%;"></div></div>\
        <div style="position: absolute; top: 0; height: 38px; border: 1px solid #b8c5d4; background: #ced9de; opacity: 0.5; filter: alpha(Opacity=50); display: none;"></div>\
          <div style="position: absolute; top: 0; width: 8px; height: 40px; cursor: w-resize;"></div>\
          <div style="position: absolute; top: 0; width: 8px; height: 40px; cursor: e-resize;"></div>\
      </div>\
      <div style="float: left; width: 270px; padding-top: 8px; -moz-user-select: none; -khtml-user-select: none;"></div><div style="float: left; width: 270px; padding-top: 8px; -moz-user-select: none; -khtml-user-select: none;"></div>\
    </div><div style="clear: left;"></div>';

      this.vScale = this.graphDiv.children[0];
      this.vScaleView = this.vScale.children[0]; // canvas
      this.mainLayout = this.graphDiv.children[1];
      this.menu = this.mainLayout.children[0];
      this.title = this.mainLayout.children[1];
      this.zinLayout = this.mainLayout.children[2];
      this.zinView = this.zinLayout.children[0]; // canvas
      this.dotsLayer = this.zinLayout.children[1]; // canvas
      this.message = this.zinLayout.children[2];
      this.zoutLayout = this.mainLayout.children[3];
      this.zoutView = this.zoutLayout.children[0]; // canvas
      this.lMask = this.zoutLayout.children[1];
      this.zoutWindow = this.zoutLayout.children[2];
      this.rMask = this.zoutLayout.children[3];
      this.select = this.zoutLayout.children[4];
      this.lHandle = this.zoutLayout.children[5];
      this.rHandle = this.zoutLayout.children[6];
      this.column = [this.mainLayout.children[4], this.mainLayout.children[5]];

      var defaultGraph = 0;
      if (typeof params.multiple == 'object' && params.multiple.items) {
        if (!params.multiple.def) params.multiple.def = 0;
        for (i in params.multiple.items) {
          var item = se('<a class="graph_menu_item' + (i == params.multiple.def ? ' graph_menu_item_sel' : '') + '">' + params.multiple.items[i] + '</a>');
          var clickContext = {clickNode: i, graph: this};
          addEvent(item, 'click', this.onClickMenu, null, clickContext);
          cur.destroy.push(function() {
            removeEvent(item, 'click', this.onClickMenu, null, clickContext);
          });
          this.menu.appendChild(item);
        }
        if (params.multiple.graph_item) {
          var item = se('<a class="graph_menu_item">' + params.multiple.graph_item + '</a>');
          var clickContext = {clickNode: params.multiple.items.length, graph: this, alt_graph: true};
          addEvent(item, 'click', this.onClickMenu, null, clickContext);
          cur.destroy.push(function() {
            removeEvent(item, 'click', this.onClickMenu, null, clickContext);
          });
          this.menu.appendChild(item);
        }

        for (i in params.multiple.altitems) {
          var item = se('<a class="graph_menu_item' + (i + params.multiple.altitems.length == params.multiple.def ? ' graph_menu_item_sel' : '') + '">' + params.multiple.altitems[i][0] + '</a>');
          var clickContext = {clickNode: i, graph: this, force_func: params.multiple.altitems[i][1] };
          addEvent(item, 'click', this.onClickMenu, null, clickContext);
          cur.destroy.push(function() {
            removeEvent(item, 'click', this.onClickMenu, null, clickContext);
          });
          this.menu.appendChild(item);
        }
        defaultGraph = params.multiple.def;
        params.multiple = 1;
      }

      extend(this, {
        colMax: [0, 0], lines: [],
        leftTime: -1, rightTime: -1,
        ymarks: [],
        ystep: 0,
        minValue: 100, maxValue: 0, minTime: 2147483647, maxTime: 0,
        dragTime: [],
        startDrag: -1, startDrag2: -1, startValue: -1, startValue2: -1, endValue: -1,
        dragElement: null, maskDragging: false, viewClick: false, smoothLines: false,
        scaleWidth: 0, activeLine: null, isNegative: false});

      try {
        var tctx = getContext(this.zinView);
        if (!tctx) throw 'Error';
      } catch (e) {
        this.zoutLayout.style.display = 'none';
        this.vScale.style.display = 'none';
        this.title.style.display = 'none';
        this.message = (this.message == null) ? this.zinLayout.children[0] : this.message;
        this.message.innerHTML = (cur.graphVars['lang.bad_browser'] || 'Для отображения графика статистики Вам необходимо {link}обновить браузер{/link}.').replace('{link}', '<a onclick="Graph.prototype.showBadBrowserBox();">').replace('{/link}', '</a>');
        setStyle(this.graphDiv, {backgroundColor: '#F7F7F7', width: '480px', margin: '0 auto'});
        setStyle(this.message, {
          left: Math.round((getSize(this.zinLayout)[0] - getSize(this.message)[0]) / 2) + 'px',
          top: Math.round((getSize(this.zinLayout)[1] - getSize(this.message)[1]) / 2) + 'px',
          display: 'block',
          color: '#707070',
          border: 'none',
          backgroundColor: 'transparent'
        });
        if (!cur.badBrowserBox) {
          this.showBadBrowserBox();
        }
        return null;
      }

      if (vk.al) {
        stManager.add(['tooltips.js', 'tooltips.css'], function() {
          tooltips.create(graph.mainLayout, {text: '...', black: 1, forcetoup: 1, nohide: 1});
        });
      } else {
        tooltips = false;
      }

      if (!params.bar_chart) {
        addEventEx(this, this.lHandle, 'mousedown touchstart', this.takeHandle);      // resize window
        addEventEx(this, this.rHandle, 'mousedown touchstart', this.takeHandle);
        addEventEx(this, this.zoutWindow, 'mousedown touchstart', this.takeWindow);      // drag window
        addEventEx(this, this.lMask, 'mousedown touchstart', this.takeMask);        // select new window
        addEventEx(this, this.rMask, 'mousedown touchstart', this.takeMask);
        addEventEx(this, this.zinLayout, 'mousedown touchstart', this.takeView);      // drag view
        addEventEx(this, this.zinLayout, 'mousewheel DOMMouseScroll', this.wheelView);    // zoom with mousewheel
        addEventEx(this, this.zoutLayout, 'mousewheel DOMMouseScroll', this.wheelView);
      }
      addEventEx(this, this.dotsLayer, 'mousemove', this.showDots);              // show hints
      addEventEx(this, this.zinLayout, 'mouseout', this.hideDots);            // hide hints
      addEvent(this.column[0], 'selectionstart', cancelEvent);
      addEvent(this.column[1], 'selectionstart', cancelEvent);

      if (typeof(data) != 'string') {
        graph.loadGraph = function(index) {
          graph.setData(params.multiple ? (data[index] || []) : data, isArray(params.adjust) ? params.adjust[index] : params.adjust);
        }
      }

      if (params.multiple) {
        for (var i = 0; i < data.length; i++) {
          data[i] = dataObjectToArray(data[i]);
        }

        graph.setData((typeof(data) == 'string') ? data : (data[defaultGraph] || []), isArray(params.adjust) ? params.adjust[0] : params.adjust);
      } else {
        graph.setData((typeof(data) == 'string') ? data : dataObjectToArray(data), params.adjust);
      }
      return graph;
    }

// Prototype methods
    Graph.prototype = {
      getXValue: function(pageX, view) {
        return (view ?
          ((pageX - getXY(this.zinView)[0]) / this.xfactorIn + this.leftTime) :
          ((pageX - getXY(this.zoutView)[0]) / this.xfactorOut + this.minTime));
      },
      allowZoom: function(zoom_allowed) {
        this.zoutLayout.style.display = zoom_allowed ? 'block' : 'none';
        this.viewHeight = this.height - (zoom_allowed ? 80 : 40);
        this.zinLayout.style.height = this.viewHeight + "px";
        cHeight(this.zinView, this.viewHeight);
        cHeight(this.dotsLayer, this.viewHeight - 17);
        this.disable_zoom = !zoom_allowed;
      },
      showEmpty: function(no_data) {
        if (no_data) this.allowZoom(false);
        setStyle(this.message, {
          display: no_data ? 'block' : 'none',
          left: Math.round((this.viewWidth - getSize(this.message)[0]) / 2) + 'px',
          top: Math.round((this.viewHeight - getSize(this.message)[1]) / 2) + 'px'});
      },
      overrideCursor: function(cursor) {
        document.body.style.cursor = cursor ? cursor : 'default';
        //document.body.style.cursor = cursor ? cursor : 'auto'; // Opera don't understand 'auto'
        this.lHandle.style.cursor = cursor ? cursor : 'w-resize';
        this.rHandle.style.cursor = cursor ? cursor : 'e-resize';
        this.zoutWindow.style.cursor = cursor ? cursor : DRAG_CURSOR;
      },
      takeHandle: function(ev) {
        var g = ev.currentTarget.graph;
        if (g.disable_zoom) return;
        if (!(ev = prepareEvent(ev))) return;
        addEventEx(g, document, 'mousemove drag touchmove', g.dragHandle);
        addEventEx(g, document, 'mouseup touchend', g.endDrag);
        g.startDrag = ev.pageX;
        g.startValue = (ev.currentTarget == g.lHandle) ? g.leftTime : g.rightTime;
        g.dragElement = ev.currentTarget;
        g.hideDots(ev);
        g.overrideCursor(g.dragElement.style.cursor);
        return false;
      },
      takeWindow: function(ev) {
        var g = ev.currentTarget.graph;
        if (g.disable_zoom) return;
        if (!(ev = prepareEvent(ev, true))) return;
        addEventEx(g, document, 'mousemove drag touchmove', g.dragWindow);
        addEventEx(g, document, 'mouseup touchend', g.endDrag);
        g.startDrag = ev.pageX;
        g.startValue = g.leftTime;
        g.hideDots(ev);
        g.overrideCursor(DRAG2_CURSOR);
        return false;
      },
      takeMask: function(ev) {
        cancelEvent(ev);
        var g = ev.currentTarget.graph;
        if (g.disable_zoom) return;
        g.dragElement = ev.currentTarget;
        if (!(ev = prepareEvent(ev))) return;
        addEventEx(g, document, 'mousemove drag touchmove', g.dragMask);
        addEventEx(g, document, 'mouseup touchend', g.endDrag);
        g.startValue = (ev.pageX - getXY(g.dragElement.parentNode)[0]) / g.xfactorOut + g.minTime;
        g.endValue = g.startValue;
        g.hideDots(ev);
        return false;
      },
      takeView: function(ev) {
        var g = ev.currentTarget.graph;
        if (g.disable_zoom) {
          g.deselectLine(ev);
          return;
        }
        if (!(ev = prepareEvent(ev, true))) return;
        g.dragTime[0] = g.getXValue(ev.pageX, true);
        addEventEx(g, document, 'mousemove drag touchmove', g.dragView);
        addEventEx(g, document, 'mouseup touchend', g.endDrag);
        g.overrideCursor(DRAG2_CURSOR);
        g.viewClick = true;
        g.startDrag = ev.pageX;
        g.showDots(ev);
        //return false;
      },
      dragHandle: function(ev) {
        var g = ev.currentTarget.graph;
        if (!(ev = prepareEvent(ev))) return;
        var xfactorOut = g.viewWidth / (g.maxTime - g.minTime);
        if (g.dragElement == g.lHandle) {
          g.leftTime = Math.max(g.minTime, Math.min(g.rightTime - g.MAXSCALE, g.startValue - (g.startDrag - ev.pageX) / xfactorOut));
        } else {
          g.rightTime = Math.min(g.maxTime, Math.max(g.leftTime + g.MAXSCALE, g.startValue - (g.startDrag - ev.pageX) / xfactorOut));
        }
        g.redrawWindow();
        return false;
      },
      dragWindow: function(ev) {
        var g = ev.currentTarget.graph;
        if (!(ev = prepareEvent(ev))) return;
        var xfactorOut = g.viewWidth / (g.maxTime - g.minTime),
          diff = g.leftTime - (g.startValue - (g.startDrag - ev.pageX) / xfactorOut);
        diff = Math.max(diff, g.rightTime - g.maxTime);
        diff = Math.min(diff, g.leftTime - g.minTime);

        g.leftTime -= diff;
        g.rightTime -= diff;
        g.redrawWindow();
        return false;
      },
      dragMask: function(ev) {
        var g = ev.currentTarget.graph;
        if (!(ev = prepareEvent(ev))) return;
        var xfactorOut = g.viewWidth / (g.maxTime - g.minTime);
        g.endValue = (ev.pageX - getXY(g.dragElement.parentNode)[0]) / xfactorOut + g.minTime;
        var lpos = (Math.max(g.minTime, Math.min(g.startValue, g.endValue)) - g.minTime) * xfactorOut,
          rpos = (Math.min(g.maxTime, Math.max(g.startValue, g.endValue)) - g.minTime) * xfactorOut;
        if (!g.maskDragging && (rpos - lpos > 4)) {
          g.select.style.display = 'block';
          g.maskDragging = true;
        }
        g.select.style.left = lpos + "px";
        g.select.style.width = (rpos - lpos - 2) + "px";

        return false;
      },
      dragView: function(ev) {
        var g = ev.currentTarget.graph;
        if (!(ev = prepareEvent(ev, g.viewClick))) return;
        var diff = (ev.pageX - getXY(g.zoutView)[0]) / g.xfactorIn + g.leftTime - g.dragTime[0];
        diff = Math.max(diff, g.rightTime - g.maxTime);
        diff = Math.min(diff, g.leftTime - g.minTime);
        g.leftTime -= diff;
        g.rightTime -= diff;

        if (Math.abs(ev.pageX - g.startDrag) > 4)
          g.viewClick = false;
        g.redrawWindow();
        g.showDots(ev);
        return g.viewClick;
      },
      endDrag: function(ev) {
        var g = this;
        if (ev) {
          cancelEvent(ev);
          g = ev.currentTarget.graph;
        }
        removeEventEx(document, 'mousemove drag touchmove', g.dragHandle);
        removeEventEx(document, 'mousemove drag touchmove', g.dragWindow);
        removeEventEx(document, 'mousemove drag touchmove', g.dragMask);
        removeEventEx(document, 'mousemove drag touchmove', g.dragView);
        removeEventEx(document, 'mouseup touchend', g.endDrag);
        g.select.style.display = 'none';
        g.overrideCursor();
        if (g.endValue != -1) {
          if (g.maskDragging) {
            g.leftTime = Math.min(g.startValue, g.endValue);
            g.rightTime = Math.min(g.maxTime, Math.max(Math.max(g.startValue, g.endValue), g.leftTime + g.MAXSCALE));
            g.leftTime = Math.max(g.minTime, Math.min(g.leftTime, g.rightTime - g.MAXSCALE));
          } else {
            var diff = (g.rightTime - g.leftTime) / 2.0;
            g.leftTime = (g.endValue - diff);
            g.rightTime = (g.endValue + diff);
            if (g.leftTime < g.minTime) {
              diff = g.minTime - g.leftTime;
              g.leftTime += diff;
              g.rightTime += diff;
            } else
            if (g.rightTime > g.maxTime) {
              diff = g.rightTime - g.maxTime;
              g.leftTime -= diff;
              g.rightTime -= diff;
            }
          }
        }
        if (g.viewClick)
          g.deselectLine(ev);
        else
          g.redrawWindow();
        g.endValue = -1;
        g.maskDragging = false;
        g.viewClick = false;
        g.dragTime = [];
        return false;
      },
      wheelView: function(ev) {
        if (!ev.detail && ev.wheelDelta === undefined) return;

        var g = ev.currentTarget.graph,
          delta = (ev.detail ? -ev.detail * 50 : ev.wheelDelta),
          dist = g.rightTime - g.leftTime, diffL = (delta * dist) / 3500, diffR;
        if (g.disable_zoom) return;
        if (g.lines.length == 0) return;
        diffL = Math.min(diffL, (dist - g.MAXSCALE) / 2);
        diffR = Math.max(g.minTime - g.leftTime - diffL, 0);
        g.leftTime = Math.max(g.minTime, g.leftTime + diffL);
        g.rightTime = Math.min(g.maxTime, g.rightTime + diffR);
        g.redrawWindow();
        g.showDots(ev);
        return cancelEvent(ev);
      },
      overLegend: function(ev) {
        var line = ev.currentTarget.line;
        drawCheck(line.legendCheck, line.hexColor, line.hexColor2, line.shown, true);
        if ('legendDownloadCSV' in line) {
          line.legendDownloadCSV.style.display = 'block';
        }
      },
      outLegend: function(ev) {
        var line = ev.currentTarget.line;
        drawCheck(line.legendCheck, line.hexColor, line.hexColor2, line.shown, false);
        if ('legendDownloadCSV' in line) {
          line.legendDownloadCSV.style.display = 'none';
        }
      },
      toggleLegendByIndex: function(graph, line_index, flag) {
        if (graph.lines[line_index] !== void 0) {
          var line = graph.lines[line_index];
          line.shown = flag;
          drawCheck(line.legendCheck, line.hexColor, line.hexColor2, line.shown, true);
          graph.updateLines();
          clearSelection();
        }
      },
      toggleLegend: function(ev) {
        var g = ev.currentTarget.graph, line = ev.currentTarget.line, noneShown = true;
        for (var l = 0; l < g.lines.length; l++)
          if (g.lines[l] != line && g.lines[l].shown)
            noneShown = false;
        line.shown = noneShown || !line.shown;
        drawCheck(line.legendCheck, line.hexColor, line.hexColor2, line.shown, true);
        g.updateLines();
        clearSelection();
        return cancelEvent(ev);
      },
      chooseLegend: function(ev) {
        var g = ev.currentTarget.graph, line = ev.currentTarget.line, onlyThis = line.shown;
        if (onlyThis)
          for (var l = 0; l < g.lines.length; l++)
            if (g.lines[l] != line && g.lines[l].shown) {
              onlyThis = false;
              break;
            }

        for (var l = 0; l < g.lines.length; l++) {
          g.lines[l].shown = onlyThis || (g.lines[l] == line);
          drawCheck(g.lines[l].legendCheck, g.lines[l].hexColor, g.lines[l].hexColor2, g.lines[l].shown, g.lines[l] == line);
        }
        g.updateLines();
        clearSelection();
        return cancelEvent(ev);
      },
      downloadCSV: function(ev) {
        var data = ev.currentTarget.line.d,
          fileName = ev.currentTarget.line.name.replace(/[^a-zа-я0-9\-_\(\)\.\,\;]/gi, "_").slice(0, 100),
          CSV = '',
          minDate, maxDate;

        CSV += '\r\n';
        // Prepare CSV data
        for (var iRow = 0; iRow < data.length; iRow++) {
          var date = new Date(parseInt(data[iRow][0]) * 1000);
          var y = date.getFullYear();
          var m = '0' + (date.getMonth() + 1);
          var d = '0' + date.getDate();

          m = m.substr(m.length - 2);
          d = d.substr(d.length - 2);

          date = y + '-' + m + '-' + d;

          if (!iRow)
            minDate = date;

          maxDate = date;

          CSV += date + ';' + data[iRow][1] + '\r\n';
        }

        // Use File API functions here which are in Working Draft status now (Aug'14)
        // May be replaced with manual processing
        // Now only BLOB scheme supports custom filenames.

        // "Дата;Значение" in сp1251 encoding
        var csv_header_bytes = [196,224,242,224, 59, 199,237,224,247,229,237,232,229];
        var csv_header = new Uint8Array(csv_header_bytes.length);

        for (i = 0; i < csv_header_bytes.length; i++)
          csv_header[i] = csv_header_bytes[i];

        var link = document.createElement('a');
        var blob = new Blob([csv_header, CSV], { type: 'text/csv;' });
        var url = URL.createObjectURL(blob);
        var clickParent =  ev.currentTarget.parentElement.parentElement ? ev.currentTarget.parentElement.parentElement : document.body;

        if (minDate)
          fileName += '_' + minDate + '_' + maxDate;
        link.href = url;
        link.setAttribute('download', fileName + ".csv");

        clickParent.appendChild(link);
        link.click();
        clickParent.removeChild(link);

        return cancelEvent(ev);
      },
      showDots: function(ev) {
        var g = ((ev && ev.currentTarget) ? ev.currentTarget.graph : this);
        if (g.params.bar_chart) {
          g.highlightBar(ev);
          return;
        }
        if (g.XSTEP >= MONTH) {
          g.params.only_month = true;
        } else {
          g.params.only_month = false;
        }
        var nearTime = -1, nnd = 0, cx = g.getXValue(ev.pageX, true);
        var ccx = ev.pageX - getXY(g.zinView)[0], ccy = ev.pageY - getXY(g.zinView)[1];
        var max_coltext = [0, 0];
        var activeLine = -1;
        var ctx = getContext(g.dotsLayer);
        clearRect(ctx, 0, 0, g.viewWidth, g.viewHeight);

        for (var l = 0; l < g.lines.length; l++) {
          var ni = -1, nd = 0;
          if (g.lines[l].shown) {
            for (var i = g.lines[l].stIdx; i <= g.lines[l].enIdx; i++)
              if (g.lines[l].d[i].x >= g.leftTime && g.lines[l].d[i].x <= g.rightTime && (ni == -1 || nd > Math.abs(g.lines[l].d[i].x - cx))) {
                ni = i;
                nd = Math.abs(g.lines[l].d[i].x - cx);
              }
          }
          if (ni > -1) {
            var dot = g.lines[l].d[ni],
              dotX = (dot.x - g.leftTime) * g.xfactorIn,
              dotY = g.viewHeight - (g.isNegative ? (34 + (dot.y - g.localBottom) * g.yfactorIn) : (25 + (dot.y - (g.adjust ? g.localBottom : 0)) * g.yfactorIn));
            g.lines[l].dot.posX = dotX;
            g.lines[l].dot.posY = dotY;
            if (ccx >= dotX - 7 && ccx <= dotX + 9 &&
              ccy >= dotY - 7 && ccy <= dotY + 9) {
              activeLine = l;
            }
            if (nearTime == -1 || nd < nnd) {
              nnd = nd;
              nearTime = g.lines[l].d[ni].x;
            }

            ctx.fillStyle = g.lines[l].hexColor;
            ctx.beginPath();
            arc(ctx, dotX, dotY, 3, 0, Math.PI*2, true);
            ctx.fill();

            if (!isVisible(g.lines[l].dotLabel) || !g.lines[l].dotLabel.dot || g.lines[l].dotLabel.dot.x != dot.x || parseInt(g.lines[l].dot.style.left) != Math.floor(dotX)) {
              g.lines[l].dotLabel.innerHTML = dot.l ? dot.l : formatValue(dot.y) + g.params.yunits;
              var labelW = getSize(g.lines[l].dotLabel)[0];
              var pos = Math.max(Math.min(-labelW / 2.0, -labelW + g.viewWidth - dotX - 2), 2 - dotX);
              g.lines[l].dotLabel.dot = dot;
              g.lines[l].dotLabel.pos = Math.floor(pos);
              g.lines[l].dotLabel.w = labelW;

              setStyle(g.lines[l].dot, {
                left: Math.floor(dotX) + "px",
                top: Math.floor(dotY) + "px"});
              setStyle(g.lines[l].dotLabel, {
                top: ((g.lines[l].dot.posY > 26) ? -26 : 6) + "px",
                left: g.lines[l].dotLabel.pos + "px"});
            }

            g.lines[l].legendBox.innerHTML = formatValue(dot.y) + g.params.yunits;
            g.lines[l].legendBox.style.display = 'block';
          } else {
            g.lines[l].legendBox.style.display = 'none';
          }
          if (g.lines[l].legendBox.style.left == '40px') { // label position fix in legend
            var col = l < g.lines.length / 2 ? 0 : 1;
            max_coltext[col] = Math.max(max_coltext[col], getSize(g.lines[l].legend.children[1])[0]);
          }
        }
        if (!g.smoothLines || !window.tooltips) {
          activeLine = -1;
        }
        for (var l = 0; l < g.lines.length; l++) {
          if (!g.lines[l].shown) {
            hide(g.lines[l].dot);
            continue;
          }
          if (activeLine == l) {
            g.showDotTT(l);
          } else if (activeLine == -1) {
            if (g.activeLine == null || g.activeLine == g.lines[l]) {
              show(g.lines[l].dot);
            } else {
              hide(g.lines[l].dot);
            }
          } else {
            hide(g.lines[l].dot);
          }
        }

        if (max_coltext[0] || max_coltext[1]) {
          for (var l = 0; l < g.lines.length; l++) {
            var col = l < g.lines.length / 2 ? 0 : 1;
            if (max_coltext[col]) {
              g.lines[l].legendBox.style.left = (max_coltext[col] + 40) + 'px';
            }
          }
        }
        if (activeLine == -1 && window.tooltips) {
          tooltips.hide(g.mainLayout, {fasthide: 1});
        }
        if (nearTime > -1 && isVisible(g.title))
          g.title.innerHTML = fullDate(nearTime, g.params);
      },
      hideDots: function(ev) {
        var g = (ev.currentTarget ? ev.currentTarget.graph : this), vwPos = getXY(g.zinView);
        if (ev.pageX >= vwPos[0] && ev.pageX < vwPos[0] + g.viewWidth && ev.pageY >= vwPos[1] && ev.pageY < vwPos[1] + g.viewHeight) return;

        for (var l = 0; l < g.lines.length; l++) {
          hide(g.lines[l].dot);
          if(g.lines[l].sum) {
            g.lines[l].legendBox.innerHTML = formatValue(g.lines[l].sum) + g.params.yunits;
          } else {
            hide(g.lines[l].legendBox);
          }
        }
        var ctx = getContext(g.dotsLayer);
        clearRect(ctx, 0, 0, g.viewWidth, g.viewHeight);
        var params = {};
        if (g.XSTEP >= MONTH) {
          params.only_month = true;
        }
        g.title.innerHTML = fullDate(g.localLeft, params) + (g.localRight > g.localLeft ? ' &ndash; ' + fullDate(g.localRight, params) : '');
        if (window.tooltips) {
          tooltips.hide(g.mainLayout, {fasthide: 1});
        }
      },
      highlightBar: function(ev) {
        var g = ((ev && ev.currentTarget) ? ev.currentTarget.graph : this);
        var cx = (ev.pageX - getXY(g.zinView)[0]);
        var cy = (ev.pageY - getXY(g.zinView)[1]);
        var ctx = getContext(g.dotsLayer);
        clearRect(ctx, 0, 0, g.viewWidth, g.viewHeight);

        var activeLine = activeBar = -1;
        for (var l = 0; l < g.lines.length; l++) {
          for (var i = 0; i < g.lines[l].d.length; i++) {
            var nx = getBarXValue(0, g.xstep, g.barsWidth, l, g.lines[l].d[i].x);
            var ny = g.viewHeight - (g.isNegative ? (34 + (g.lines[l].d[i].y - g.localBottom) * g.yfactorIn) : (25 + (g.lines[l].d[i].y - (g.adjust ? g.localBottom : 0)) * g.yfactorIn));
            if (cx > nx && cx <= nx + g.barsWidth && cy >= ny) {
              activeLine = l;
              activeBar = i;
              break;
            }
          }
        }
        for (var l = 0; l < g.lines.length; l++) {
          if (activeBar > -1) {
            var dot = g.lines[l].d[activeBar],
              dotX = getBarXValue(0, g.xstep, g.barsWidth, l, dot.x),
              dotY = g.viewHeight - (g.isNegative ? (34 + (dot.y - g.localBottom) * g.yfactorIn) : (25 + (dot.y - (g.adjust ? g.localBottom : 0)) * g.yfactorIn)),
              val = formatValue(dot.y) + g.params.yunits;

            if (activeLine == l) {
              ctx.fillStyle = g.lines[l].hexColor3;
              fillRect(ctx, dotX, dotY, g.barsWidth, g.viewHeight);

              g.showTT(dotX, dotY, dot.l ? dot.l : val + '<br>' + g.lines[l].name + ', ' + this.params.bar_chart[activeBar]);
              g.lines[l].legendBox.style.display = 'block';
              g.lines[l].legendBox.innerHTML = val;
            } else {
              g.lines[l].legendBox.style.display = 'block';
              g.lines[l].legendBox.innerHTML = val;
            }
          } else if(g.lines[l].sum) {
            g.lines[l].legendBox.innerHTML = formatValue(g.lines[l].sum) + g.params.yunits;
          } else {
            g.lines[l].legendBox.style.display = 'none';
          }
        }
        if (activeBar == -1 && window.tooltips) {
          tooltips.hide(g.mainLayout, {fasthide: 1});
        }
      },
      expandLabel: function(ev) {
        var g = ev.currentTarget.graph, line = ev.currentTarget.line, dot = line.dotLabel.dot, pos = line.dotLabel.pos;
        if (!g.smoothLines) {
          var text = '';
          if (line.l) {
            text += langNumeric(dot.y, line.l, true);
          } else {
            text += (dot.l ? dot.l : formatValue(dot.y)) + ' ' + line.name;
          }
          line.dotLabel.innerHTML = text;
          var sz = getSize(line.dotLabel)[0];
          if (pos + sz + line.dot.posX > g.viewWidth) {
            line.dotLabel.innerHTML = line.name + ' ' + (dot.l ? dot.l : formatValue(dot.y));
            line.dotLabel.style.left = pos - (sz - line.dotLabel.w) + "px";
          } else
            line.dotLabel.style.left = pos + "px";

          for (var l = 0; l < g.lines.length; l++)
            g.lines[l].dotLabel.style.zIndex = (g.lines[l] == line) ? 1000 : 100;
        }
        return cancelEvent(ev);
      },
      chideLabel: function(ev) {
        var g = ev.currentTarget.graph, line = ev.currentTarget.line,
          locX = ev.pageX - (getXY(line.dot)[0] + line.dotLabel.pos);
        if (locX < 0 || locX > line.dotLabel.w)
          g.hideLabel(ev);
      },
      hideLabel: function(ev) {
        var g = ev.currentTarget.graph, line = ev.currentTarget.line, dot = line.dotLabel.dot, pos = line.dotLabel.pos;
        line.dotLabel.innerHTML = dot.l ? dot.l : formatValue(dot.y) + g.params.yunits;
        line.dotLabel.style.left = pos + "px";
      },
      selectLine: function(ev) {
        var g = ev.currentTarget.graph, line = ev.currentTarget.line;
        g.activeLine = line;
        g.redrawWindow();
        g.showDots(ev);
        return cancelEvent(ev);
      },
      deselectLine: function(ev) {
        this.activeLine = null;
        this.redrawWindow();
        this.showDots(ev);
        return cancelEvent(ev);
      },
      showDotTT: function(lineIndex) {
        if (!this.smoothLines) {
          return;
        }
        if (this.ttLine != lineIndex && window.tooltips) {
          tooltips.hide(this.mainLayout, {fasthide: 1});
        }

        var line = this.lines[lineIndex], dot = line.dotLabel.dot;
        var text = '';
        if (line.l) {
          text += langNumeric(dot.y, line.l, true);
        } else {
          text += (dot.l ? dot.l : formatValue(dot.y)) + this.params.yunits + ' &ndash; ' + line.name;
        }
        text += '<br/><span style="font-weight: normal; font-size: 0.9em;">' + fullDate(dot.x, this.params) + '</span>';

        for (var l = 0; l < this.lines.length; l++) {
          hide(this.lines[l].dot);
        }
        this.showTT(line.dot.posX + 1, line.dot.posY - 5, text);
        this.ttLine = lineIndex;

        var ctx = getContext(this.dotsLayer);
        ctx.strokeStyle = line.hexColor;
        ctx.globalAlpha = 0.3;
        lineWidth(ctx, 4);
        ctx.beginPath();
        arc(ctx, line.dot.posX, line.dot.posY, 6.5, 0, Math.PI*2, true);
        ctx.stroke();
        ctx.globalAlpha = 1;
      },
      showTT: function(dotX, dotY, text) {
        var xy = getXY(this.zinLayout, true);

        xy[0] = Math.floor(xy[0] + dotX + (bodyNode.scrollLeft || window.scrollX || 0) + (this.params.bar_chart ? this.barsWidth / 2 : 0) - 9);
        xy[1] = Math.floor(xy[1] + dotY + (bodyNode.scrollTop || window.scrollY || 0));

        if (
          this.mainLayout.tt &&
          this.mainLayout.tt.container &&
          (!isVisible(this.mainLayout.tt.container) || this.dotLabelXY !== (this.dotLabelXY = xy.join(' ')))
        ) {
          geByClass1('tt_text', this.mainLayout.tt.container).innerHTML = text;
          if (window.tooltips) {
            tooltips.hide(this.mainLayout, {fasthide: 1});
            tooltips.show(this.mainLayout, {forcexy: xy});
          }
        }
      },
      onClickMenu: function(ev) {
        var g = ev.data.graph;
        for (var i in g.menu.children) {
          if (g.menu.children[i].nodeType != 1) continue;

          if (i == ev.data.clickNode) {
            addClass(g.menu.children[i], 'graph_menu_item_sel');
            if (!ev.data.alt_graph) {
              g.loadGraph(i);
              if (isVisible(g.graphDiv.id.replace(/_graph$/, '') + '_alt_graph')) {
                hide(g.graphDiv.id.replace(/_graph$/, '') + '_alt_graph');
                for (i in g.mainLayout.children) {
                  if (g.mainLayout.children[i].nodeType == 1 && g.mainLayout.children[i].mh) {
                    show(g.mainLayout.children[i]);
                  }
                }
                g.mainLayout.style.width = g.viewWidth + "px";
                show(g.vScale);
              }
            } else {
              hide(g.vScale);
              for (i in g.mainLayout.children) {
                if (g.mainLayout.children[i].nodeType != 1 || g.mainLayout.children[i] == g.menu || !isVisible(g.mainLayout.children[i])) continue;
                g.mainLayout.children[i].mh = 1;
                hide(g.mainLayout.children[i]);
              }
              g.mainLayout.style.width = g.viewWidth + g.scaleWidth + "px";
              show(g.graphDiv.id.replace(/_graph$/, '') + '_alt_graph');
            }
          } else {
            removeClass(g.menu.children[i], 'graph_menu_item_sel');
          }
        }
        cancelEvent(ev);
      },

      // some lines were shown or hidden
      updateLines: function() {
        this.redrawWindow();
        // redraw zoutView
        var ctx = getContext(this.zoutView);
        clearRect(ctx, 0, 0, this.viewWidth, 40);
        if (this.isNegative)
          drawLines(ctx, 0, 4, this.viewWidth, 32, this.lines, this.minTime, this.maxTime, this.xfactorOut, this.yfactorOut, -this.localBottom, true, null, false);
        else
          drawLines(ctx, 0, 4, this.viewWidth, 36, this.lines, this.minTime, this.maxTime, this.xfactorOut, this.yfactorOut, 0, true, null, false);
      },

      // window borders were moved
      redrawWindow: function() {
        // move window
        this.xfactorOut = this.viewWidth / (this.maxTime - this.minTime);
        this.xfactorIn = this.viewWidth / (this.rightTime - this.leftTime);
        var leftOut = Math.round((this.leftTime - this.minTime) * this.xfactorOut),
          rightOut = Math.round((this.rightTime - this.minTime) * this.xfactorOut) - 1;
        leftOut = Math.min(leftOut, this.viewWidth - 4);
        rightOut = Math.max(leftOut + 1, rightOut);

        setStyle(this.lMask, {
          width: leftOut + "px",
          display: (leftOut > 0 ? "block" : "none")});
        setStyle(this.zoutWindow, {
          left: leftOut + "px",
          width: (rightOut - leftOut - 1) + "px"});
        setStyle(this.rMask, {
          left: (rightOut + 1) + "px",
          width: (this.viewWidth - rightOut - 2) + "px",
          display: (this.viewWidth - rightOut - 2 > 0 ? "block" : "none")});

        this.lHandle.style.left = Math.max(0, leftOut - 4) + "px";
        this.rHandle.style.left = Math.min(this.viewWidth - 8, rightOut - 4) + "px";

        // get visible data
        var localMax = (this.adjust ? -1e9 : 0), localMin = (this.adjust ? 1e9 : 0), outMax = 0, outMin = 0, dotsVisible = 0;
        this.localLeft = this.rightTime;
        this.localRight = this.leftTime;
        for (var l = 0; l < this.lines.length; l++) {
          var line = this.lines[l];
          if (line.shown) {
            var stIdx = 0, enIdx = line.d.length - 1, ps = line.d;
            while ((stIdx < ps.length - 1) && (ps[stIdx + 1].x < this.leftTime)) stIdx++;
            while ((enIdx > 1) && (ps[enIdx - 1].x > this.rightTime)) enIdx--;
            line.stIdx = stIdx;
            line.enIdx = enIdx;
            if (enIdx >= stIdx && (ps[enIdx].x >= this.leftTime) && (ps[stIdx].x <= this.rightTime)) {
              for (var i = stIdx; i <= enIdx; i++) {
                localMax = Math.max(localMax, ps[i].y);
                localMin = Math.min(localMin, ps[i].y);
                this.localLeft = Math.min(this.localLeft, ps[i].x);
                this.localRight = Math.max(this.localRight, ps[i].x);
              }
              dotsVisible = Math.max(dotsVisible, enIdx - stIdx);
            }

            outMax = Math.max(outMax, line.maxValue);
            outMin = Math.min(outMax, line.minValue);
          }
        }

        if (this.lines.length == 0 || (localMax - localMin < 1e-6)) {
          this.isNegative = false;
          this.ystep = 1;
          this.localTop = 5;
          this.localBottom = 0;
        } else {
          this.isNegative = (localMin < -1e-6);
          this.ystep = Math.max(getYStep(localMax - (this.adjust ? localMin : 0), this.params.int_scale), this.isNegative ? getYStep(-localMin, this.params.int_scale) : 1e-6);
          this.localTop = (Math.ceil(localMax / this.ystep)) * this.ystep;
          this.localBottom = -(Math.ceil(- localMin / this.ystep)) * this.ystep;
        }
        this.yfactorIn = (this.viewHeight - (this.isNegative ? 43 : 34)) / (this.localTop - this.localBottom);
        this.yfactorOut = this.minValue < -1e-6 ? (32 / (outMax - outMin)): (36 / outMax);
        this.smoothLines = dotsVisible < 30 ? true : false;

        // update title
        var params = {};
        if (this.XSTEP >= MONTH) {
          params.only_month = true;
        }
        this.title.innerHTML = fullDate(this.localLeft, params) + (this.localRight > this.localLeft ? ' &ndash; ' + fullDate(this.localRight, params) : '');

        // redraw zinView
        var ctx = getContext(this.zinView);
        var ctxS = getContext(this.vScaleView);
        clearRect(ctx, 0, 0, this.viewWidth, this.viewHeight);
        ctx.fillStyle = '#fafafa';
        fillRect(ctx, 0, 9, this.viewWidth, this.viewHeight - 9);
        clearRect(ctxS, 0, 0, this.scaleWidth, this.viewHeight);

        // y scale
        lineWidth(ctx, 1);
        ctx.strokeStyle = '#e6eaf0';
        ctxS.font = getFont(11);
        ctxS.fillStyle = '#36638e';
        ctxS.textAlign = 'right';
        ctxS.textBaseline = 'middle';
        for (var gridY = this.localBottom; gridY < this.localTop + this.ystep; gridY += this.ystep) {
          var cy = this.viewHeight - 24.5 - Math.round((gridY - this.localBottom) * this.yfactorIn) - (this.isNegative ? 9 : 0);
          if (gridY < this.localTop) {
            ctx.strokeStyle = (this.isNegative && Math.abs(gridY) < 1e-8) ? '#9fb1c4' : '#e6eaf0';
            ctx.beginPath();
            moveTo(ctx, 0, cy);
            lineTo(ctx, this.viewWidth, cy);
            ctx.stroke();
          }
          fillText(ctxS, formatValue(gridY) + this.params.yunits, (this.scaleWidth - 6), cy);
        }

        // x scale
        ctx.fillStyle = '#ffffff';
        fillRect(ctx, 0, this.viewHeight - 25, this.viewWidth, 25);

        ctx.fillStyle = '#36638e';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        var fin = false;
        var i_start = this.params.show_time || this.params.show_minutes ? 0 : 6;
        for (var i = i_start; (i < 100) && !fin; i++) {
          if (i < xscales.length) {
            var sc = xscales[i];
          } else {
            var yearCnt = [2, 5, 10][(i - xscales.length + 1) % 3] * Math.pow(10, Math.floor((i - xscales.length + 1) / 3));
            var sc = {base: yearCnt * YEAR, format: ['yearFull'], sub: Math.max(1, yearCnt / 10) * YEAR};
          }

          var baseWidth = sc.base * this.xfactorIn;
          for (var j = 0; j < sc.format.length; j++) {
            ctx.font = getFont(11, true);
            var formatWidth = ctx.measureText(formatDate(-1, sc.format[j])).width;
            if (formatWidth < baseWidth) {
              var sTm = incDate(this.leftTime, sc.base, -2);
              var eTm = incDate(this.rightTime, sc.base, 2);
              ctx.strokeStyle = '#e6eaf0';
              if (sc.sub != -1)
                for (var tm = sTm; tm <= eTm; tm = incDate(tm, sc.sub, 1)) {
                  var ax = Math.floor((tm - this.leftTime) * this.xfactorIn) + 0.5;
                  ctx.beginPath();
                  moveTo(ctx, ax, this.viewHeight - 24);
                  lineTo(ctx, ax, this.viewHeight - 22);
                  ctx.stroke();
                }
              for (var tm = sTm; tm <= eTm; tm = incDate(tm, sc.base, 1)) {
                if (incDate(tm, sc.base, 1) < tm + HOUR)
                  throw "Erroneous date increase";
                var ax = Math.floor((tm - this.leftTime) * this.xfactorIn) + 0.5;
                //ctx.strokeStyle = '#e6eaf0';
                ctx.beginPath();
                moveTo(ctx, ax, 9);
                lineTo(ctx, ax, this.viewHeight - 24);
                ctx.stroke();
                //ctx.strokeStyle = '#9fb1c4';
                ctx.beginPath();
                moveTo(ctx, ax, this.viewHeight - 24);
                if (sc.sub == -1)
                  lineTo(ctx, ax, this.viewHeight);
                else
                  lineTo(ctx, ax, this.viewHeight - 20);
                ctx.stroke();
                var textpos = ax;
                if (sc.sub == -1)
                  textpos += (baseWidth / 2.0);
                if (textpos - formatWidth / 2.0 > 0 && textpos + formatWidth / 2.0 < this.viewWidth) {
                  ctx.font = getFont(11);
                  fillText(ctx, replaceEntities(formatDate(tm, sc.format[j])), textpos, this.viewHeight - 19);
                }
              }

              fin = true;
              break;
            }
          }
          if (fin) break;
        }

        ctx.strokeStyle = '#e6eaf0';
        lineWidth(ctx, 1);
        strokeRect(ctx, 0, this.viewHeight - 24.5, this.viewWidth - 1, 26);
        ctx.strokeStyle = '#f0f2f5';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        moveTo(ctx, 1, this.viewHeight - 25.5);
        lineTo(ctx, this.viewWidth, this.viewHeight - 25.5);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // graph
        if (this.isNegative)
          drawLines(ctx, 0, 9, this.viewWidth, this.viewHeight - 43, this.lines, this.leftTime, this.rightTime, this.xfactorIn, this.yfactorIn, -this.localBottom, false, this.activeLine, this.smoothLines);
        else
          drawLines(ctx, 0, 9, this.viewWidth, this.viewHeight - 34, this.lines, this.leftTime, this.rightTime, this.xfactorIn, this.yfactorIn, this.adjust ? -this.localBottom : 0, false, this.activeLine, this.smoothLines);

        ctx.strokeStyle = '#b8c5d4';
        ctx.beginPath();
        moveTo(ctx, 0, 9);
        lineTo(ctx, 0, this.viewHeight + 0.5);
        if (!isVisible(this.zoutLayout)) {
          lineTo(ctx, this.viewWidth, this.viewHeight + 0.5);
        }
        ctx.stroke();
      },
      destroyDots: function(data) {
        for (var l = 0; l < this.lines.length; l++) {
          var line = this.lines[l];
          removeEventEx(line.dotLabel, 'mouseover', this.expandLabel);
          removeEventEx(line.dotLabel, 'mousemove', this.chideLabel);
          removeEventEx(line.dotLabel, 'mouseout', this.hideLabel);
          removeEventEx(line.dot, 'click', this.selectLine);
          removeEventEx(line.legend, 'mouseover', this.overLegend);
          removeEventEx(line.legend, 'mouseout', this.outLegend);
          removeEventEx(line.legend, 'click', this.toggleLegend);
          removeEventEx(line.legend, 'dblclick', this.chooseLegend);
          if ('legendDownloadCSV' in line) {
            removeEventEx(line.legendDownloadCSV, 'click', this.downloadCSV);
          }
          if (line.dot) {
            this.zinLayout.removeChild(line.dot);
          }
          if (line.legend.parentNode) {
            line.legend.parentNode.removeChild(line.legend);
          }
          removeData(line.dotLabel);
          removeData(line.dot);
          removeData(line.legend);
        }
      },
      initLoadedData: function(text) {
        var _t = this;
        this.message.innerHTML = cur.graphVars['lang.data_empty'];
        setStyle(this.message, {
          display: 'none',
          backgroundColor: '#eeeeee',
          border: '1px solid #5f7d9d'});
        try {
          var d = eval(text);
          _t.loadGraph = function(index) {
            _t.setData(d[index] || [], isArray(_t.params.adjust) ? _t.params.adjust[index] : _t.params.adjust);
          }
          _t.noData = (d.length == 0 || (d.length == 1 && d[0].length == 0));
          _t.setData(_t.params.multiple ? d[0] : d, isArray(_t.params.adjust) ? _t.params.adjust[0] : _t.params.adjust);
        } catch(e){
          _t.setData([], false);
        }
      },
      setData: function(data, adjust) {
        var _t = this;
        if (typeof(data) == 'string') {
          this.zoutLayout.style.display = 'none';
          this.vScale.style.display = 'none';
          this.title.style.display = 'none';
          //this.message.innerHTML = cur.graphVars['lang.loading'];
          this.message.innerHTML = '<img src="/images/progress7.gif" />';
          setStyle(this.message, {
            display: 'block',
            backgroundColor: 'transparent',
            border: 'none',
            left: Math.round((this.viewWidth - 149) / 2) + 'px',
            top: Math.round((this.viewHeight - 8) / 2) + 'px'});
          if (window.ajax) {
            ajax.post(data, {html5: 1}, {onDone: function(text) {
                _t.initLoadedData(text);
              }});
          } else {
            Ajax.Post({url:data.split('%26').join('&'), query: {html5: 1}, onDone: function(res, text) {
                _t.initLoadedData(text);
              }});
          }
          return;
        }

        if (this.params.bar_chart) {
          this.setBarChartData(data, adjust);
          return;
        }

        if (this.lines.length == data.length) {
          var showOverride = [];
          for (var l = 0; l < this.lines.length; l++)
            if (this.lines[l].name.toLowerCase() != data[l].name.toLowerCase()) {
              showOverride = null;
              break;
            } else
              showOverride[l] = this.lines[l].shown;
        }

        // remove old lines
        this.destroyDots();
        this.adjust = adjust;
        this.minValue = 100;
        this.maxValue = 1;
        this.minAbsValue = 1.0;
        this.minTime = 2147483647;
        this.maxTime = 0;
        // prepare lines
        this.lines = [];
        var maxDotsCount = 0;
        var max_coltext = [0, 0];
        var dotsVisible = 0;

        this.MAXSCALE = 2 * DAY + HOUR;
        this.XSTEP = DAY;
        for (var l = 0; l < data.length; l++) {
          var line = extend({a: true}, data[l]);
          if (!line.d || !line.d.length) {
            continue;
          }
          if ((!line.c || 1) && !line['no_legend']) {
            line.c = colors[l % colors.length];
          }
          var r = (line.c & 0xFF0000) >> 16;
          var g = (line.c & 0x00FF00) >> 8;
          var b = (line.c & 0x0000FF);
          r = Math.min(255, (r >> 2) + 192);
          g = Math.min(255, (g >> 2) + 192);
          b = Math.min(255, (b >> 2) + 192);
          line.c2 = (r << 16) | (g << 8) | (b);
          line.hexColor = line.c.toString(16);
          line.hexColor = '#' + '000000'.substr(0, 6 - line.hexColor.length) + line.hexColor;
          line.hexColor2 = line.c2.toString(16);
          line.hexColor2 = '#' + '000000'.substr(0, 6 - line.hexColor.length) + line.hexColor2;
          line.minValue = 100;
          line.maxValue = 1;

          // make dot
          line.dot = ce('div', {
            innerHTML: '<div style="color: white;\
            -webkit-border-radius: 2px; -khtml-border-radius: 2px; -moz-border-radius: 2px; border-radius: 2px;\
            background-color: ' + line.hexColor + '; position: absolute; padding: 2px 3px 3px 3px; white-space: nowrap; cursor: default;"></div>'
          }, {
            position: 'absolute',
            display: 'none'
          });
          line.dotLabel = line.dot.children[0];
          this.zinLayout.appendChild(line.dot);

          addEventEx(this, line.dotLabel, 'mouseover', this.expandLabel);
          addEventEx(this, line.dotLabel, 'mousemove', this.chideLabel);
          addEventEx(this, line.dotLabel, 'mouseout', this.hideLabel);
          addEventEx(this, line.dotLabel, 'mousedown', cancelEvent);
          //addEventEx(this, line.dotLabel, 'click', this.selectLine);
          //addEventEx(this, line.dot, 'click', this.selectLine);
          line.dotLabel.line = line;
          line.dot.line = line;

          // make legend
          var col_width = Math.floor(this.viewWidth / 2);

          // Download CSV now only works with line chart
          var legendDownloadCSVBox = this.params.download_csv ? '<div style="position: absolute; top: 0px; left: 0px; padding: 2px 3px; white-space: nowrap; display: none;">.csv</div>' : '';
          line.legend = ce('div', {
            innerHTML: '<canvas width="' + (20 * cs) + '" height="' + (20 * cs) + '" style="vertical-align: middle; padding-right: 2px; width: 20px; height: 20px;"></canvas>' +
            '<span title="' + clean(line.name) + '">' + ((line.name.length >= 30) ? line.name.substr(0, 27) + '...' : line.name)  + '</span>' +
            '<div style="position: absolute; top: 0px; left: 0px; padding: 2px 3px; white-space: nowrap; display: none; background: ' + line.hexColor + '; color: white; -webkit-border-radius: 2px; -khtml-border-radius: 2px; -moz-border-radius: 2px; border-radius: 2px;"></div>' +
            legendDownloadCSVBox
          }, {
            color: line.hexColor,
            position: 'relative',
            cursor: 'pointer'
          });
          if (line['no_legend']) {
            line.legend.style.display = 'none';
          }
          line.shown = showOverride ? showOverride[l] : line.a;
          line.legendCheck = line.legend.children[0];
          drawCheck(line.legendCheck, line.hexColor, line.hexColor2, line.shown, false);
          line.legendBox = line.legend.children[2];
          addEventEx(this, line.legend, 'mouseover', this.overLegend);
          addEventEx(this, line.legend, 'mouseout', this.outLegend);
          addEventEx(this, line.legend, 'click', this.toggleLegend);
          addEventEx(this, line.legend, 'dblclick', this.chooseLegend);
          if (this.params.download_csv) {
            line.legendDownloadCSV = line.legend.children[3];
            addEventEx(this, line.legendDownloadCSV, 'click', this.downloadCSV);
            line.legendDownloadCSV.line = line;
          }

          line.legend.line = line;

          for (var i = 0; i < line.d.length; i++) {
            line.d[i].x = parseInt(line.d[i].x || line.d[i]["0"] || DEF_TIME);
            line.d[i].y = parseFloat(line.d[i].y || line.d[i]["1"] || 0);
            line.d[i].s = line.d[i].s || line.d[i]["2"] || null;
            line.d[i].l = line.d[i].l || line.d[i]["3"] || null;
            line.maxValue = Math.max(line.maxValue, line.d[i].y);
            line.minValue = Math.min(line.minValue, line.d[i].y);
            this.maxValue = Math.max(this.maxValue, line.d[i].y);
            this.minValue = Math.min(this.minValue, line.d[i].y);
            this.minAbsValue = Math.min(this.minAbsValue, Math.abs(line.d[i].y));
            this.maxTime = Math.max(this.maxTime, line.d[i].x);
            this.minTime = Math.min(this.minTime, line.d[i].x);
            if (i > 0 && i < 10 && Math.abs(line.d[i].x - line.d[i - 1].x) > 1) {
              this.MAXSCALE = Math.min(this.MAXSCALE, 2.5 * Math.abs(line.d[i].x - line.d[i - 1].x));
              this.XSTEP = (this.XSTEP + Math.abs(line.d[i].x - line.d[i - 1].x)) / 2;
            }
            if (this.leftTime != -1 && line.d[i].x >= this.leftTime && line.d[i].x <= this.rightTime) {
              dotsVisible++;
            }
          }
          maxDotsCount = Math.max(maxDotsCount, line.d.length);

          // probably not needed
          line.d.sort(function(l1, l2) {
            return (l1.x - l2.x);
          });
          this.lines.push(line);
        }
        for (var i = 0; i < this.lines.length; i++) {
          var line = this.lines[i];
          if (i < this.lines.length / 2) {
            this.column[0].appendChild(line.legend);
            max_coltext[0] = Math.max(max_coltext[0], getSize(line.legend.children[1])[0]);
          } else {
            this.column[1].appendChild(line.legend);
            max_coltext[1] = Math.max(max_coltext[1], getSize(line.legend.children[1])[0]);
          }
        }
        for (var i = 0; i < this.lines.length; i++) {
          if (i < this.lines.length / 2) {
            this.lines[i].legendBox.style.left = (max_coltext[0] + 40) + 'px';
            if ('legendDownloadCSV' in this.lines[i])
              this.lines[i].legendDownloadCSV.style.left = (max_coltext[0] + 40) + 'px';
          } else {
            this.lines[i].legendBox.style.left = (max_coltext[1] + 40) + 'px';
            if ('legendDownloadCSV' in this.lines[i])
              this.lines[i].legendDownloadCSV.style.left = (max_coltext[1] + 40) + 'px';
          }
        }

        var noData = this.noData || (this.lines.length == 0 && !this.params.multiple);

        this.zoutLayout.style.display = noData ? 'none' : 'block';
        this.vScale.style.display = noData ? 'none' : 'block';;
        if (noData || this.params.no_title) {
          this.title.style.opacity = 0;
        } else {
          this.title.style.display = 'block';
        }

        if (this.lines.length == 0) {
          this.maxTime = incDate(DEF_TIME, DAY, 0);
          this.minTime = this.maxTime - 7 * DAY;
        } else {
          this.maxTime += this.XSTEP / 5;
        }
        if (this.params.no_zoom) {
          this.leftTime = this.minTime;
          this.rightTime = this.maxTime;
          this.allowZoom(false);
        } else {
          if (this.maxTime - this.minTime < 4 * DAY && maxDotsCount < 10) {
            this.minTime -= 2 * DAY;
            this.maxTime += 2 * DAY;
            this.allowZoom(false);
          } else {
            this.allowZoom(true);
          }
          this.showEmpty(noData);

          if (this.leftTime == -1 || dotsVisible < 10) {
            var st = 10 * DAY;
            if (this.XSTEP > 3 * MONTH) {
              st = 2 * YEAR;
            } else if (this.XSTEP > 10 * DAY) {
              st = 3 * MONTH;
            }
            this.leftTime = (this.params.show_all || maxDotsCount < 10) ? this.minTime : Math.max(this.minTime, this.maxTime - st);
            this.rightTime = this.maxTime;
          } else {
            this.leftTime = Math.max(this.minTime, Math.min(this.maxTime, this.leftTime));
            this.rightTime = Math.max(this.minTime, Math.min(this.maxTime, this.rightTime));
          }
        }

        var ctx = getContext(this.vScaleView);
        ctx.font = getFont(11, true);

        var maxWidth = Math.max(
          ctx.measureText(formatValue(this.maxValue + getYStep(this.maxValue, this.params.int_scale))).width,
          Math.max(  ctx.measureText(formatValue(getYStep(this.minAbsValue, this.params.int_scale))).width,
            ctx.measureText(formatValue(this.minValue)).width));
        this.scaleWidth = (this.lines.length == 0) ? 0 : (maxWidth + 25);
        this.scaleWidth = Math.floor(this.scaleWidth);
        this.vScale.style.width = this.scaleWidth + "px";
        this.vScale.style.height = this.height + "px";
        cWidth(this.vScaleView, this.scaleWidth);
        cHeight(this.vScaleView, this.height);
        this.vScaleView.style.width = this.scaleWidth + "px";
        this.vScaleView.style.height = this.height + "px";
        this.viewWidth = (this.width - this.scaleWidth);

        this.mainLayout.style.width = this.viewWidth + "px";
        cWidth(this.zinView, this.viewWidth);
        cWidth(this.dotsLayer, this.viewWidth);
        cWidth(this.zoutView, this.viewWidth);
        this.column[0].style.width = Math.floor(this.viewWidth / 2) + "px";
        this.column[1].style.width = Math.floor(this.viewWidth / 2) + "px";

        this.activeLine = null;

        clearRect(ctx, 0, 0, 1, 1); // fix for  weird chrome font rendering bug
        setTimeout(this.updateLines.bind(this), 0);
      },
      setBarChartData: function(data, adjust) {
        // remove old lines
        this.destroyDots();
        this.adjust = adjust;
        this.minValue = 100;
        this.maxValue = 1;
        this.minAbsValue = 1.0;
        // prepare lines
        this.lines = [];
        var max_coltext = [0, 0];

        for (var l = 0; l < data.length; l++) {
          var line = extend({a: true}, data[l]);
          if (!line.d || !line.d.length) {
            continue;
          }
          if (!line.c) {
            var colors_row = l % 4;
            colors_row = colors_row == 1 ? 3 : colors_row;
            line.c = colors[(colors_row * 8 + Math.floor(l / 4)) % colors.length];
          }
          var r = (line.c & 0xFF0000) >> 16;
          var g = (line.c & 0x00FF00) >> 8;
          var b = (line.c & 0x0000FF);
          r2 = Math.min(255, (r >> 2) + 192);
          g2 = Math.min(255, (g >> 2) + 192);
          b2 = Math.min(255, (b >> 2) + 192);
          line.c2 = (r2 << 16) | (g2 << 8) | (b2);
          r3 = Math.min(255, r - 16);
          g3 = Math.min(255, g - 16);
          b3 = Math.min(255, b - 16);
          line.c3 = (r3 << 16) | (g3 << 8) | (b3);
          line.hexColor = line.c.toString(16);
          line.hexColor = '#' + '000000'.substr(0, 6 - line.hexColor.length) + line.hexColor;
          line.hexColor2 = line.c2.toString(16);
          line.hexColor2 = '#' + '000000'.substr(0, 6 - line.hexColor2.length) + line.hexColor2;
          line.hexColor3 = line.c3.toString(16);
          line.hexColor3 = '#' + '000000'.substr(0, 6 - line.hexColor3.length) + line.hexColor3;
          line.minValue = 100;
          line.maxValue = 1;

          // make legend
          line.legend = ce('div', {
            innerHTML: '<canvas width="' + (20 * cs) + '" height="' + (20 * cs) + '" style="vertical-align: middle; padding-right: 2px; width: 20px; height: 20px;"></canvas>' +
            '<span style="font-weight: bold;">' + ((line.name.length >= 30) ? line.name.substr(0, 27) + '...' : line.name)  + '</span>' +
            '<div style="position: absolute; top: 0px; left: 0px; padding: 2px 3px; white-space: nowrap; display: none; background: ' + line.hexColor2 + '; -webkit-border-radius: 2px; -khtml-border-radius: 2px; -moz-border-radius: 2px; border-radius: 2px;"></div>'
          }, {
            color: line.hexColor,
            position: 'relative',
            cursor: 'default',
            paddingLeft: '10px'
          });
          line.shown = true;
          line.legendCheck = line.legend.children[0];
          line.legendBox = line.legend.children[2];
          var ctx = getContext(line.legendCheck);
          ctx.fillStyle = ctx.strokeStyle = line.hexColor;
          lineWidth(ctx, 4);
          ctx.lineJoin = 'round';
          strokeRect(ctx, 4, 5, 9, 9);
          fillRect(ctx, 4, 5, 9, 9);

          if (line.sum) {
            line.legendBox.innerHTML = formatValue(line.sum) + this.params.yunits;
            show(line.legendBox);
          }

          for (var i = 0; i < line.d.length; i++) {
            line.d[i].x = line.d[i].x || line.d[i]["0"] || i;
            line.d[i].y = parseFloat(line.d[i].y || line.d[i]["1"] || 0);
            line.d[i].s = line.d[i].s || line.d[i]["2"] || null;
            line.d[i].l = line.d[i].l || line.d[i]["3"] || null;
            line.maxValue = Math.max(line.maxValue, line.d[i].y);
            line.minValue = Math.min(line.minValue, line.d[i].y);
            this.maxValue = Math.max(this.maxValue, line.d[i].y);
            this.minValue = Math.min(this.minValue, line.d[i].y);
            this.minAbsValue = Math.min(this.minAbsValue, Math.abs(line.d[i].y));
          }
          line.stInd = 0;
          line.enIdx = line.d.length;

          this.lines.push(line);
        }
        for (var i = 0; i < this.lines.length; i++) {
          var line = this.lines[i];
          if (i < this.lines.length / 2) {
            this.column[0].appendChild(line.legend);
            max_coltext[0] = Math.max(max_coltext[0], getSize(line.legend.children[1])[0]);
          } else {
            this.column[1].appendChild(line.legend);
            max_coltext[1] = Math.max(max_coltext[1], getSize(line.legend.children[1])[0]);
          }
        }
        for (var i = 0; i < this.lines.length; i++) {
          var line = this.lines[i];
          if (i < this.lines.length / 2) {
            line.legendBox.style.left = (max_coltext[0] + 40) + 'px';
          } else {
            line.legendBox.style.left = (max_coltext[1] + 40) + 'px';
          }
        }

        var noData = this.noData || (this.lines.length == 0 && !this.params.multiple);

        this.zoutLayout.style.display = noData ? 'none' : 'block';
        this.vScale.style.display = noData ? 'none' : 'block';;
        this.showEmpty(noData);

        this.zoutLayout.style.display = 'none';
        this.title.style.display = 'none';
        this.vScaleView.style.paddingTop = 0;
        this.viewHeight = this.height - 24;
        this.zinLayout.style.height = this.viewHeight + "px";
        cHeight(this.zinView, this.viewHeight);
        cHeight(this.dotsLayer, this.viewHeight - 25);
        this.disable_zoom = true;
        if (this.params.multiple && this.menu.parentNode == this.mainLayout) {
          var menu = re(this.menu);
          setStyle(menu, {position: 'absolute', right: '10px', top: '20px', zIndex: 100});
          this.zinLayout.insertBefore(menu, this.zinView);
        }

        var ctx = getContext(this.vScaleView);
        ctx.font = getFont(11, true);
        var yUnits = this.params.yunits ? this.params.yunits : '';
        var maxWidth = Math.max(
          ctx.measureText(formatValue(this.maxValue + getYStep(this.maxValue, this.params.int_scale) + yUnits)).width,
          ctx.measureText(formatValue(getYStep(this.minAbsValue, this.params.int_scale) + yUnits)).width);
        this.scaleWidth = (this.lines.length == 0) ? 0 : (maxWidth + 32);
        this.scaleWidth = Math.floor(this.scaleWidth);
        this.vScale.style.width = this.scaleWidth + "px";
        this.vScale.style.height = this.height + "px";
        cWidth(this.vScaleView, this.scaleWidth);
        cHeight(this.vScaleView, this.height);
        this.vScaleView.style.width = this.scaleWidth + "px";
        this.vScaleView.style.height = this.height + "px";
        this.viewWidth = (this.width - this.scaleWidth);

        this.mainLayout.style.width = this.viewWidth + "px";
        cWidth(this.zinView, this.viewWidth);
        cWidth(this.dotsLayer, this.viewWidth);
        this.column[0].style.width = Math.floor(this.viewWidth / 2) + "px";
        this.column[1].style.width = Math.floor(this.viewWidth / 2) + "px";

        this.xstep = Math.floor(this.viewWidth / this.params.bar_chart.length);
        this.barsWidth = Math.floor(this.xstep / (this.lines.length + 1));
        this.barsWidth = Math.min(this.barsWidth, 25);

        // draw window
        if (this.lines.length == 0 || (this.maxValue - this.minValue < 1e-6)) {
          this.isNegative = false;
          this.ystep = 1;
          this.localTop = 5;
          this.localBottom = 0;
        } else {
          this.isNegative = (this.minValue < -1e-6);
          this.ystep = Math.max(getYStep(this.maxValue - (adjust ? this.minValue : 0), this.params.int_scale), this.isNegative ? getYStep(-this.minValue, this.params.int_scale) : 1e-6);
          this.localTop = (Math.ceil(this.maxValue / this.ystep)) * this.ystep;
          this.localBottom = 0;
        }
        this.yfactorIn = (this.viewHeight - (this.isNegative ? 43 : 34)) / (this.localTop - this.localBottom);
        this.xfactorIn = 1;

        // redraw zinView
        var ctx = getContext(this.zinView);
        var ctxS = getContext(this.vScaleView);
        clearRect(ctx, 0, 0, this.viewWidth, this.viewHeight);
        ctx.fillStyle = '#fafafa';
        fillRect(ctx, 0, 9, this.viewWidth, this.viewHeight - 9);
        clearRect(ctxS, 0, 0, this.scaleWidth, this.viewHeight);

        // y scale
        lineWidth(ctx, 1);
        ctx.strokeStyle = '#e6eaf0';
        ctxS.font = getFont(11);
        ctxS.fillStyle = '#36638e';
        ctxS.textAlign = 'right';
        ctxS.textBaseline = 'middle';
        for (var gridY = this.localBottom; gridY < this.localTop + this.ystep; gridY += this.ystep) {
          var cy = this.viewHeight - 24.5 - Math.round((gridY - this.localBottom) * this.yfactorIn) - (this.isNegative ? 9 : 0);
          if (gridY < this.localTop) {
            ctx.strokeStyle = (this.isNegative && Math.abs(gridY) < 1e-8) ? '#9fb1c4' : '#e6eaf0';
            ctx.beginPath();
            moveTo(ctx, 0, cy);
            lineTo(ctx, this.viewWidth, cy);
            ctx.stroke();
          }
        }
        setTimeout(function() { // fix for  weird chrome font rendering bug
          for (var gridY = this.localBottom; gridY < this.localTop + this.ystep; gridY += this.ystep) {
            var cy = this.viewHeight - 24.5 - Math.round((gridY - this.localBottom) * this.yfactorIn) - (this.isNegative ? 9 : 0);
            fillText(ctxS, formatValue(gridY) + yUnits, (this.scaleWidth - 6), cy);
          }
        }.bind(this), 0);

        // x scale
        ctx.fillStyle = '#e9ecf0';
        fillRect(ctx, 0, this.viewHeight - 25, this.viewWidth, 25);

        ctx.fillStyle = '#36638e';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        var fontSize = 11;
        ctx.font = getFont(fontSize, true);
        for (var i = 0; i < this.params.bar_chart.length; i++) {
          while (ctx.measureText(this.params.bar_chart[i]).width > this.xstep && fontSize >= 8) {
            fontSize--;
            ctx.font = getFont(fontSize, true);
          }
        }
        ctx.font = getFont(fontSize);

        for (var i = 0; i < this.params.bar_chart.length; i++) {
          var text = this.params.bar_chart[i];
          var textpos = this.xstep * (i + 0.5);
          fillText(ctx, replaceEntities(text), textpos, this.viewHeight - 19);
        }

        // graph
        if (this.isNegative)
          drawBars(ctx, 0, 9, this.viewWidth, this.viewHeight - 43, this.lines, this.params.bar_chart, this.barsWidth, this.xstep, this.yfactorIn, -this.localBottom);
        else
          drawBars(ctx, 0, 9, this.viewWidth, this.viewHeight - 34, this.lines, this.params.bar_chart, this.barsWidth, this.xstep, this.yfactorIn, this.adjust ? -this.localBottom : 0);

        ctx.strokeStyle = '#b8c5d4';
        lineWidth(ctx, 1);
        ctx.beginPath();
        moveTo(ctx, 0.5, 9);
        lineTo(ctx, 0.5, this.viewHeight);
        lineTo(ctx, this.viewWidth, this.viewHeight);
        ctx.stroke();

        ctx.strokeStyle = '#6b93b5';
        lineWidth(ctx, 2);
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        moveTo(ctx, 1, this.viewHeight - 26);
        lineTo(ctx, this.viewWidth, this.viewHeight - 26);
        ctx.stroke();
      },
      destroy: function() {
        this.destroyDots();
        this.endDrag();
        removeEventEx(this.lHandle, 'mousedown touchstart', this.takeHandle);
        removeEventEx(this.rHandle, 'mousedown touchstart', this.takeHandle);
        removeEventEx(this.zoutWindow, 'mousedown touchstart', this.takeWindow);
        removeEventEx(this.lMask, 'mousedown touchstart', this.takeMask);
        removeEventEx(this.rMask, 'mousedown touchstart', this.takeMask);
        removeEventEx(this.zinLayout, 'mousedown touchstart', this.takeView);
        removeEventEx(this.dotsLayer, 'mousemove', this.showDots);
        removeEventEx(this.zinLayout, 'mouseout', this.hideDots);
        removeEventEx(this.zinLayout, 'mousewheel DOMMouseScroll', this.wheelView);
        removeEventEx(this.zoutLayout, 'mousewheel DOMMouseScroll', this.wheelView);
        removeEvent(this.column[0], 'selectionstart', cancelEvent);
        removeEvent(this.column[1], 'selectionstart', cancelEvent);
        this.graphDiv.innerHTML = '';
      },

      showBadBrowserBox: function() {
        var s = (_2x ? '_2x' : '');
        var content = getLang('stats_good_browser_box_msg') + '\
    <div id="stats_good_browsers" class="clear_fix">\
      <a href="http://www.mozilla-europe.org/" target="_blank" rel="noopener" style="background: url(/images/firefox'+s+'.png) no-repeat 50% 17px;">Mozilla Firefox</a>\
      <a href="http://www.google.com/chrome/" target="_blank" rel="noopener" style="background: url(/images/chrome'+s+'.png) no-repeat 50% 17px;">Google Chrome</a>\
      <a href="http://www.opera.com/" target="_blank" rel="noopener" style="background: url(/images/opera'+s+'.png) no-repeat 50% 15px;">Opera</a>\
      <a href="http://www.apple.com/safari/" target="_blank" rel="noopener" style="background: url(/images/safari'+s+'.png) no-repeat 50% 12px;">Safari</a>\
    </div>\
    <style>\
      #stats_good_browsers {\
        height: 136px;\
        margin: 10px auto 0 auto;\
        width: 480px;\
      }\
      #stats_good_browsers a {\
        float: left;\
        height: 20px;\
        padding: 106px 0 10px 0;\
        width: 120px;\
        text-align: center;\
        -webkit-border-radius: 4px;\
        -khtml-border-radius: 4px;\
        -moz-border-radius: 4px;\
        border-radius: 4px;\
      }\
      #stats_good_browsers a:hover {\
        text-decoration: none;\
        background-color: #edf1f5!important;\
      }\
    </style>';
        cur.badBrowserBox = MessageBox({width: 540, hideButtons: true, bodyStyle: 'padding: 25px; text-align: center;', hideOnBGClick: true}).content(content).show();
        if (!window.ajax) {
          var b = cur.badBrowserBox.body();
          hide(geByClass1('box_title_wrap', b.parentNode));
          hide(geByClass1('box_controls_wrap', b.parentNode));
        }
      }
    }

    window.Graph = Graph;
    addEvent(document, 'touchstart touchmove touchend', function(ev) {
      globalTouchCount = ev.touches.length;
    });
  })(window);

try{stManager.done('graph.js');}catch(e){}
