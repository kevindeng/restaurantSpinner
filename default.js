$(function() {

  var uid = localStorage.uid ? localStorage.uid : makeid();

  var pubnub = PUBNUB.init({
    publish_key   : 'pub-c-3c784d13-65af-4a96-a859-cce7b4d431bb',
    subscribe_key : 'sub-c-7763ea46-3e12-11e3-9970-02ee2ddab7fe'
  });

  var dispatcher = {
    'chatMessage': chatMessage
  }

  pubnub.subscribe({
    channel: 'hello_world',
    message: function(m) {
      dispatcher[m.method](m);
    },
    connect: publish({
      method: 'connect',
      data: {
        name: localStorage.uname,
        'uid': uid
      }
    })
  });

  function publish(m) {
    m.uid = uid;
    m.uname = localStorage.uname;
    pubnub.publish({
      channel: 'hello_world',
      message: m
    });
  }

  function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for( var i=0; i < 16; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }

  function yelp(query, location, callback) {
    var auth = { 
      consumerKey: "MfQRYEUAggMNCM-ZOvm-Sg", 
      consumerSecret: "1h1MHnZifgEvY7_H5jBIalc4_6k",
      accessToken: "tBFr0vffVmQ60Qurbh_PoXJVvKBoeU2z",
      accessTokenSecret: "3EIiL41bkQ1PwGIouBVCa34Hzns",
      serviceProvider: { 
        signatureMethod: "HMAC-SHA1"
      }
    };
    var accessor = {
      consumerSecret: auth.consumerSecret,
      tokenSecret: auth.accessTokenSecret
    };

    cbName = makeid();
    parameters = [];
    parameters.push(['term', query]);
    parameters.push(['location', location]);
    parameters.push(['callback', cbName]);
    parameters.push(['oauth_consumer_key', auth.consumerKey]);
    parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
    parameters.push(['oauth_token', auth.accessToken]);
    parameters.push(['oauth_signature_method', 'HMAC-SHA1']);
    var message = { 
      'action': 'http://api.yelp.com/v2/search',
      'method': 'GET',
      'parameters': parameters 
    };
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, accessor);

    var parameterMap = OAuth.getParameterMap(message.parameters);
    parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);
    $.ajax({
      'url': message.action,
      'data': parameterMap,
      'cache': true,
      'dataType': 'jsonp',
      'jsonpCallback': cbName,
      'success': function(data, textStats, XMLHttpRequest) {
        callback(data);
      }
    });
  }

  function resize() {
    var h = window.innerHeight - $('.header').outerHeight() -
      $('.footer').outerHeight();
    $('.content').css('height', h);
  }

  function load(data) {
    // dedupe
    for (var i = 0; i < data.length - 1; i++) {
      for (var j = i + 1; j < data.length; j++) {
        if (data[i].id === data[j].id) {
          data.splice(j, 1);
          j--;
        }
      }
    }
    // sort by rating / num reviews
    data.sort(function(a, b) {
      if (a.rating == b.rating) {
        return b.review_count - a.review_count;
      }
      else {
        return b.rating - a.rating;
      }
    });
    // render
    for (var i = 0; i < data.length; i++) {
      $('.content').append(renderBiz(data[i]));
    }
    $('.content').animate({opacity: 1}, 250);
  }

  function renderBiz(b) {
    var d = $('#biz-template').clone();
    d.removeAttr('id');
    d.css('display', 'inline-block');
    d.find('.biz-name').find('a').text(b.name).attr({
      'href': b.url,
      'target': '_blank'
    });
    d.find('.biz-city').text(b.location.city);
    d.find('.biz-rating').find('img').attr('src', b.rating_img_url_large);
    d.find('.biz-review-cnt').text(b.review_count + ' reviews');
    d.find('.biz-pic').find('img').attr('src', b.image_url);
    if (b.categories) {
      var cat = "";
      for (var j = 0; j < b.categories.length; j++) {
        cat += b.categories[j][0] + ', ';
      }
      d.find('.biz-categories').text(cat.substring(0, cat.lastIndexOf(',')));
    }
    return d;
  }

  function renderSpinner() {
    for (var i = 0; i < _categories.length; i++) {
      var div = $(document.createElement('div'));
      div.addClass('category');
      if (i == 0) {
        div.addClass('selected');
      }
      div.text(_categories[i]);
      $('.category-list').append(div);
    }
  }

  function renderLocations() {
    var locations = []
    for (var k in _locations) {
      for (var i = 0; i < _locations[k].length; i++) {
        locations.push(_locations[k][i]);
      }
    }
    for (var i = 0; i < locations.length; i++) {
      var div = $(document.createElement('div'));
      div.addClass('location-wrap');
      div.text(locations[i]);
      for (var j = 0; j < _locations['South Bay'].length; j++) {
        if (locations[i] === _locations['South Bay'][j] && locations[i] != 'Los Gatos') {
          div.addClass('loc-selected');
          div.css('letter-spacing', 1);
          break;
        }
      }
      $('.header').append(div);
    }
  }

  function locationClickHandler(e) {
    var t = $(e.target);
    if (t.hasClass('loc-selected')) {
      t.removeClass('loc-selected');
      t.animate({
        'letter-spacing': 0
      }, 100, 'linear');
    }
    else {
      t.addClass('loc-selected');
      t.animate({
        'letter-spacing': 1
      }, 100, 'linear');
    }
  }

  function animateSpinner(newSelectionIdx, callback) {
    $('.bt-spin').addClass('disabled').animate({opacity: 0}, 200);
    $('.category-list').animate({
      'top': newSelectionIdx * -100
    }, {
      duration: 1000,
      complete: function() {
        $('.bt-spin').removeClass('disabled').animate({opacity: 1}, 200);
        callback();
      }
    });
  }

  function getLocations() {
    var locs = [];
    $('.loc-selected').each(function(idx, ele) {
      locs.push($(ele).text());
    });
    return locs;
  }

  function selectNewCategory() {
    var currentSelection = $($('.selected')[0]);
    var currentSelectionIdx = $('.category').index(currentSelection);

    var newSelectionIdx;
    while (newSelectionIdx == undefined ||
      Math.abs(currentSelectionIdx - newSelectionIdx) < 5) {
      newSelectionIdx = Math.floor(Math.random() * _categories.length);
    }

    currentSelection.removeClass('selected');
    var newSelection = $($('.category')[newSelectionIdx]);
    newSelection.addClass('selected');

    return {
      'element': newSelection,
      'idx': newSelectionIdx
    };
  }

  function spinButtonClickHandler() {
    if ($('.bt-spin').hasClass('disabled')) {
      return;
    }

    $('.content').animate({opacity: 0}, 350, function() {
      $('.content').children().remove();
    });

    var newSelection = selectNewCategory();
    var done = false;
    var data = [];
    var locs = getLocations();
    var numLocs = locs.length;

    for (var i = 0; i < locs.length; i++) {
      yelp(newSelection.element.text(), locs[i], function(d) {
        if (d.businesses) {
          for (var i = 0; i < d.businesses.length; i++) {
            data.push(d.businesses[i]);
          }
        }
        numLocs--;
        if (numLocs == 0) {
          done = true;
        }
      });
    }
    
    animateSpinner(newSelection.idx, function() {
      (function poll() {
        if (done) {
          load(data);
        }
        else {
          window.setTimeout(poll, 100);
        }
      })()
    });
  }

  (function init() {
    renderLocations();
    renderSpinner();
    $(window).resize(resize);
    $('.location-wrap').click(locationClickHandler);
    $('.bt-spin').click(spinButtonClickHandler);
    window.setTimeout(function() {
      $('.bt-spin').click();
      resize();
    }, 200);
  })();

  //------------------------------------------------------------------

  function chatMessage(m) {
    var d = $('#chat-message-template').clone().removeAttr('id');
    d.attr('data-uid', m.uid);
    d.find('.chat-message-bottom').text(m.data.message);
    var lastUid = $('.chat-messages').find('.chat-message').last().attr('data-uid');
    if (lastUid != m.uid) {
      var date = new Date();
      function pad(n) {
        return n.toString().length == 2 ? n.toString() : ('0' + n);
      }
      var am = date.getHours() < 12;
      var t = date.getHours() % 12;
      var dateStr = (date.getMonth() + 1) + '/' + date.getDate() + ',' +
        ' ' + pad((t == 0 && !am) ? 12 : t) + ':' + pad(date.getMinutes()) +
        (am ? 'am' : 'pm');
     
      d.find('.chat-message-name').text(m.uname);
      d.find('.chat-message-time').text(dateStr);
    }
    else {
      d.find('.chat-message-top').remove();
      d.addClass('same-user');
    }
    $('.chat-messages').append(d);
  }

  function defaultText(e, text) {
    e.focus(function() {
    e.removeClass('empty');
      if (e.val().trim() == text) {
        e.val('');
      }
    }).blur(function() {
      e.addClass('empty');
      if (e.val().trim() == '') {
        e.val(text);
      }
    });
    return e;
  }

  var cb = $('.chatbox');
  defaultText(cb, 'Type here to chat');
  cb.keydown(function(e) {
    var key = e.which;
    if (key == 13 && !e.shiftKey) {
      e.preventDefault();
      var msg = cb.val();
      cb.val('');
      publish({
        method: 'chatMessage',
        data: {
          message: msg
        }
      });
    }
  });

  function nameSet() {;
    $('.footer-text').css('margin-top', '-=10').find('.welcome').after('<br/>')
      .text('Hello ' + localStorage.uname + ',').animate({opacity: 1}, 150);
  }

  var ni = $('#uname');
  if (!localStorage.uname) {
    cb.attr('disabled', true);
    defaultText(ni, 'Enter your name here');
    ni.keydown(function(e) {
      if (e.which == 13) {
        localStorage.uname = ni.val().trim();
        e.preventDefault();
        cb.removeAttr('disabled');
        ni.fadeOut(150);
        nameSet();
      }
    });
  } else {
    ni.hide();
    nameSet();
  }
  
});
