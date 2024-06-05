function showListOrder3(list_orders, x) {
  if (list_orders.length == 0) {
    return $(`.game-list .con-box:eq(${x}) .hb`).html(
      `
                    <div data-v-a9660e98="" class="van-empty">
                        <div class="van-empty__image">
                            <img src="/images/empty-image-default.png" />
                        </div>
                        <p class="van-empty__description">No data</p>
                    </div>
                    `
    );
  }
  let htmls = "";
  let result = list_orders.map((list_orders) => {
    return (htmls += `
                    <div data-v-a9660e98="" class="c-tc item van-row">
                        <div data-v-a9660e98="" class="van-col van-col--8">
                            <div data-v-a9660e98="" class="c-tc goItem">${
                              list_orders.period
                            }</div>
                        </div>
                        <div data-v-a9660e98="" class="van-col van-col--5">
                            <div data-v-a9660e98="" class="c-tc goItem">
                                <!---->
                                <span data-v-a9660e98="" class="${
                                  list_orders.amount % 2 == 0 ? "red" : "green"
                                }"> ${list_orders.amount} </span>
                            </div>
                        </div>
                        <div data-v-a9660e98="" class="van-col van-col--5">
                            <div data-v-a9660e98="" class="c-tc goItem">
                                <span data-v-a9660e98=""> ${
                                  list_orders.amount < 5 ? "Small" : "Big"
                                } </span>
                                <!---->
                            </div>
                        </div>
                        <div data-v-a9660e98="" class="van-col van-col--6">
                            <div data-v-a9660e98="" class="goItem c-row c-tc c-row-center">
                                <div data-v-a9660e98="" class="c-tc c-row box c-row-center">
                                    <span data-v-a9660e98="" class="li ${
                                      list_orders.amount % 2 == 0
                                        ? "red"
                                        : "green"
                                    }"></span>
                                    ${
                                      list_orders.amount == 0 ||
                                      list_orders.amount == 5
                                        ? '<span data-v-a9660e98="" class="li violet"></span>'
                                        : ""
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    `);
  });
  $(`.game-list .con-box:eq(${x}) .hb`).prepend(htmls);
  $(`.game-list .con-box:eq(${x}) .hb .c-tc`).last().remove();
}
var socket = io();
var pageno = 0;
var limit = 10;
var page = 1;
socket.on("data-server", function (msg) {
  if (msg.data[0].game != 'wingo') return;
  $(".Loading").fadeIn(0);
  setTimeout(() => {
    let data1 = msg.data[0]; // lấy ra cầu mới nhất
    let data2 = []; // lấy ra cầu cũ
    let data3 = data2.push(msg.data[1]);
    $(".time-box .info .number").text(data1.period);
    showListOrder3(data2, 0);
    pageno = 0;
    limit = 10;
    page = 1;
    $(".game-list .con-box:eq(0) .page-nav .arr:eq(0)").addClass("block-click");
    $(".game-list .con-box:eq(0) .page-nav .arr:eq(0)").removeClass("action");
    $(".game-list .con-box:eq(0) .page-nav .van-icon-arrow-left").css(
      "color",
      "#7f7f7f"
    );
    $(".game-list .con-box:eq(0) .page-nav .arr:eq(1)").removeClass(
      "block-click"
    );
    $(".game-list .con-box:eq(0) .page-nav .arr:eq(1)").addClass("action");
    $(".game-list .con-box:eq(0) .page-nav .van-icon-arrow-right").css(
      "color",
      "#fff"
    );

    $(".game-list .con-box:eq(1) .page-nav .arr:eq(0)").addClass("block-click");
    $(".game-list .con-box:eq(1) .page-nav .arr:eq(0)").removeClass("action");
    $(".game-list .con-box:eq(1) .page-nav .van-icon-arrow-left").css(
      "color",
      "#7f7f7f"
    );
    $(".game-list .con-box:eq(1) .page-nav .arr:eq(1)").removeClass(
      "block-click"
    );
    $(".game-list .con-box:eq(1) .page-nav .arr:eq(1)").addClass("action");
    $(".game-list .con-box:eq(1) .page-nav .van-icon-arrow-right").css(
      "color",
      "#fff"
    );

    // New AJAX call to checkPeriodAndStage
    $.ajax({
      type: "POST",
      url: "/api/webapi/checkPeriodAndStage",
      data: { period: data1.period }, // Send the period as data
      dataType: "json",
      success: function (response) {
        if (response.message === 'success') {
          // If success, make the GetMyEmerdList API call and showListOrder35
          $.ajax({
            type: "POST",
            url: "/api/webapi/GetMyEmerdList",
            data: {
              typeid: "1",
              pageno: "0",
              pageto: "10",
              language: "vi",
            },
            dataType: "json",
            success: function (response) {
              let data = response.data.gameslist;
              console.log("hi");
              $(".game-list .con-box:eq(1) .page-nav .number").text(
                "1/" + `${(response.page) ? response.page : '1'}`
              );
              showListOrder35(data, 1);
            },
            error: function (error) {
              console.error("Error in GetMyEmerdList API call:", error);
            }
          });
        }
      },
      error: function (error) {
        console.error("Error in checkPeriodAndStage API call:", error);
      }
    });

    $.ajax({
      type: "POST",
      url: "/api/webapi/GetNoaverageEmerdList",
      data: {
        typeid: "1",
        pageno: "0",
        pageto: "10",
        language: "vi",
      },
      dataType: "json",
      success: function (response) {
        let list_orders = response.data.gameslist;
        $(".time-box .info .number").text(response.period);
        $(".game-list .con-box:eq(0) .page-nav .number").text(
          "1/" + response.page
        );
        showListOrder(list_orders, 0);
      },
    });

    fetch("/api/webapi/GetUserInfo")
      .then((response) => response.json())
      .then((data) => {
        if (data.status === false) {
          unsetCookie();
          return false;
        }
        $(".num span").text(`₹${data.data.money_user}`);
      });

    $(".Loading").fadeOut(0);
  }, 1000);
});

// $('body').click(function (e) {
//     e.preventDefault();
//     socket.emit('data-server', {
//         name: 'Longdz',
//     });
// });

var audio1 = new Audio("/audio/di1.da40b233.mp3");
var audio2 = new Audio("/audio/di2.317de251.mp3");

var clicked = false;

function openAudio() {
  audio1.muted = true;
  audio1.play();
  audio2.muted = true;
  audio2.play();
}

$("body").click(function (e) {
  e.preventDefault();
  if (clicked) return;
  openAudio();
  clicked = true;
});

function playAudio1() {
  audio1.muted = false;
  audio1.play();
}

function playAudio2() {
  audio2.muted = false;
  audio2.play();
}

