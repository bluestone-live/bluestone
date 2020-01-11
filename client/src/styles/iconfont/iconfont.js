!(function(a) {
  var t,
    c =
      '<svg><symbol id="lh-icon-deposit" viewBox="0 0 1024 1024"><path d="M62.0489375 62h900v900H62.0489375z"  fill-opacity=".01" ></path><path d="M849.7176875 793.25H174.3801875A112.33125 112.33125 0 0 1 94.9551875 601.4375l337.66875-337.78125c43.875-43.875 114.975-43.875 158.85 0l337.66875 337.8375A112.3875 112.3875 0 0 1 849.7176875 793.25z"  ></path></symbol><symbol id="lh-icon-borrow" viewBox="0 0 1024 1024"><path d="M62 62h900v900H62z"  fill-opacity=".01" ></path><path d="M174.33125 230.75h675.3375a112.33125 112.33125 0 0 1 79.425 191.8125l-337.66875 337.78125c-43.875 43.875-114.975 43.875-158.85 0L94.90625 422.50625A112.3875 112.3875 0 0 1 174.33125 230.75z"  ></path></symbol><symbol id="lh-icon-account" viewBox="0 0 1024 1024"><path d="M0 0h1024v1024H0z"  fill-opacity=".01" ></path><path d="M512 512m-448 0a448 448 0 1 0 896 0 448 448 0 1 0-896 0Z"  ></path></symbol></svg>',
    e = (t = document.getElementsByTagName('script'))[
      t.length - 1
    ].getAttribute('data-injectcss');
  if (e && !a.__iconfont__svg__cssinject__) {
    a.__iconfont__svg__cssinject__ = !0;
    try {
      document.write(
        '<style>.svgfont {display: inline-block;width: 1em;height: 1em;fill: currentColor;vertical-align: -0.1em;font-size:16px;}</style>',
      );
    } catch (t) {
      console && console.log(t);
    }
  }
  !(function(t) {
    if (document.addEventListener)
      if (~['complete', 'loaded', 'interactive'].indexOf(document.readyState))
        setTimeout(t, 0);
      else {
        var e = function() {
          document.removeEventListener('DOMContentLoaded', e, !1), t();
        };
        document.addEventListener('DOMContentLoaded', e, !1);
      }
    else
      document.attachEvent &&
        ((i = t),
        (o = a.document),
        (l = !1),
        (c = function() {
          try {
            o.documentElement.doScroll('left');
          } catch (t) {
            return void setTimeout(c, 50);
          }
          n();
        })(),
        (o.onreadystatechange = function() {
          'complete' == o.readyState && ((o.onreadystatechange = null), n());
        }));
    function n() {
      l || ((l = !0), i());
    }
    var i, o, l, c;
  })(function() {
    var t, e, n, i, o, l;
    ((t = document.createElement('div')).innerHTML = c),
      (c = null),
      (e = t.getElementsByTagName('svg')[0]) &&
        (e.setAttribute('aria-hidden', 'true'),
        (e.style.position = 'absolute'),
        (e.style.width = 0),
        (e.style.height = 0),
        (e.style.overflow = 'hidden'),
        (n = e),
        (i = document.body).firstChild
          ? ((o = n), (l = i.firstChild).parentNode.insertBefore(o, l))
          : i.appendChild(n));
  });
})(window);
