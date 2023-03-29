//Initialize product gallery

$('.zshow').zoomImage();

$('.zshow-small-img:first-of-type').css({'border': 'solid 1px #951b25', 'padding': '2px'})
$('.zshow-small-img:first-of-type').attr('alt', 'now').siblings().removeAttr('alt')
$('.zshow-small-img').click(function () {
  $('#show-img').attr('src', $(this).attr('src'))
  $('#big-img').attr('src', $(this).attr('src'))
  $(this).attr('alt', 'now').siblings().removeAttr('alt')
  $(this).css({'border': 'solid 1px #951b25', 'padding': '2px'}).siblings().css({'border': 'none', 'padding': '0'})
  if ($('#small-img-roll').children().length > 4) {
    if ($(this).index() >= 3 && $(this).index() < $('#small-img-roll').children().length - 1){
      $('#small-img-roll').css('left', -($(this).index() - 2) * 76 + 'px')
    } else if ($(this).index() == $('#small-img-roll').children().length - 1) {
      $('#small-img-roll').css('left', -($('#small-img-roll').children().length - 4) * 76 + 'px')
    } else {
      $('#small-img-roll').css('left', '0')
    }
  }
})

//Enable the next button

$('#next-img').click(function (){
  $('#show-img').attr('src', $(".zshow-small-img[alt='now']").next().attr('src'))
  $('#big-img').attr('src', $(".zshow-small-img[alt='now']").next().attr('src'))
  $(".zshow-small-img[alt='now']").next().css({'border': 'solid 1px #951b25', 'padding': '2px'}).siblings().css({'border': 'none', 'padding': '0'})
  $(".zshow-small-img[alt='now']").next().attr('alt', 'now').siblings().removeAttr('alt')
  if ($('#small-img-roll').children().length > 4) {
    if ($(".zshow-small-img[alt='now']").index() >= 3 && $(".zshow-small-img[alt='now']").index() < $('#small-img-roll').children().length - 1){
      $('#small-img-roll').css('left', -($(".zshow-small-img[alt='now']").index() - 2) * 76 + 'px')
    } else if ($(".show-small-img[alt='now']").index() == $('#small-img-roll').children().length - 1) {
      $('#small-img-roll').css('left', -($('#small-img-roll').children().length - 4) * 76 + 'px')
    } else {
      $('#small-img-roll').css('left', '0')
    }
  }
})

//Enable the previous button

$('#prev-img').click(function (){
  $('#show-img').attr('src', $(".zshow-small-img[alt='now']").prev().attr('src'))
  $('#big-img').attr('src', $(".zshow-small-img[alt='now']").prev().attr('src'))
  $(".zshow-small-img[alt='now']").prev().css({'border': 'solid 1px #951b25', 'padding': '2px'}).siblings().css({'border': 'none', 'padding': '0'})
  $(".zshow-small-img[alt='now']").prev().attr('alt', 'now').siblings().removeAttr('alt')
  if ($('#small-img-roll').children().length > 4) {
    if ($(".zshow-small-img[alt='now']").index() >= 3 && $(".zshow-small-img[alt='now']").index() < $('#small-img-roll').children().length - 1){
      $('#small-img-roll').css('left', -($(".zshow-small-img[alt='now']").index() - 2) * 76 + 'px')
    } else if ($(".zshow-small-img[alt='now']").index() == $('#small-img-roll').children().length - 1) {
      $('#small-img-roll').css('left', -($('#small-img-roll').children().length - 4) * 76 + 'px')
    } else {
      $('#small-img-roll').css('left', '0')
    }
  }
})