fetch("/api/webapi/GetUserInfo")
  .then((response) => response.json())
  .then((data) => {
    $(".Loading").fadeOut(0);
    if (data.status === false) {
      unsetCookie();
      return false;
    }
    $(".num span").text(`₹ ${data.data.money_user} `);
  });

$(".reload_money").click(function (e) {
  e.preventDefault();
  $(this).addClass("action block-click");
  setTimeout(() => {
    $(this).removeClass("action block-click");
  }, 3000);
  fetch("/api/webapi/GetUserInfo")
  .then((response) => response.json())
  .then((data) => {
    if (data.status === false) {
      unsetCookie();
      return false;
    }
    $(".num span").text(`₹ ${data.data.money_user}`);
  });
});
$(".van-overlay, .foot .left").click(function (e) {
  e.preventDefault();
  $(".van-overlay").fadeOut();
  $('.van-popup-vf').fadeOut(100);
  $(".popup-join").css("transform", "translateY(600px)");
  $(".betting-mark .amount-box .li, .multiple-box .li").css({
    "background-color": "rgb(240, 240, 240)",
    color: "rgb(0, 0, 0)",
  });
  $(".betting-mark .amount-box .li:eq(0), .multiple-box .li:eq(0)").css({
    "background-color": "rgb(240, 240, 240)",
    color: "rgb(255, 255, 255)",
  });
  $(".stepper-box .digit-box input").val(1);
  $(".amount-box").attr("data-money", "1000");
  $(".foot .right span:eq(1)").text(1000 + "₹");
});

function xlad(x, color) {
  $(".multiple-box .li").css({
    "background-color": "rgb(240, 240, 240)",
    color: "rgb(0, 0, 0)",
  });
  $(`.multiple-box .li:eq(${x})`).css({
    "background-color": `${color}`,
    color: "rgb(255, 255, 255)",
  });
}

function selectX(x, color) {
  switch (String(x)) {
    case "1":
      xlad(0, color);
      break;
    case "5":
      xlad(1, color);
      break;
    case "10":
      xlad(2, color);
      break;
    case "20":
      xlad(3, color);
      break;
    case "50":
      xlad(4, color);
      break;
    case "100":
      xlad(5, color);
      break;
    default:
      $(".multiple-box .li").css({
        "background-color": "rgb(240, 240, 240)",
        color: "rgb(0, 0, 0)",
      });
      break;
  }
}

$(".stepper-box .plus").click(function (e) {
  e.preventDefault();
  let color = $(".foot .right").attr("style").split(":");
  color = color[1].split(";")[0].trim();
  let value = $(".stepper-box .digit-box input").val().trim();
  value = Number(value) + 1;
  selectX(value, color);
  if (value > 1) {
    $(".stepper-box .minus").css({
      "background-color": `${color}`,
      color: "#fff",
    });
  } else {
    $(".stepper-box .minus").css({
      "background-color": "rgb(240, 240, 240)",
      color: "rgb(200, 201, 204)",
    });
  }
  $(".stepper-box .digit-box input").val(value);
  totalMoney();
});

$(".stepper-box .digit-box input").on("input", function () {
  let value = $(this).val();
  let color = $(".foot .right").attr("style").split(":");
  color = color[1].split(";")[0].trim();
  // if (!value)  $(this).val(1);
  value = $(this).val();
  if (value <= 1) {
    $(".stepper-box .minus").css({
      "background-color": "rgb(240, 240, 240)",
      color: "rgb(200, 201, 204)",
    });
  } else if (value) {
    $(".stepper-box .minus").css({
      "background-color": `${color}`,
      color: "rgb(200, 201, 204)",
    });
  }
  selectX(value, color);
  totalMoney();
});

