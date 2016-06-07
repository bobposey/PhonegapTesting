window.fn = {};

window.fn.open = function() {
  var menu = document.getElementById('menu');
  menu.open();
};

window.fn.load = function(page) {
  var content = document.getElementById('content');
  var menu = document.getElementById('menu');
  content.load(page)
    .then(menu.close.bind(menu));

  if (page == 'home.html') {
    $('#takeoff-time').inputmask("h:s");
    $('#flight-time').inputmask("h:s");
  }
};