$(".stepper-box .minus").click(function (e) {
  e.preventDefault();
  let color = $(".foot .right").attr("style").split(":");
  color = color[1].split(";")[0].trim();
  let value = $(".stepper-box .digit-box input").val().trim();
  value = Number(value) - 1;
  if (value <= 0) return;
  selectX(value, color);
  if (value == 1) {
    $(".stepper-box .minus").css({
      "background-color": "rgb(240, 240, 240)",
      color: "rgb(200, 201, 204)",
    });
  }
  $(".stepper-box .digit-box input").val(value);
  totalMoney();
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function selectCss(color, bg, text) {
  $(".betting-mark").attr("class", "betting-mark");
  $(".color").css("color", bg);
  $(".color .p-l-10").text(text);
  $(".betting-mark").addClass(color);
  $(".amount-box .li:eq(0)").css("background-color", bg);
  $(".plus").css("background-color", bg);
  $(".multiple-box .li:eq(0)").css("background-color", bg);
  $(".foot .right").css("background-color", bg);
}

function totalMoney() {
  let value = $(".stepper-box .digit-box input").val().trim();
  let money = $(".amount-box").attr("data-money");
  let total = value * money;
  $(".foot .right span:eq(1)").text("₹"+total);
}

function alertBox(join, addText) {
  $(".foot .right").attr("data-join", join);
  switch (join) {
    case "x":
      selectCss("colorgreen", "rgb(92, 186, 71)", addText);
      break;
    case "t":
      selectCss("colorviolet", "rgb(152, 49, 233)", addText);
      break;
    case "d":
      selectCss("colorred", "rgb(251, 78, 78)", addText);
      break;
    case "l":
      selectCss("colorbig", "rgb(255, 197, 17)", addText);
      break;
    case "n":
      selectCss("colorsmall", "rgb(92, 186, 71)", addText);
      break;
    default:
      if (join % 2 == 0) {
        selectCss(`color${join}`, "rgb(251, 78, 78)", addText);
      } else {
        selectCss(`color${join}`, "rgb(92, 186, 71)", addText);
      }
      break;
  }
  $(".van-overlay").fadeIn();
  $(".popup-join").fadeIn();
  $(".stepper-box .minus").css({
    "background-color": "rgb(240, 240, 240)",
    color: "rgb(200, 201, 204)",
  });
  $(".popup-join").css("transform", "translateY(1px)");
  let active = $(".random-box .c-row .active").attr("data-x");
  let color = $(".foot .right").attr("style").split(":");
  color = color[1].split(";")[0].trim();
  $(".stepper-box input").val(active);
  totalMoney();
  selectX(active, color);
  if (active <= 1) {
    $(".stepper-box .minus").css({
      "background-color": "rgb(240, 240, 240)",
      color: "rgb(200, 201, 204)",
    });
  } else {
    $(".stepper-box .minus").css({
      "background-color": `${color}`,
      color: "rgb(255, 255, 255)",
    });
  }
}

$(".popup-join .info .txt").click(function (e) {
  e.preventDefault();
  $(".popup-qt").fadeIn();
});

$(".betting-mark .amount-box .li").click(function (e) {
  e.preventDefault();
  let color = $(".foot .right").attr("style").split(":");
  color = color[1].split(";")[0].trim();
  $(".betting-mark .amount-box .li").css({
    "background-color": "rgb(240, 240, 240)",
    color: "rgb(0, 0, 0)",
  });

  $(this).css({
    "background-color": `${color}`,
    color: "rgb(255, 255, 255)",
  });
  let thisValue = $(this).attr("data-x");
  $(".amount-box").attr("data-money", thisValue);
  totalMoney();
});
$(".multiple-box .li").click(function (e) {
  e.preventDefault();
  let color = $(".foot .right").attr("style").split(":");
  color = color[1].split(";")[0].trim();
  $(".multiple-box .li").css({
    "background-color": "rgb(240, 240, 240)",
    color: "rgb(0, 0, 0)",
  });
  $(this).css({
    "background-color": `${color}`,
    color: "rgb(255, 255, 255)",
  });
  let x = $(this).attr("data-x");
  if (x > 1) {
    $(".stepper-box .minus").css({
      "background-color": `${color}`,
      color: "#fff",
    });
  } else {
    $(".stepper-box .minus").css({
      "background-color": "rgb(240, 240, 240)",
      color: "rgb(200, 201, 204)",
    });
  }
  $(".stepper-box .digit-box input").val(x);
  totalMoney();
});

$(".popup-qt .van-button").click(function (e) {
  e.preventDefault();
  $(".popup-qt").fadeOut();
});

$(".con-box button").click(function (e) {
  e.preventDefault();
  let addTop = $(this).attr("data-join"); // xanh - do - tim (x - d - t)
  let addText = $(this).text(); // xanh - do - tim
  alertBox(addTop, addText);
});
$(".number-box button").click(function (e) {
  e.preventDefault();
  let addTop = $(this).text().trim(); // xanh - do - tim (x - d - t)
  let addText = $(this).text(); // xanh - do - tim
  alertBox(addTop, addText);
});
$(".btn-box button").click(function (e) {
  e.preventDefault();
  let addTop = $(this).attr("data-join"); // xanh - do - tim (x - d - t)
  let addText = $(this).text(); // xanh - do - tim
  alertBox(addTop, addText);
});

$(".random-box .c-row .item").click(function (e) {
  e.preventDefault();
  $(".random-box .c-row .item").css({
    "background-color": "rgb(240, 240, 240)",
    color: "rgb(0, 0, 0)",
  });

  $(this).css({
    "background-color": "rgb(92, 186, 71)",
    color: "rgb(255, 255, 255)",
  });
  $(".random-box .c-row .item").removeClass("active");
  $(this).addClass("active");
});

$(".random").click(async function (e) {
  e.preventDefault();
  let random = 0;
  for (let i = 0; i < 55; i++) {
    random = Math.floor(Math.random() * 10);
    $(".number-box button").removeClass("action");
    $(`.number-box button:eq(${random})`).addClass("action");
    await sleep(50);
  }
  $(".van-overlay").fadeIn();
  $(".popup-join").fadeIn();
  $(".popup-join").css("transform", "translateY(1px)");
  alertBox(random, random);
});
$(".game-list .tab .li:eq(0)").click(function (e) {
  e.preventDefault();
  $(".game-list .con-box").css("display", "none");
  $(".game-list .li .txt").removeClass("action");
  $(".game-list .li .txt:eq(0)").addClass("action");
  $(".game-list .li").removeClass("block-click");
  $(this).addClass("block-click");
  $(".game-list .con-box:eq(0)").css("display", "block");
  $.ajax({
    type: "POST",
    url: "/api/webapi/GetNoaverageEmerdList",
    data: {
      typeid: "1",
      pageno: "0",
      pageto: "10",
      language: "vi",
    },
    dataType: "json",
    success: function (response) {
      let list_orders = response.data.gameslist;
      $(".time-box .info .number").text(response.period);
      $(".page-nav .number").text("1/" + response.page);
      $(".game-list .con-box:eq(0) .page-nav .number").text(
        "1/" + response.page
      );
      showListOrder(list_orders, 0);
    },
  });
});
$(".game-list .tab .li:eq(1)").click(function (e) {
  e.preventDefault();
  $(".game-list .con-box").css("display", "none");
  $(".game-list .li .txt").removeClass("action");
  $(".game-list .li .txt:eq(1)").addClass("action");
  $(".game-list .li").removeClass("block-click");
  $(this).addClass("block-click");
  $(".game-list .con-box:eq(1)").css("display", "block");
  $.ajax({
    type: "POST",
    url: "/api/webapi/GetMyEmerdList",
    data: {
      typeid: "1",
      pageno: "0",
      pageto: "10",
      language: "vi",
    },
    dataType: "json",
    success: function (response) {
      let data = response.data.gameslist;
      $(".game-list .con-box:eq(1) .page-nav .number").text(
        "1/" + `${(response.page) ? response.page : '1'}`
      );
      showListOrder2(data, 1);
    },
  });
  setTimeout(() => {
    let check = true;
    $("#history-order .item").click(function(e) {
      e.preventDefault();
      let parent = $(this).parent();
      // let show = parent.children();
      let myVar = parent.find(".details");
      if (check) {
        check = false;
        myVar.fadeIn(0);
      } else {
        check = true;
        myVar.fadeOut(0);
      }
    });
  }, 1000);
});
$(".game-list .tab .li:eq(2)").click(function (e) {
  e.preventDefault();
  $(".game-list .con-box").css("display", "none");
  $(".game-list .li .txt").removeClass("action");
  $(".game-list .li .txt:eq(2)").addClass("action");
  $(".game-list .li").removeClass("block-click");
  $(this).addClass("block-click");
  $(".game-list .con-box:eq(2)").css("display", "block");
});

function alertMessJoin(msg) {
  $("body").append(
    `
                <div data-v-1dcba851="" class="msg">
                    <div data-v-1dcba851="" class="msg-content v-enter-active v-enter-to" style=""> ${msg} </div>
                </div>
                `
  );
  setTimeout(() => {
    $(".msg .msg-content").removeClass("v-enter-active v-enter-to");
    $(".msg .msg-content").addClass("v-leave-active v-leave-to");
    setTimeout(() => {
      $("body .msg").remove();
    }, 500);
  }, 1000);
}
$(".foot .right").click(function (e) {
  e.preventDefault();
  let join = $(this).attr("data-join");
  let x = $(".stepper-box input").val().trim();
  let money = $(".amount-box").attr("data-money");
  if (!join || !x || !money) {
    return;
  }
  $(this).addClass("block-click");
  $.ajax({
    type: "POST",
    url: "/api/webapi/action/join",
    data: {
      typeid: "1",
      join: join,
      x: x,
      money: money,
    },
    dataType: "json",
    success: function (response) {
      alertMessJoin(response.message);
      if (response.status === false) return;
      $("#history-order").prepend(response.data);
      $(".total-box .num span").text("₹"+response.money);
      socket.emit('data-server_2', { money: x * money, join, time: Date.now(), change: response.change });
    },
  });

  setTimeout(() => {
    $(".van-overlay").fadeOut();
    $(".popup-join").css("transform", "translateY(600px)");
    $(".betting-mark .amount-box .li, .multiple-box .li").css({
      "background-color": "rgb(240, 240, 240)",
      color: "rgb(0, 0, 0)",
    });
    $(".betting-mark .amount-box .li:eq(0), .multiple-box .li:eq(0)").css({
      "background-color": "rgb(240, 240, 240)",
      color: "rgb(255, 255, 255)",
    });
    $(".stepper-box .digit-box input").val(1);
    $(".amount-box").attr("data-money", "1000");
    $(".foot .right span:eq(1)").text(1000 + "₹");
    $(".foot .right").removeClass("block-click");
  }, 500);
});

function showListOrder(list_orders, x) {
  if (list_orders.length == 0) {
    return $(`.game-list .con-box:eq(${x}) .hb`).html(
      `
                    <div data-v-a9660e98="" class="van-empty">
                        <div class="van-empty__image">
                            <img src="/images/empty-image-default.png" />
                        </div>
                        <p class="van-empty__description">Không có dữ liệu</p>
                    </div>
                    `
    );
  }
  let htmls = "";
  let result = list_orders.map((list_orders) => {
    return (htmls += `
                    <div data-v-a9660e98="" class="c-tc item van-row">
                        <div data-v-a9660e98="" class="van-col van-col--8">
                            <div data-v-a9660e98="" class="c-tc goItem">${
                              list_orders.period
                            }</div>
                        </div>
                        <div data-v-a9660e98="" class="van-col van-col--5">
                            <div data-v-a9660e98="" class="c-tc goItem">
                                <!---->
                                <span data-v-a9660e98="" class="${
                                  list_orders.amount % 2 == 0 ? "red" : "green"
                                }"> ${list_orders.amount} </span>
                            </div>
                        </div>
                        <div data-v-a9660e98="" class="van-col van-col--5">
                            <div data-v-a9660e98="" class="c-tc goItem">
                                <span data-v-a9660e98=""> ${
                                  list_orders.amount < 5 ? "Small" : "Big"
                                } </span>
                                <!---->
                            </div>
                        </div>
                        <div data-v-a9660e98="" class="van-col van-col--6">
                            <div data-v-a9660e98="" class="goItem c-row c-tc c-row-center">
                                <div data-v-a9660e98="" class="c-tc c-row box c-row-center">
                                    <span data-v-a9660e98="" class="li ${
                                      list_orders.amount % 2 == 0
                                        ? "red"
                                        : "green"
                                    }"></span>
                                    ${
                                      list_orders.amount == 0 ||
                                      list_orders.amount == 5
                                        ? '<span data-v-a9660e98="" class="li violet"></span>'
                                        : ""
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                    `);
  });
  $(`.game-list .con-box:eq(${x}) .hb`).html(htmls);
}

const isNumber = (params) => {
  let pattern = /^[0-9]*\d$/;
  return pattern.test(params);
};

function showListOrder2(list_orders, x) {
  if (list_orders.length == 0) {
    return $(`.game-list .con-box:eq(${x}) #history-order`).html(
      `
                    <div data-v-a9660e98="" class="van-empty">
                        <div class="van-empty__image">
                            <img src="/images/empty-image-default.png" />
                        </div>
                        <p class="van-empty__description">No data</p>
                    </div>
                    `
    );
  }
  let htmls = "";
  let i = -1;
  let result = list_orders.map((list_orders) => {
    i++;
    let join = list_orders.bet;
    let color = "";
    if (join == "l") {
      color = "big";
    } else if (join == "n") {
      color = "small";
    } else if (join == "t") {
      color = "violet";
    } else if (join == "d") {
      color = "red";
    } else if (join == "x") {
      color = "green";
    } else if (join == "0") {
      color = "red-violet";
    } else if (join == "5") {
      color = "green-violet";
    } else if (Number(join) % 2 == 0) {
      color = "red";
    } else if (Number(join) % 2 != 0) {
      color = "green";
    }
    if ((!isNumber(join) && join == "l") || join == "n") {
      checkJoin = `
                    <div data-v-a9660e98="" class="van-image" style="width: 30px; height: 30px;">
                        <img src="/images/${
                          join == "n" ? "small" : "big"
                        }.png" class="van-image__img">
                    </div>
                    `;
    } else {
      checkJoin = `
                    <span data-v-a9660e98="">${
                      isNumber(join) ? join : ""
                    }</span>
                    `;
    }

    let orderResult = list_orders.status == 1 ? 'win' : 'lose';
    console.log(list_orders.status);
    // showResultPopup(orderResult, list_orders.stage, list_orders.money, join);

    return (htmls += `
                    <div data-v-a9660e98="" issuenumber="${
                      list_orders.stage
                    }" addtime="${timerJoin(
      list_orders.time
    )}" colour="red" number="6" rowid="${i}" class="hb">
                        <div data-v-a9660e98="" class="item c-row">
                            <div data-v-a9660e98="" class="result">
                                <div data-v-a9660e98="" class="select select-${color}">
                                    ${checkJoin}    
                                </div>
                            </div>
                            <div data-v-a9660e98="" class="c-row c-row-between info">
                                <div data-v-a9660e98="">
                                    <div data-v-a9660e98="" class="issueName">
                                        ${list_orders.stage} 
                                        ${
                                          list_orders.status == 1
                                            ? '<span data-v-a9660e98="" class="state green">Success</span>'
                                            : list_orders.status == 2
                                            ? '<span data-v-a9660e98="" class="state red">Fail</span>'
                                            : ""
                                        }
                                    </div>
                                    <div data-v-a9660e98="" class="tiem">${timerJoin(
                                      list_orders.time
                                    )}</div>
                                </div>
                                <div data-v-a9660e98="" class="money">
                                        ${
                                          list_orders.status == 1
                                            ? '<span data-v-a9660e98="" class="success"> + ' +
                                              list_orders.get +
                                              " </span>"
                                            : list_orders.status == 2
                                            ? '<span data-v-a9660e98="" class="fail"> - ' +
                                              list_orders.money +
                                              "</span>"
                                            : ""
                                        }
                                </div>
                            </div>
                        </div>

                        <div data-v-a9660e98="" class="details" style="display: none">
                            <div data-v-a9660e98="" class="tit">Details</div>
                            <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                <div data-v-a9660e98="">Order ID</div>
                                <div data-v-a9660e98="" data-clipboard-text="${
                                  list_orders.id_product
                                }" class="tag-read c-row c-row-between c-row-middle">
                                    ${list_orders.id_product}
                                    <img data-v-a9660e98="" width="18px" height="15px" src="/images/copy.png" class="m-l-5">
                                </div>
                                </div>
                                <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                    <div data-v-a9660e98="">Periods</div>
                                        <div data-v-a9660e98="">${
                                          list_orders.stage
                                        }</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Amount Spent</div>
                                        <div data-v-a9660e98="">${
                                          list_orders.money + list_orders.fee
                                        }.00</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Quantity</div>
                                        <div data-v-a9660e98="">${
                                          list_orders.amount
                                        }</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Net Amount</div>
                                        <div data-v-a9660e98="" class="red">${
                                          list_orders.money
                                        }.00</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Tax</div>
                                        <div data-v-a9660e98="">${
                                          list_orders.fee
                                        }.00</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Opening Price</div>
                                        <div data-v-a9660e98="">${
                                          list_orders.result
                                        }</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Result</div>
                                    <div data-v-a9660e98="">
                                        <div data-v-a9660e98="" style="display: inline-block; margin-left: 8px;">${
                                          list_orders.result
                                        }</div>
                                        <div data-v-a9660e98="" style="display: inline-block; margin-left: 8px;">${
                                          list_orders.result == 0
                                            ? "Red purple"
                                            : list_orders.result == 5
                                            ? "Purple green"
                                            : list_orders.result % 2 == 0
                                            ? "Red"
                                            : "Green"
                                        }</div>
                                        <div data-v-a9660e98="" style="display: inline-block; margin-left: 8px;">${
                                          list_orders.amount < 5 ? "Small" : "Big"
                                        }</div>
                                    </div>
                                </div>
                                <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle ">
                                    <div data-v-a9660e98="">Select</div>
                                    <div data-v-a9660e98="">
                                        <div data-v-a9660e98="">${color}</div>
                                    </div>
                                </div>
                                <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                    <div data-v-a9660e98="">Status</div>
                                    <div data-v-a9660e98="" class="${
                                      list_orders.status == 1
                                        ? "green"
                                        : list_orders.status == 2
                                        ? "red"
                                        : ""
                                    }">${
      list_orders.status == 1
        ? "Success"
        : list_orders.status == 2
        ? "Failure"
        : ""
    }</div>
                                </div>
                                <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                    <div data-v-a9660e98="">Win Or Loss</div>
                                    <div data-v-a9660e98="" class="${
                                      list_orders.status == 1
                                        ? "green"
                                        : list_orders.status == 2
                                        ? "red"
                                        : ""
                                    }"> ${
      list_orders.status == 1 ? "+" : list_orders.status == 2 ? "-" : ""
    } ${
      list_orders.status == 0
        ? ""
        : list_orders.status == 1
        ? list_orders.get
        : list_orders.money
    } </div>
                                </div>
                                <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                    <div data-v-a9660e98="">Time</div>
                                    <div data-v-a9660e98="">${timerJoin(
                                      list_orders.time
                                    )}</div>
                                </div>
                            </div>
                    </div>
                    `);
  });
  $(`.game-list .con-box:eq(${x}) .list #history-order`).html(htmls);
}

function showListOrder35(list_orders, x) {
  if (list_orders.length == 0) {
    console.log(list_orders);
    return $(`.game-list .con-box:eq(${x}) #history-order`).html(
      `
                    <div data-v-a9660e98="" class="van-empty">
                        <div class="van-empty__image">
                            <img src="/images/empty-image-default.png" />
                        </div>
                        <p class="van-empty__description">No data</p>
                    </div>
                    `
    );
  }

// Get the first element of list_orders
const firstOrder = list_orders[0];
const orderResult = firstOrder.status == 1 ? 'win' : 'lose';
const join = firstOrder.bet;
const resultwingo=firstOrder.result;

// Call showResultPopup with the parameters from the first object
showResultPopup(orderResult, firstOrder.stage, firstOrder.get, join,resultwingo);



  let htmls = "";
  let i = -1;
  let result = list_orders.map((list_orders) => {
    i++;
    let join = list_orders.bet;
    let color = "";
    if (join == "l") {
      color = "big";
    } else if (join == "n") {
      color = "small";
    } else if (join == "t") {
      color = "violet";
    } else if (join == "d") {
      color = "red";
    } else if (join == "x") {
      color = "green";
    } else if (join == "0") {
      color = "red-violet";
    } else if (join == "5") {
      color = "green-violet";
    } else if (Number(join) % 2 == 0) {
      color = "red";
    } else if (Number(join) % 2 != 0) {
      color = "green";
    }
    if ((!isNumber(join) && join == "l") || join == "n") {
      checkJoin = `
                    <div data-v-a9660e98="" class="van-image" style="width: 30px; height: 30px;">
                        <img src="/images/${
                          join == "n" ? "small" : "big"
                        }.png" class="van-image__img">
                    </div>
                    `;
    } else {
      checkJoin = `
                    <span data-v-a9660e98="">${
                      isNumber(join) ? join : ""
                    }</span>
                    `;
    }

    let orderResult = list_orders.status == 1 ? 'win' : 'lose';
    console.log(list_orders.status);
    // showResultPopup(orderResult, list_orders.stage, list_orders.get, join);

    return (htmls += `
                    <div data-v-a9660e98="" issuenumber="${
                      list_orders.stage
                    }" addtime="${timerJoin(
      list_orders.time
    )}" colour="red" number="6" rowid="${i}" class="hb">
                        <div data-v-a9660e98="" class="item c-row">
                            <div data-v-a9660e98="" class="result">
                                <div data-v-a9660e98="" class="select select-${color}">
                                    ${checkJoin}    
                                </div>
                            </div>
                            <div data-v-a9660e98="" class="c-row c-row-between info">
                                <div data-v-a9660e98="">
                                    <div data-v-a9660e98="" class="issueName">
                                        ${list_orders.stage} 
                                        ${
                                          list_orders.status == 1
                                            ? '<span data-v-a9660e98="" class="state green">Success</span>'
                                            : list_orders.status == 2
                                            ? '<span data-v-a9660e98="" class="state red">Fail</span>'
                                            : ""
                                        }
                                    </div>
                                    <div data-v-a9660e98="" class="tiem">${timerJoin(
                                      list_orders.time
                                    )}</div>
                                </div>
                                <div data-v-a9660e98="" class="money">
                                        ${
                                          list_orders.status == 1
                                            ? '<span data-v-a9660e98="" class="success"> + ' +
                                              list_orders.get +
                                              " </span>"
                                            : list_orders.status == 2
                                            ? '<span data-v-a9660e98="" class="fail"> - ' +
                                              list_orders.money +
                                              "</span>"
                                            : ""
                                        }
                                </div>
                            </div>
                        </div>

                        <div data-v-a9660e98="" class="details" style="display: none">
                            <div data-v-a9660e98="" class="tit">Details</div>
                            <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                <div data-v-a9660e98="">Order ID</div>
                                <div data-v-a9660e98="" data-clipboard-text="${
                                  list_orders.id_product
                                }" class="tag-read c-row c-row-between c-row-middle">
                                    ${list_orders.id_product}
                                    <img data-v-a9660e98="" width="18px" height="15px" src="/images/copy.png" class="m-l-5">
                                </div>
                                </div>
                                <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                    <div data-v-a9660e98="">Periods</div>
                                        <div data-v-a9660e98="">${
                                          list_orders.stage
                                        }</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Amount Spent</div>
                                        <div data-v-a9660e98="">${
                                          list_orders.money + list_orders.fee
                                        }.00</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Quantity</div>
                                        <div data-v-a9660e98="">${
                                          list_orders.amount
                                        }</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Net Amount</div>
                                        <div data-v-a9660e98="" class="red">${
                                          list_orders.money
                                        }.00</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Tax</div>
                                        <div data-v-a9660e98="">${
                                          list_orders.fee
                                        }.00</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Opening Price</div>
                                        <div data-v-a9660e98="">${
                                          list_orders.result
                                        }</div>
                                    </div>
                                    <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                        <div data-v-a9660e98="">Result</div>
                                    <div data-v-a9660e98="">
                                        <div data-v-a9660e98="" style="display: inline-block; margin-left: 8px;">${
                                          list_orders.result
                                        }</div>
                                        <div data-v-a9660e98="" style="display: inline-block; margin-left: 8px;">${
                                          list_orders.result == 0
                                            ? "Red purple"
                                            : list_orders.result == 5
                                            ? "Purple green"
                                            : list_orders.result % 2 == 0
                                            ? "Red"
                                            : "Green"
                                        }</div>
                                        <div data-v-a9660e98="" style="display: inline-block; margin-left: 8px;">${
                                          list_orders.amount < 5 ? "Small" : "Big"
                                        }</div>
                                    </div>
                                </div>
                                <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle ">
                                    <div data-v-a9660e98="">Select</div>
                                    <div data-v-a9660e98="">
                                        <div data-v-a9660e98="">${color}</div>
                                    </div>
                                </div>
                                <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                    <div data-v-a9660e98="">Status</div>
                                    <div data-v-a9660e98="" class="${
                                      list_orders.status == 1
                                        ? "green"
                                        : list_orders.status == 2
                                        ? "red"
                                        : ""
                                    }">${
      list_orders.status == 1
        ? "Success"
        : list_orders.status == 2
        ? "Failure"
        : ""
    }</div>
                                </div>
                                <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                    <div data-v-a9660e98="">Win Or Loss</div>
                                    <div data-v-a9660e98="" class="${
                                      list_orders.status == 1
                                        ? "green"
                                        : list_orders.status == 2
                                        ? "red"
                                        : ""
                                    }"> ${
      list_orders.status == 1 ? "+" : list_orders.status == 2 ? "-" : ""
    } ${
      list_orders.status == 0
        ? ""
        : list_orders.status == 1
        ? list_orders.get
        : list_orders.money
    } </div>
                                </div>
                                <div data-v-a9660e98="" class="li c-row c-row-between c-row-middle">
                                    <div data-v-a9660e98="">Time</div>
                                    <div data-v-a9660e98="">${timerJoin(
                                      list_orders.time
                                    )}</div>
                                </div>
                            </div>
                    </div>
                    `);
  });
  $(`.game-list .con-box:eq(${x}) .list #history-order`).html(htmls);
}
$.ajax({
  type: "POST",
  url: "/api/webapi/GetNoaverageEmerdList",
  data: {
    typeid: "1",
    pageno: "0",
    pageto: "10",
    language: "vi",
  },
  dataType: "json",
  success: function (response) {
    let list_orders = response.data.gameslist;
    $(".time-box .info .number").text(response.period);
    $(".game-list .con-box:eq(0) .page-nav .number").text("1/" + response.page);
    showListOrder(list_orders, 0);
  },
});

function formateT(params) {
  let result = params < 10 ? "0" + params : params;
  return result;
}

function timerJoin(params = "") {
  let date = "";
  if (params) {
    date = new Date(Number(params));
  } else {
    date = new Date();
  }
  let years = formateT(date.getFullYear());
  let months = formateT(date.getMonth() + 1);
  let days = formateT(date.getDate());

  let hours = formateT(date.getHours());
  let minutes = formateT(date.getMinutes());
  let seconds = formateT(date.getSeconds());
  return (
    years +
    "-" +
    months +
    "-" +
    days +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds
  );
}

function showResultPopup(result, stage, money, join,resultwingo) {
  let popupOutcome = result === 'win' ? 'Win' : 'Lose';
  let colorText = '';
  let sizeText = join === 'n' ? 'Small' : 'Big';

   // Set colorText based on resultwingo
   if ([2, 4, 6, 8].includes(resultwingo)) {
    colorText = 'Red';
  } else if ([1, 3, 7, 9].includes(resultwingo)) {
    colorText = 'Green';
  } else if ([0, 5].includes(resultwingo)) {
    colorText = 'Violet';
  } else {
    colorText = join % 2 === 0 ? 'Red' : 'Green';
  }

  // Generate a random number for specific join values
  let randomNumber;
  
  randomNumber=resultwingo;

  // Set sizeText based on randomNumber if join is not 'l' or 'n'
    sizeText = (randomNumber >= 0 && randomNumber <= 4) ? 'Small' : 'Big';
  

  document.getElementById('popupColor').innerText = colorText;
  document.getElementById('popupNumber').innerText = randomNumber;
  document.getElementById('popupSize').innerText = sizeText;

  // Set the background color or image based on randomNumber
  let backgroundStyle = '';
  switch (randomNumber) {
    case 0:
      backgroundStyle = 'background-image: linear-gradient(to bottom right, #fb4e4e 50%, #eb43dd 0) !important;';
      break;
    case 1:
    case 3:
    case 7:
    case 9:
      backgroundStyle = 'background-color: #00ff00;'; // Green
      break;
    case 2:
    case 4:
    case 6:
    case 8:
      backgroundStyle = 'background-color: #ff0000;'; // Red
      break;
    case 5:
      backgroundStyle = 'background-image: linear-gradient(to bottom right, #5cba47 50%, #eb43dd 0) !important;';
      break;
    default:
      backgroundStyle = 'background-color: #ffffff;'; // Default white
  }

  document.getElementById('popupColor').style = backgroundStyle;
  document.getElementById('popupNumber').style = backgroundStyle;
  document.getElementById('popupSize').style = backgroundStyle;

  let popupBody = document.querySelector('#popup-bg');
  if (result == 'lose') {
    popupBody.style.backgroundImage = "url('/images/loss.png')";
  } else {
    popupBody.style.backgroundImage = "url('/images/winner.png')";
  }

  // Show the money amount if the result is a win
  if (result === 'win') {
    document.getElementById('popupMoney').innerText = ` ${money}`;
    document.getElementById('popupMoney').style.display = 'block';
  } else {
    document.getElementById('popupMoney').style.display = 'none';
  }

  document.body.style.backgroundColor = 'rgba(87, 62, 62, 0.7)';


  // Show the popup
  document.getElementById('resultPopup').style.display = 'block';

  // Add click event listener to the popup element
  const popup = document.getElementById('resultPopup');
  popup.addEventListener('click', () => {
    popup.style.display = 'none';
    document.body.style.backgroundColor = ''; // Reset the background color when the popup is closed

  });
}






$.ajax({
  type: "POST",
  url: "/api/webapi/GetMyEmerdList",
  data: {
    typeid: "1",
    pageno: "0",
    pageto: "10",
    language: "vi",
  },
  dataType: "json",
  success: function (response) {
    let data = response.data.gameslist;
    console.log("hi");
    $(".game-list .con-box:eq(1) .page-nav .number").text("1/" + `${(response.page) ? response.page : '1'}`);
    showListOrder2(data, 1);
  },
});

var pageno = 0;
var limit = 10;
var page = 1;
$(".game-list .con-box:eq(0) .page-nav .arr:eq(1)").click(function (e) {
  e.preventDefault();
  pageno += 10;
  let pageto = limit;
  $.ajax({
    type: "POST",
    url: "/api/webapi/GetNoaverageEmerdList",
    data: {
      typeid: "1",
      pageno: pageno,
      pageto: pageto,
      language: "vi",
    },
    dataType: "json",
    success: function (response) {
      if (response.status === false) {
        pageno -= 10;
        $(".game-list .con-box:eq(0) .page-nav .arr:eq(1)").addClass(
          "block-click"
        );
        $(".game-list .con-box:eq(0) .page-nav .arr:eq(1)").removeClass(
          "action"
        );
        $(".game-list .con-box:eq(0) .page-nav .van-icon-arrow-right").css(
          "color",
          "#7f7f7f"
        );
        alertMessJoin(response.msg);
        return false;
      }
      $(".game-list .con-box:eq(0) .page-nav .arr:eq(0)").removeClass(
        "block-click"
      );
      $(".game-list .con-box:eq(0) .page-nav .arr:eq(0)").addClass("action");
      $(".game-list .con-box:eq(0) .page-nav .van-icon-arrow-left").css(
        "color",
        "#fff"
      );
      page += 1;
      $(".game-list .con-box:eq(0) .page-nav .number").text(
        page + "/" + response.page
      );
      let list_orders = response.data.gameslist;
      $(".time-box .info .number").text(response.period);
      showListOrder(list_orders, 0);
    },
  });
});
$(".game-list .con-box:eq(0) .page-nav .arr:eq(0)").click(function (e) {
  e.preventDefault();
  $(".game-list .con-box:eq(0) .page-nav .arr:eq(1)").removeClass(
    "block-click"
  );
  $(".game-list .con-box:eq(0) .page-nav .arr:eq(1)").addClass("action");
  $(".game-list .con-box:eq(0) .page-nav .van-icon-arrow-right").css(
    "color",
    "#fff"
  );
  pageno -= 10;
  let pageto = limit;
  $.ajax({
    type: "POST",
    url: "/api/webapi/GetNoaverageEmerdList",
    data: {
      typeid: "1",
      pageno: pageno,
      pageto: pageto,
      language: "vi",
    },
    dataType: "json",
    success: function (response) {
      if (page - 1 <= 1) {
        $(".game-list .con-box:eq(0) .page-nav .arr:eq(0)").addClass(
          "block-click"
        );
        $(".game-list .con-box:eq(0) .page-nav .arr:eq(0)").removeClass(
          "action"
        );
        $(".game-list .con-box:eq(0) .page-nav .van-icon-arrow-left").css(
          "color",
          "#7f7f7f"
        );
      }
      if (response.status === false) {
        pageno = 0;
        $(".game-list .con-box:eq(0) .page-nav .arr:eq(0)").addClass(
          "block-click"
        );
        $(".game-list .con-box:eq(0) .page-nav .arr:eq(0)").removeClass(
          "action"
        );
        $(".game-list .con-box:eq(0) .page-nav .van-icon-arrow-left").css(
          "color",
          "#7f7f7f"
        );
        alertMessJoin(response.msg);
        return false;
      }
      page -= 1;
      $(".game-list .con-box:eq(0) .page-nav .number").text(
        page + "/" + response.page
      );
      let list_orders = response.data.gameslist;
      $(".time-box .info .number").text(response.period);
      showListOrder(list_orders, 0);
    },
  });
});

var pageno = 0;
var limit = 10;
var page = 1;
$(".game-list .con-box:eq(1) .page-nav .arr:eq(1)").click(function (e) {
  e.preventDefault();
  pageno += 10;
  let pageto = limit;
  $.ajax({
    type: "POST",
    url: "/api/webapi/GetMyEmerdList",
    data: {
      typeid: "1",
      pageno: pageno,
      pageto: pageto,
      language: "vi",
    },
    dataType: "json",
    success: function (response) {
      if (response.status === false) {
        pageno -= 10;
        $(".game-list .con-box:eq(1) .page-nav .arr:eq(1)").addClass(
          "block-click"
        );
        $(".game-list .con-box:eq(1) .page-nav .arr:eq(1)").removeClass(
          "action"
        );
        $(".game-list .con-box:eq(1) .page-nav .van-icon-arrow-right").css(
          "color",
          "#7f7f7f"
        );
        alertMessJoin(response.msg);
        return false;
      }
      $(".game-list .con-box:eq(1) .page-nav .arr:eq(0)").removeClass(
        "block-click"
      );
      $(".game-list .con-box:eq(1) .page-nav .arr:eq(0)").addClass("action");
      $(".game-list .con-box:eq(1) .page-nav .van-icon-arrow-left").css(
        "color",
        "#fff"
      );
      page += 1;
      console.log(page);
      $(".game-list .con-box:eq(1) .page-nav .number").text(
        "1/" + `${(response.page) ? response.page : '1'}`
      );
      let list_orders = response.data.gameslist;
      $(".time-box .info .number").text(response.period);
      showListOrder2(list_orders, 1);
    },
  });
  setTimeout(() => {
    let check = true;
    $("#history-order .item").click(function (e) {
      e.preventDefault();
      let parent = $(this).parent();
      // let show = parent.children();
      let myVar = parent.find(".details");
      if (check) {
        check = false;
        myVar.fadeIn(0);
      } else {
        check = true;
        myVar.fadeOut(0);
      }
    });
  }, 1000);
});
$(".game-list .con-box:eq(1) .page-nav .arr:eq(0)").click(function (e) {
  e.preventDefault();
  $(".game-list .con-box:eq(1) .page-nav .arr:eq(1)").removeClass(
    "block-click"
  );
  $(".game-list .con-box:eq(1) .page-nav .arr:eq(1)").addClass("action");
  $(".game-list .con-box:eq(1) .page-nav .van-icon-arrow-right").css(
    "color",
    "#fff"
  );
  pageno -= 10;
  let pageto = limit;
  $.ajax({
    type: "POST",
    url: "/api/webapi/GetMyEmerdList",
    data: {
      typeid: "1",
      pageno: pageno,
      pageto: pageto,
      language: "vi",
    },
    dataType: "json",
    success: function (response) {
      if (page - 1 <= 1) {
        $(".game-list .con-box:eq(1) .page-nav .arr:eq(0)").addClass(
          "block-click"
        );
        $(".game-list .con-box:eq(1) .page-nav .arr:eq(0)").removeClass(
          "action"
        );
        $(".game-list .con-box:eq(1) .page-nav .van-icon-arrow-left").css(
          "color",
          "#7f7f7f"
        );
      }
      if (response.status === false) {
        pageno = 0;
        $(".game-list .con-box:eq(1) .page-nav .arr:eq(0)").addClass(
          "block-click"
        );
        $(".game-list .con-box:eq(1) .page-nav .arr:eq(0)").removeClass(
          "action"
        );
        $(".game-list .con-box:eq(1) .page-nav .van-icon-arrow-left").css(
          "color",
          "#7f7f7f"
        );
        alertMessJoin(response.msg);
        return false;
      }
      page -= 1;
      $(".game-list .con-box:eq(1) .page-nav .number").text(
        "1/" + `${(response.page) ? response.page : '1'}`
      );
      let list_orders = response.data.gameslist;
      $(".time-box .info .number").text(response.period);
      showListOrder2(list_orders, 1);
    },
  });
  setTimeout(() => {
    let check = true;
    $("#history-order .item").click(function (e) {
      e.preventDefault();
      let parent = $(this).parent();
      // let show = parent.children();
      let myVar = parent.find(".details");
      if (check) {
        check = false;
        myVar.fadeIn(0);
      } else {
        check = true;
        myVar.fadeOut(0);
      }
    });
  }, 1000);
});

window.onload = function() {
  function cownDownTimer() {
    var countDownDate = new Date("2030-07-16T23:59:59.9999999+01:00").getTime();
    setInterval(function() {
      var now = new Date().getTime();
      var distance = countDownDate - now;
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var minute = Math.ceil(minutes / 20 - 2);
      var seconds1 = Math.floor((distance % (1000 * 60)) / 10000);
      var seconds2 = Math.floor(((distance % (1000 * 60)) / 1000) % 10);
      $(".number .item:eq(3)").text(seconds1);
      $(".number .item:eq(4)").text(seconds2);
    }, 0);
    setInterval(() => {
      var now = new Date().getTime();
      var distance = countDownDate - now;
      var seconds1 = Math.floor((distance % (1000 * 60)) / 10000);
      var seconds2 = Math.floor(((distance % (1000 * 60)) / 1000) % 10);
      if (seconds1 == 0 && seconds2 <= 5) {
        if (clicked) {
          playAudio1();
        }
      }
      if (seconds1 == 5 && seconds2 == 9) {
        if (clicked) {
          playAudio2();
        }
      }
    }, 1000);
    setInterval(function() {
      var now = new Date().getTime();
      var distance = countDownDate - now;
      var seconds1 = Math.floor((distance % (1000 * 60)) / 10000);
      var seconds2 = Math.floor(((distance % (1000 * 60)) / 1000) % 10);
      if (seconds1 == 0 && seconds2 <= 5) {
        $(".van-overlay").fadeOut();
        $(".popup-join").css("transform", "translateY(600px)");
        $(".betting-mark .amount-box .li, .multiple-box .li").css({
          "background-color": "rgb(240, 240, 240)",
          color: "rgb(0, 0, 0)",
        });
        $(".betting-mark .amount-box .li:eq(0), .multiple-box .li:eq(0)").css({
          "background-color": "rgb(240, 240, 240)",
          color: "rgb(255, 255, 255)",
        });
        $(".stepper-box .digit-box input").val(1);
        $(".amount-box").attr("data-money", "1000");
        $(".foot .right span:eq(1)").text(1000 + " ₹");

        $(".box .mark-box ").css("display", "flex");
        $(".box .mark-box .item:eq(0)").text(seconds1);
        $(".box .mark-box .item:eq(1)").text(seconds2);
      } else {
        $(".box .mark-box ").css("display", "none");
      }
    }, 0);
  }

  cownDownTimer();
  setTimeout(() => {
    let check = true;
    $("#history-order .item").click(function(e) {
      e.preventDefault();
      let parent = $(this).parent();
      // let show = parent.children();
      let myVar = parent.find(".details");
      if (check) {
        check = false;
        myVar.fadeIn(0);
      } else {
        check = true;
        myVar.fadeOut(0);
      }
    });
  }, 1000);
};

$('.van-notice-bar__wrap .van-notice-bar__content').css({
  'transition-duration': '48.9715s',
  'transform': 'translateX(-2448.57px)',
});
setInterval(() => {
  $('.van-notice-bar__wrap .van-notice-bar__content').css({
    'transition-duration': '0s',
    'transform': 'translateX(0)',
  });
  setTimeout(() => {
    $('.van-notice-bar__wrap .van-notice-bar__content').css({
    'transition-duration': '48.9715s',
      'transform': 'translateX(-2448.57px)',
    });
  }, 100);
}, 48000);

$('.van-button--default').click(function (e) { 
  e.preventDefault();
  $('.van-popup-vf, .van-overlay').fadeOut(100);
});

$('.circular').click(function (e) { 
  e.preventDefault();
  $('.van-popup-vf, .van-overlay').fadeIn(100);
});

let selectPageTime = Number($('html').attr("data-dpr"));
console.log(selectPageTime - 1);
$(`.game-betting .box .item:eq(${selectPageTime - 1})`).addClass('action');
$(`.game-betting .box .item:eq(${selectPageTime - 1}) .img`).addClass('block-click');
$(`.game-betting .box .item .img .van-image img`).attr('src', '/images/icon_clock-gerrn.webp');
$(`.game-betting .box .item:eq(${selectPageTime - 1}) .img .van-image img`).attr('src', '/images/icon_clock-red.webp');