(function ($) {
  var typing_timer;
  var done_typing_interval = 800;

  jQuery("#fooevents_seating_new_field").on("click", function () {
    fooevents_new_row_field(jQuery(this).attr("name"));
    jQuery(".fooevents_notfound_seating").hide();
    return false;
  });

  jQuery("#fooevents_seating_options_table").on(
    "click",
    ".fooevents_seating_remove",
    function (event) {
      fooevents_delete_row_field(jQuery(this));
      
      // Check if there are any remaining seating options
      if (jQuery(".fooevents_seating_option").length === 0) {
        jQuery(".fooevents_notfound_seating").show();
      }

      return false;
    }
  );

  jQuery("#fooevents_seating_options_table").on(
    "keyup",
    ".fooevents_seating_row_name, .fooevents_seating_options",
    function (event) {
      clearTimeout(typing_timer);
      typing_timer = setTimeout(
        fooevents_update_row_row_ids,
        done_typing_interval,
        jQuery(this)
      );

      return false;
    }
  );

  jQuery("#fooevents_seating_options_table").on(
    "keydown",
    ".fooevents_seating_row_name, .fooevents_seating_options",
    function (event) {
      clearTimeout(typing_timer);
    }
  );

  jQuery("#fooevents_seating_options_table").on(
    "change",
    ".fooevents_seating_variations",
    function (event) {
      fooevents_serialize_options_seating();
    }
  );

  jQuery("#fooevents_seating_options_table").on(
    "change",
    ".fooevents_seating_number_seats",
    function (event) {
      fooevents_serialize_options_seating();
    }
  );

  jQuery("#fooevents_seating_options_table").on(
    "change",
    ".fooevents_seating_type",
    function (event) {
      fooevents_serialize_options_seating();
    }
  );

  fooevents_serialize_options_seating();

  jQuery("table#fooevents_seating_options_table tbody").sortable({
    update: function () {
      fooevents_reorder_rows();
    },
  });


  jQuery(document).ready(function () {
    // initSeats();
    initViewSeatingChart();
  });

  if (jQuery("#woocommerce_events_ticket_details").length) {
    initSeats();
  }

  jQuery("#post").on("submit", function () {
    if (
      jQuery("#WooCommerceEventsProductIsEvent").length &&
      jQuery("#WooCommerceEventsProductIsEvent").val() === "Event" &&
      jQuery("#WooCommerceEventsTypeSeating:checked").length &&
      jQuery("#fooevents_seats_unavailable_serialized").length &&
      jQuery("input#fooevents_seats_changed").length &&
      jQuery("input#fooevents_seats_changed").val() === "no" &&
      jQuery("#original_post_status").val() == "publish"
    ) {
      jQuery("#publish").attr("disabled", "disabled");

      var data = {
        action: "fooevents_refresh_seating_chart",
        event_id: jQuery("#post_ID").val(),
      };

      jQuery.post(FooEventsSeatingObj.ajaxurl, data, function (response) {
        jQuery("input#fooevents_seats_changed").val("yes");

        var result = JSON.parse(response);

        if (result.status === "success") {
          jQuery("#fooevents_seats_unavailable_serialized").val(result.data);
        }

        jQuery("#post").submit();
      });

      return false;
    }

    jQuery("#publish").attr("disabled", false);
    return true;
  });
})(jQuery);

function initSeats() {
  /* Ticket admin edit screen */

  /* Change listener for row dropdown list */
  var rowSelectList = jQuery("#fooevents_seat_row_name");

  buildSeats(rowSelectList, "fooevents_event_" + event_id);

  rowSelectList.change(function () {
    buildSeats(rowSelectList, "fooevents_event_" + event_id);
  });

  /* Build seat number dropdown list */

  var seatSelectList = jQuery("#fooevents_seat_number");

  seatSelectList.change(function () {
    var selectedSeatVal = jQuery(this).val();
    if (selectedSeatVal == "") {
      return;
    }
  });
}

function fooeventsSetSeatDropdowns() {
  var fieldID = jQuery("#fooevents_seating_dialog span.selected")
    .attr("name")
    .split("_");
  jQuery("#fooevents_seat_row_name").val(fieldID[0] + "_row_name");
  jQuery("#fooevents_seat_row_name").change();
  jQuery("#fooevents_seat_number").val(
    jQuery("#fooevents_seating_dialog span.selected").attr("name")
  );
}

var currentSelectedRowNameFull = "";
var currentSelectedRowName = "";
var selectedSeatDropdown = "";
var currentSelectedSeat = "";
var numberSeats = 0;
var variation = 0;
var currentSelectedAttendeeSeatID = "";
var optionsToRemove = [];

/* Builds seats dropdowns according to the number of seats in the "fooevents_seating_data" variable */

function buildSeats($element, eventID) {
  currentSelectedRowNameFull = $element
    .find("option")
    .filter(":selected")
    .val();

  if (fooevents_seating_data != undefined) {
    if (fooevents_seating_data[eventID] != undefined) {
      numberSeats =
        fooevents_seating_data[eventID][currentSelectedRowNameFull][
          "number_seats"
        ];
    }
  }

  if (currentSelectedRowNameFull != undefined) {
    currentSelectedRowName = currentSelectedRowNameFull.substring(
      0,
      currentSelectedRowNameFull.indexOf("_row_name")
    );

    currentSelectedSeatDropdown = jQuery("#fooevents_seat_number");
    if (currentSelectedRowNameFull != fooevents_selected_row) {
      currentSelectedSeatDropdown.html("<option selected></option>");
    } else {
      currentSelectedSeatDropdown.html("<option></option>");
    }

    numberSeats =
      fooevents_seating_data[eventID][currentSelectedRowNameFull][
        "number_seats"
      ];
    var atLeastOneSeat = false;

    for (var i = 1; i <= numberSeats; i++) {
      var seatValueToAdd = currentSelectedRowName + "_number_seats_" + i;
      var seatSelectedAttr = "";
      if (
        fooevents_selected_seat == i &&
        (currentSelectedRowNameFull == fooevents_selected_row ||
          currentSelectedRowNameFull == fooevents_selected_row.toLowerCase())
      ) {
        seatSelectedAttr = " selected";
      }
      if (
        (jQuery.inArray(
          seatValueToAdd,
          fooevents_seats_unavailable[eventID]
        ) === -1 &&
          jQuery.inArray(seatValueToAdd, fooevents_seats_blocked[eventID]) ===
            -1) ||
        fooevents_selected_seat == i
      ) {
        currentSelectedSeatDropdown.append(
          '<option value="' +
            seatValueToAdd +
            '"' +
            seatSelectedAttr +
            ">" +
            i +
            "</option>"
        );
        atLeastOneSeat = true;
      }
    }
    if (!atLeastOneSeat) {
      currentSelectedSeatDropdown.html(
        '<option value="">(No seats available)</option>'
      );
      currentSelectedSeatDropdown
        .closest("select")
        .prop("disabled", "disabled");
    } else {
      currentSelectedSeatDropdown.closest("select").prop("disabled", false);
    }
  }
}

function fooevents_reorder_rows() {
  var data = {};
  var item_num = 1;
  jQuery("#fooevents_seating_new_field")
    .find("tr")
    .each(function () {
      var id = jQuery(this).attr("id");
      if (id) {
        jQuery(this).attr("id", item_num + "_option");
        jQuery(this)
          .find(".fooevents_seating_row_name")
          .each(function () {
            jQuery(this).attr("id", item_num + "_row_name");
          });

        jQuery(this)
          .find(".fooevents_seating_row_name")
          .each(function () {
            jQuery(this).attr("id", item_num + "_row_name");
            jQuery(this).attr("name", item_num + "_row_name");
          });

        jQuery(this)
          .find(".fooevents_seating_number_seats")
          .each(function () {
            jQuery(this).attr("id", item_num + "_number_seats");
            jQuery(this).attr("name", item_num + "_number_seats");
          });

        jQuery(this)
          .find(".fooevents_seating_variations")
          .each(function () {
            jQuery(this).attr("id", item_num + "_options");
            jQuery(this).attr("name", item_num + "_options");
          });

        jQuery(this)
          .find(".fooevents_seating_type")
          .each(function () {
            jQuery(this).attr("id", item_num + "_type");
            jQuery(this).attr("name", item_num + "_type");
          });

        jQuery(this)
          .find(".fooevents_seating_remove")
          .each(function () {
            jQuery(this).attr("id", item_num + "_remove");
            jQuery(this).attr("name", item_num + "_remove");
          });

        item_num++;
      }
    });

  fooevents_serialize_options_seating();
}

function refresh_seating_chart() {
  jQuery("#fooevents_seating_chart").attr("disabled", "disabled");
  jQuery("#seating_chart_refresh").prop("disabled", true);

  var data = {
    action: "fooevents_refresh_seating_chart",
    event_id: jQuery("#post_ID").val(),
  };

  jQuery.post(FooEventsSeatingObj.ajaxurl, data, function (response) {
    jQuery("#fooevents_seating_chart").removeAttr("disabled");
    jQuery("#seating_chart_refresh").prop("disabled", false);

    var result = JSON.parse(response);

    if (result.status === "error") {
      //show error message
    } else {
      jQuery("#fooevents_seats_unavailable_serialized").val(result.data);
      showSeatingChart();
      initSeatClick(jQuery("#fooevents_seating_dialog"));
    }
  });
}

function initSeatClick(thisDialog) {
  thisDialog.find("span").on("click", function () {
    if (jQuery(this).hasClass("selected")) {
      jQuery(this).removeClass("selected");
      if (jQuery(this).hasClass("unavailable")) {
        jQuery(this).css("backgroundColor", "#999999");
      } else {
        if (jQuery(this).hasClass("fe-blocked"))
          jQuery(this).css("backgroundColor", "#dddddd");
        else jQuery(this).css("backgroundColor", seatColor);
      }
    } else {
      jQuery(this).addClass("selected");

      jQuery(this).css("backgroundColor", seatColorSelected);
    }
  });
}

function showSeatingChart() {
  var viewportWidth = window.innerWidth - 20;
  var viewportHeight = window.innerHeight - 20;
  if (viewportWidth > 1000) viewportWidth = 1000;
  if (viewportHeight > 500) viewportHeight = 500;

  jQuery("#fooevents_seating_dialog").html("");
  var chartOptions =
    '<div id="seating_chart_manager"><select name="seating_chart_action" id="seating_chart_selector"><option value="seating_chart_available">' +
    FooEventsSeatingObj.selectedSeatsAvailable +
    '</option><option value="seating_chart_unavailable">' +
    FooEventsSeatingObj.selectedSeatsUnavailable +
    '</option><option value="seating_chart_blocked">' +
    FooEventsSeatingObj.selectedSeatsBlock +
    '</option><option value="seating_chart_add_aisles">' +
    FooEventsSeatingObj.selectedSeatsAddAisles +
    '</option><option value="seating_chart_remove_aisles">' +
    FooEventsSeatingObj.selectedSeatsRemoveAisles +
    '</option></select><input type="submit" id="seating_chart_do_action" class="button action" value="' +
    FooEventsSeatingObj.selectedSeatsApply +
    '"><input type="button" id="seating_chart_refresh" class="button" value="' +
    FooEventsSeatingObj.refreshSeats +
    '"></div>';
  jQuery("#fooevents_seating_dialog").append(chartOptions);
  jQuery("#fooevents_seating_dialog").append(
    "<div class='fooevents_seating_chart_disclaimer'>" +
      FooEventsSeatingObj.selectedSeatsDisclaimer1 +
      "</div>"
  );
  jQuery("#fooevents_seating_dialog").append(
    "<div class='fooevents_seating_chart_front'>" +
      FooEventsSeatingObj.chartFront +
      "</div>"
  );

  setTimeout(function () {
    setContainerWidthForTables();
  }, 100);

  var currentSelectedSeat = "";
  var unavailableSeatsArray = JSON.parse(
    jQuery("#fooevents_seats_unavailable_serialized").val()
  );
  var blockedSeatsArray = JSON.parse(
    jQuery("#fooevents_seats_blocked_serialized").val()
  );
  var aisleSeatsArray = JSON.parse(
    jQuery("#fooevents_seats_aisles_serialized").val()
  );

  jQuery("#seating_chart_manager").on(
    "click",
    "#seating_chart_refresh",
    function () {
      refresh_seating_chart();
    }
  );

  /* When seating chart dropdown "Apply" is clicked */
  jQuery("#seating_chart_manager").on(
    "click",
    "#seating_chart_do_action",
    function () {
      jQuery("#fooevents_seats_changed").val("yes");

      /* Look which seats are selected */
      jQuery(".fooevents_seating_chart_view_row span").each(function () {
        /* Make seats available */
        if (
          jQuery("#seating_chart_selector").val() == "seating_chart_available"
        ) {
          if (jQuery(this).hasClass("selected")) {
            currentSelectedSeat = jQuery(this).attr("id").substr(6);

            /* Remove selected seat if it is in unavailable array */
            var indexOfSeatToRemove =
              unavailableSeatsArray.indexOf(currentSelectedSeat);
            if (indexOfSeatToRemove != -1) {
              unavailableSeatsArray.splice(indexOfSeatToRemove, 1);

              jQuery(this).removeClass("unavailable");
            }

            /* Remove selected seat if it is in blocked array */
            var indexOfSeatToBlock =
              blockedSeatsArray.indexOf(currentSelectedSeat);
            if (indexOfSeatToBlock != -1) {
              blockedSeatsArray.splice(indexOfSeatToBlock, 1);

              jQuery(this).removeClass("fe-blocked");
            }

            jQuery(this).removeClass("selected");
            jQuery(this).css("backgroundColor", seatColor);
            jQuery(this).addClass("available");
          }
        }

        /* Make seats unavailable */
        if (
          jQuery("#seating_chart_selector").val() == "seating_chart_unavailable"
        ) {
          if (jQuery(this).hasClass("selected")) {
            currentSelectedSeat = jQuery(this).attr("id").substr(6);

            /* If selected seat is already in unavailable array, do nothing, otherwise add */
            var indexOfSeatToAdd =
              unavailableSeatsArray.indexOf(currentSelectedSeat);
            if (indexOfSeatToAdd == -1) {
              unavailableSeatsArray.push(currentSelectedSeat);

              jQuery(this).removeClass("available");
            }

            /* Remove selected seat if it is in blocked array */
            var indexOfSeatToBlock =
              blockedSeatsArray.indexOf(currentSelectedSeat);
            if (indexOfSeatToBlock != -1) {
              blockedSeatsArray.splice(indexOfSeatToBlock, 1);

              jQuery(this).removeClass("fe-blocked");
            }

            jQuery(this).removeClass("selected");
            jQuery(this).css("backgroundColor", "#999999");
            jQuery(this).addClass("unavailable");
          }
        }

        /* Block seats */
        if (
          jQuery("#seating_chart_selector").val() == "seating_chart_blocked"
        ) {
          if (jQuery(this).hasClass("selected")) {
            currentSelectedSeat = jQuery(this).attr("id").substr(6);

            /* If selected seat is already in blocked array i.e. is blocked, do nothing, otherwise add */
            var indexOfSeatToBlock =
              blockedSeatsArray.indexOf(currentSelectedSeat);
            if (indexOfSeatToBlock == -1) {
              blockedSeatsArray.push(currentSelectedSeat);

              jQuery(this).removeClass("available");
            }

            /* Remove selected seat if it is in unavailable array */
            var indexOfSeatToRemove =
              unavailableSeatsArray.indexOf(currentSelectedSeat);
            if (indexOfSeatToRemove != -1) {
              unavailableSeatsArray.splice(indexOfSeatToRemove, 1);

              jQuery(this).removeClass("unavailable");
            }

            jQuery(this).removeClass("selected");
            jQuery(this).css("backgroundColor", "#dddddd");
            jQuery(this).addClass("fe-blocked");
          }
        }

        /* Add aisles to seats */
        if (
          jQuery("#seating_chart_selector").val() == "seating_chart_add_aisles"
        ) {
          if (jQuery(this).hasClass("selected")) {
            currentSelectedSeat = jQuery(this).attr("id").substr(6);

            /* If selected seat is already in aisle array , do nothing, otherwise add */
            var indexOfSeatToAddAisle =
              aisleSeatsArray.indexOf(currentSelectedSeat);
            if (indexOfSeatToAddAisle == -1) {
              aisleSeatsArray.push(currentSelectedSeat);
            }

            jQuery(this).addClass("aisle");
          }
        }

        /* Remove aisles */
        if (
          jQuery("#seating_chart_selector").val() ==
          "seating_chart_remove_aisles"
        ) {
          if (jQuery(this).hasClass("selected")) {
            currentSelectedSeat = jQuery(this).attr("id").substr(6);

            /* Remove selected seat if it is in aisles array */
            var indexOfSeatToRemove =
              aisleSeatsArray.indexOf(currentSelectedSeat);
            if (indexOfSeatToRemove != -1) {
              aisleSeatsArray.splice(indexOfSeatToRemove, 1);

              jQuery(this).removeClass("aisle");
            }
          }
        }
      });

      jQuery("#fooevents_seats_unavailable_serialized").val(
        JSON.stringify(unavailableSeatsArray)
      );
      jQuery("#fooevents_seats_blocked_serialized").val(
        JSON.stringify(blockedSeatsArray)
      );
      jQuery("#fooevents_seats_aisles_serialized").val(
        JSON.stringify(aisleSeatsArray)
      );
    }
  );

  var rowName = "";
  var rowID = "";
  var numberSeats = 0;
  var seats = "";
  var unavailableSeats = "";
  var blockedSeats = "";
  var aisleSeats = "";
  var currentRow = "";
  var seatClass = "available";

  if (seatColor == "#" || seatColor == "#1") seatColor = "#549E39";

  seatColorStyleAvailable = " style='background-color:" + seatColor + "'";

  if (seatColorSelected == "#" || seatColorSelected == "#1")
    seatColorSelected = "#be3737";

  seatColorStyleSelected =
    " style='background-color:" + seatColorSelected + "'";

  var seatOuterContainer = jQuery("<div class='seat_container' />");
  var seatContainer = "";

  jQuery("#fooevents_seating_options_table tbody tr").each(function () {
    rowName = jQuery(this).find(".fooevents_seating_row_name").val();
    rowID = jQuery(this).find(".fooevents_seating_row_name").attr("id");
    numberSeats = jQuery(this).find(".fooevents_seating_number_seats").val();
    seatType = jQuery(this).find(".fooevents_seating_type").val();
    seatTypeClass = jQuery(this).find(".fooevents_seating_type").val();
    if (seatType == "table_new_row") {
      seatTypeClass = "table table_new_row";
    }
    seatContainer = jQuery(
      "<div class='fooevents_seating_chart_container row_container " +
        seatTypeClass +
        "' id='fooevents_seating_chart_container_" +
        rowID.substring(0, rowID.indexOf("_row_name")) +
        "'/>"
    );
    seatContainer.append(
      "<div class='fooevents_seating_chart_view_row_name " +
        seatTypeClass +
        "' id='" +
        rowID +
        "'>" +
        rowName +
        "</div>"
    );
    seats = jQuery("<div>", {
      class: "fooevents_seating_chart_view_row " + seatTypeClass,
    });

    unavailableSeats = unavailableSeatsArray;
    blockedSeats = blockedSeatsArray;
    aisleSeats = aisleSeatsArray;

    currentRow =
      rowID.substring(0, rowID.indexOf("_row_name")) + "_number_seats_";

    if (seatType == "table" || seatType == "table_new_row") {
      numberSeatsTableSize = 8;
      if (numberSeats > 8) {
        numberSeatsTableSize = numberSeats;
      }

      seats.css("width", numberSeatsTableSize * 15 - 31 + "px");
      seats.css("height", numberSeatsTableSize * 15 - 31 + "px");
      var theta = [];
      var frags = 360 / numberSeats;
      for (var i = 0; i <= numberSeats; i++) {
        theta.push((frags / 180) * i * Math.PI);
      }
    }

    for (var i = 1; i <= numberSeats; i++) {
      if (
        unavailableSeats !== undefined &&
        unavailableSeats.indexOf(currentRow + i) > -1
      )
        seatClass = "unavailable";

      if (
        blockedSeats !== undefined &&
        blockedSeats.indexOf(currentRow + i) > -1
      )
        seatClass = "fe-blocked";

      if (aisleSeats !== undefined && aisleSeats.indexOf(currentRow + i) > -1)
        seatClass += " aisle";

      if (seatClass == "available" || seatClass == "available aisle") {
        var seat = jQuery(
          "<span id='chart_" +
            currentRow +
            i +
            "' class='" +
            seatClass +
            "'" +
            seatColorStyleAvailable +
            ">" +
            i +
            "</span>"
        );
      } else {
        var seat = jQuery(
          "<span id='chart_" +
            currentRow +
            i +
            "' class='" +
            seatClass +
            "'>" +
            i +
            "</span>"
        );
      }

      if (seatType == "table" || seatType == "table_new_row") {
        var mainHeight = numberSeatsTableSize * 15;
        var r = mainHeight / 2;
        seat.position.top = Math.round(r * Math.cos(theta[i])) - 28 + "px";
        seat.position.left = Math.round(r * Math.sin(theta[i])) + 28 + "px";
        seat.css("position", "absolute");
        seat.css(
          "top",
          mainHeight / 2 - parseInt(seat.position.left.slice(0, -2)) + "px"
        );
        seat.css(
          "left",
          mainHeight / 2 + parseInt(seat.position.top.slice(0, -2)) + "px"
        );
      }

      jQuery(seats).append(seat);

      seatClass = "available";
    }

    seatContainer.append(seats);
    seatOuterContainer.append(seatContainer);
  });

  jQuery("#fooevents_seating_dialog").append(seatOuterContainer);

  if (jQuery("#fooevents_seating_dialog").is(":empty")) {
    jQuery("#fooevents_seating_dialog").append(
      "<div style='margin-top:20px'>" +
        FooEventsSeatingObj.chartNoSeatsToShow +
        "</div>"
    );
  }

  jQuery("#fooevents_seating_dialog").dialog({
    width: "50%",
    maxWidth: "768px",
    height: "auto",
    maxHeight: "768px",

    open: function () {
      var thisDialog = jQuery(this);
      thisDialog.find("span").on("click", function () {
        var str = jQuery(this).attr("class");

        if (jQuery(this).hasClass("selected")) {
          jQuery(this).removeClass("selected");
          if (jQuery(this).hasClass("unavailable")) {
            jQuery(this).css("backgroundColor", "#999999");
          } else {
            if (jQuery(this).hasClass("fe-blocked"))
              jQuery(this).css("backgroundColor", "#dddddd");
            else jQuery(this).css("backgroundColor", seatColor);
          }
        } else {
          jQuery(this).addClass("selected");

          jQuery(this).css("backgroundColor", seatColorSelected);
        }
      });

      refresh_seating_chart();
    },
  });
}

/* View and make seats available, unavaliable, blocked and add aisles on seating chart on event */

jQuery("#fooevents_seating_chart").on("click", function () {
  showSeatingChart();
});

function initViewSeatingChart() {
  /* View seating chart on ticket */

  jQuery(".fooevents_seating_chart_admin").on("click", function () {
    var seatingChartButton = jQuery(this);

    var currentVariation = jQuery(this).attr("name");
    var viewportWidth = window.innerWidth - 20;
    var viewportHeight = window.innerHeight - 20;
    if (viewportWidth > 1000) viewportWidth = 1000;
    if (viewportHeight > 500) viewportHeight = 500;

    jQuery("#fooevents_seating_dialog").html("");

    var rowName = "";
    var rowID = "";
    var eventID = jQuery(this).attr("id").substring(19);
    var numberSeats = 0;
    var seats = "";
    var unavailableSeats = "";
    var blockedSeats = "";
    var aisleSeats = "";
    var currentRow = "";
    var seatClass = "available";

    if (seatColor == "#" || seatColor == "#1") seatColor = "#549E39";

    seatColorStyleAvailable = " style='background-color:" + seatColor + "'";

    if (seatColorSelected == "#" || seatColorSelected == "#1")
      seatColorSelected = "#be3737";

    seatColorStyleSelected =
      " style='background-color:" + seatColorSelected + "'";

    if (seatColorUnavailableSelected == "#")
      seatColorUnavailableSelected = "#be7337";

    seatColorStyleUnavailableSelected =
      " style='background-color:" + seatColorUnavailableSelected + "'";

    var seatColorStyle = seatColorStyleAvailable;

    if (jQuery(".input-text.qty").val() != undefined) {
      var attendeeLabel =
        fooevents_seating_translations["fooevents_event_" + eventID]
          .chartSelectedForAttendee;
    } else {
      var attendeeLabel =
        fooevents_seating_translations["fooevents_event_" + eventID]
          .chartThisSelected;
    }

    jQuery("#fooevents_seating_dialog").append(
      "<div class='fooevents_seating_chart_disclaimer'>" +
        fooevents_seating_translations["fooevents_event_" + eventID]
          .selectedSeatsDisclaimer2 +
        "</div>"
    );
    jQuery("#fooevents_seating_dialog").append(
      "<div class='fooevents_seating_chart_legend'><div id='fooevents_seating_available'" +
        seatColorStyleAvailable +
        "></div> " +
        fooevents_seating_translations["fooevents_event_" + eventID]
          .chartAvailable +
        "<div id='fooevents_seating_unavailable'></div> " +
        fooevents_seating_translations["fooevents_event_" + eventID]
          .chartBooked +
        "<div id='fooevents_seating_blocked'></div> " +
        fooevents_seating_translations["fooevents_event_" + eventID]
          .chartBlocked +
        "<div id='fooevents_seating_selected'" +
        seatColorStyleSelected +
        "></div> " +
        attendeeLabel +
        "</div>"
    );
    jQuery("#fooevents_seating_dialog").append(
      "<div class='fooevents_seating_chart_front'>" +
        fooevents_seating_translations["fooevents_event_" + eventID]
          .chartFront +
        "</div>"
    );

    var seatContainer = jQuery("<div class='seat_container' />");
    var matchedVarIDs = [];
    var rowsToShowOnChartArray = [];
    var rowsToShowOnChart = jQuery(this).siblings(".seating-class-row");
    rowsToShowOnChart.find("select option").each(function () {
      rowsToShowOnChartArray.push(this.value);
    });

    jQuery.each(
      fooevents_seats_options_serialized[eventID],
      function (unusedKey, value) {
        var keys = Object.keys(value);
        if (
          jQuery.inArray(keys[0], rowsToShowOnChartArray) > -1 &&
          value[keys[2]] != "default"
        ) {
          matchedVarIDs.push(parseInt(value[keys[2]]));
        }
      }
    );

    jQuery.each(
      fooevents_seats_options_serialized[eventID],
      function (unusedKey, value) {
        var keys = Object.keys(value);
        rowID = keys[0];
        rowName = value[keys[0]];
        seatType = value[keys[3]];
        seatTypeClass = value[keys[3]];
        if (seatType == "table_new_row") {
          seatTypeClass = "table table_new_row";
        }

        currentVariationID = currentVariation.substr(20);

        if (
          jQuery.inArray(parseInt(value[keys[2]]), matchedVarIDs) > -1 ||
          value[keys[2]] == "default"
        ) {
          var rowContainer = jQuery(
            "<div id='fooevents_variation_" +
              value[keys[2]] +
              "' class='row_container " +
              seatTypeClass +
              "' />"
          );

          numberSeats = value[keys[1]];
          rowContainer.append(
            "<div class='fooevents_seating_chart_view_row_name " +
              seatTypeClass +
              "' id='" +
              rowID +
              "'>" +
              rowName +
              "</div>"
          );
          seats = jQuery("<div>", {
            class:
              "fooevents_seating_chart_view_row fooevents_seating_chart_view_row_checkout " +
              seatTypeClass,
          });

          if (fooevents_seats_unavailable_serialized != null) {
            if (
              typeof fooevents_seats_unavailable_serialized[eventID] !=
              undefined
            ) {
              unavailableSeats = JSON.stringify(
                fooevents_seats_unavailable_serialized[eventID]
              );
            } else {
              unavailableSeats = JSON.stringify(
                fooevents_seats_unavailable_serialized
              );
            }
          }

          if (fooevents_seats_blocked_serialized != null) {
            if (
              typeof fooevents_seats_blocked_serialized[eventID] != undefined
            ) {
              blockedSeats = JSON.stringify(
                fooevents_seats_blocked_serialized[eventID]
              );
            } else {
              blockedSeats = JSON.stringify(fooevents_seats_blocked_serialized);
            }
          }

          if (fooevents_seats_aisles_serialized != null) {
            if (
              typeof fooevents_seats_aisles_serialized[eventID] != undefined
            ) {
              aisleSeats = JSON.stringify(
                fooevents_seats_aisles_serialized[eventID]
              );
            } else {
              aisleSeats = JSON.stringify(fooevents_seats_aisles_serialized);
            }
          }

          currentRow =
            rowID.substring(0, rowID.indexOf("_row_name")) + "_number_seats_";

          if (seatType == "table" || seatType == "table_new_row") {
            numberSeatsTableSize = 8;
            if (numberSeats > 8) {
              numberSeatsTableSize = numberSeats;
            }

            seats.css("width", numberSeatsTableSize * 15 - 31 + "px");
            seats.css("height", numberSeatsTableSize * 15 - 31 + "px");
            var theta = [];
            var frags = 360 / numberSeats;
            for (var i = 0; i <= numberSeats; i++) {
              theta.push((frags / 180) * i * Math.PI);
            }
          }

          for (var i = 1; i <= numberSeats; i++) {
            if (
              unavailableSeats !== undefined &&
              unavailableSeats.indexOf(currentRow + i + '"') > -1
            ) {
              seatClass = "unavailable";
              seatColorStyle = "";
            }

            if (
              blockedSeats !== undefined &&
              blockedSeats.indexOf(currentRow + i + '"') > -1
            ) {
              seatClass = "fe-blocked";
              seatColorStyle = "";
            }

            if (
              aisleSeats !== undefined &&
              aisleSeats.indexOf(currentRow + i + '"') > -1
            ) {
              seatClass += " aisle";
            }

            var seat = jQuery(
              "<span name='" +
                rowID.replace("_row_name", "") +
                "_number_seats_" +
                i +
                "'" +
                seatColorStyle +
                " class='" +
                seatClass +
                "'>" +
                i +
                "</span>"
            );

            if (seatType == "table" || seatType == "table_new_row") {
              var mainHeight = numberSeatsTableSize * 15;
              var r = mainHeight / 2;
              seat.position.top =
                Math.round(r * Math.cos(theta[i])) - 28 + "px";
              seat.position.left =
                Math.round(r * Math.sin(theta[i])) + 28 + "px";
              seat.css("position", "absolute");
              seat.css(
                "top",
                mainHeight / 2 -
                  parseInt(seat.position.left.slice(0, -2)) +
                  "px"
              );
              seat.css(
                "left",
                mainHeight / 2 + parseInt(seat.position.top.slice(0, -2)) + "px"
              );
            }

            jQuery(seats).append(seat);

            seatClass = "available";

            seatColorStyle = seatColorStyleAvailable;
          }

          rowContainer.append(seats);
          seatContainer.append(rowContainer);
        }
      }
    );

    function appendSeats() {
      jQuery("#fooevents_seating_dialog").append(seatContainer);
    }

    appendSeats();

    setTimeout(function () {
      setContainerWidthForTables();
    }, 100);

    jQuery("#fooevents_seating_dialog").dialog({
      width: "100%",
      maxWidth: "768px",
      height: "auto",
      maxHeight: "768px",
      show: {
        effect: "drop",
        direction: "up",
        duration: 1000,
      },

      open: function () {
        var thisDialog = jQuery(this);
        currentSelectedSeat =
          fooevents_selected_row.substring(
            0,
            fooevents_selected_row.indexOf("_row_name")
          ) +
          "_number_seats_" +
          fooevents_selected_seat;
        thisDialog
          .find('span[name="' + currentSelectedSeat + '"]')
          .addClass("available")
          .removeClass("unavailable")
          .css("backgroundColor", seatColor);
        thisDialog
          .find(
            'span[name="' +
              seatingChartButton.prev().prev().find("select").val() +
              '"]'
          )
          .addClass("selected")
          .addClass("available")
          .removeClass("unavailable")
          .css("backgroundColor", seatColorSelected);

        /* Making seats selectable */
        thisDialog.find(".available").on("click", function () {
          thisDialog
            .find(".available")
            .removeClass("selected")
            .css("backgroundColor", seatColor);

          jQuery(this).addClass("selected");
          jQuery(this).css("backgroundColor", seatColorSelected);
          fooeventsSetSeatDropdowns();
          jQuery("#fooevents_seating_dialog").dialog("close");
        });
      },
    });
  });
}

function get_variations(opt_num) {
  var productID = jQuery("#post_ID").val();
  var the_variations = "";
  var dataVariations = {
    action: "fetch_woocommerce_variations",
    productID: productID,
    dataType: "json",
  };

  the_variations = jQuery
    .post(ajaxurl, dataVariations, function (response) {
      if (response) {
        return response;
      }
    })
    .done(function (data) {
      option_pos_start = data.indexOf("<option");
      option_pos_end = data.lastIndexOf("</select>");
      data = data.substring(option_pos_start, option_pos_end);
      jQuery("#" + opt_num + "_WooCommerceEventsSelectedVariation").append(
        data
      );
    });
}

function fooevents_new_row_field(rowName) {
  var opt_num = jQuery("#fooevents_seating_options_table tr").length;
  var field_id = fooevents_seating_make_id(20);

  var sort = '<span class="dashicons dashicons-menu"></span>';
  var row_name =
    '<input type="text" id="' +
    field_id +
    '_row_name" name="' +
    field_id +
    '_row_name" class="fooevents_seating_row_name" value="' +
    (rowName !== undefined ? rowName : "Row") +
    opt_num +
    '" autocomplete="off" maxlength="50" />';
  var number_seats =
    '<input data-current="' +
    field_id +
    '_number_seats" class="fooevents_seating_number_seats" type="number" id="' +
    field_id +
    '_number_seats" name="' +
    field_id +
    '_number_seats" min="1" max="400" value="1">';
  var variations =
    '<select class="fooevents_seating_variations" id="' +
    field_id +
    '_variations" name="' +
    field_id +
    '_variations" multiple>' +
    jQuery("#fooevents_variations").html() +
    "</select>";
  var type =
    '<select class="fooevents_seating_type" id="' +
    field_id +
    '_type" name="' +
    field_id +
    '_type">' +
    jQuery("#fooevents_seat_types").html() +
    "</select>";
  var remove =
    '<a href="#" id="' +
    field_id +
    '_remove" name="' +
    field_id +
    '_remove" class="fooevents_seating_remove" class="fooevents_seating_remove">[X]</a>';
  var new_field =
    '<tr id="' +
    field_id +
    '" class="fooevents_seating_option"><td>' +
    sort +
    "</td><td>" +
    row_name +
    "</td><td>" +
    number_seats +
    "</td><td>" +
    variations +
    "</td><td>" +
    type +
    "</td><td>" +
    remove +
    "</td></tr>";

  jQuery("#fooevents_seating_options_table tbody").append(new_field);
  fooevents_serialize_options_seating();
}

function fooevents_delete_row_field(row) {
  row.closest("tr").remove();
  fooevents_serialize_options_seating();
}

function fooevents_change_row_field_type(row) {
  row.closest(".fooevents_seating_options").remove();
}

function fooevents_update_row_row_ids(row) {
  fooevents_serialize_options_seating();
  fooevents_serialize_unavailable_seating();
  fooevents_serialize_blocked_seating();
}

function fooevents_encode_input(input) {
  var output = input.toLowerCase();
  output = output.replace(/ /g, "_");

  return output;
}

function fooevents_get_row_option_names() {
  var IDs = [];
  jQuery("#fooevents_seating_options_table")
    .find("tr")
    .each(function () {
      IDs.push(this.id);
    });

  return IDs;
}

function fooevents_check_if_option_exists(value) {
  value = value + "_option";

  var IDs = fooevents_get_row_option_names();

  if (jQuery.inArray(value, IDs) !== -1) {
    alert("Row name is already in use");
  }
}

function fooevents_serialize_options_seating() {
  var data = {};
  var item_num = 0;
  jQuery("#fooevents_seating_options_table tbody")
    .find("tr")
    .each(function () {
      var id = jQuery(this).attr("id");
      if (id) {
        var row = {};
        jQuery(this)
          .find("input,select,textarea")
          .each(function () {
            var thisVal = jQuery(this).val();

            if (
              jQuery(this).attr("name").includes("_variations") &&
              thisVal === ""
            ) {
              thisVal = "default";
            }

            row[jQuery(this).attr("name")] = thisVal;
          });

        data[id] = row;
      }

      item_num++;
    });

  data = JSON.stringify(data);

  jQuery("#fooevents_seating_options_serialized").val(data);
}

function fooevents_serialize_unavailable_seating() {
  var currentUnavailableArray = jQuery(
    "#fooevents_seats_unavailable_serialized"
  ).val();
  var currentValue = "";

  jQuery("#fooevents_seating_options_table tbody")
    .find("tr")
    .each(function () {
      var id = jQuery(this).attr("id");
      if (id) {
        jQuery(this)
          .find(".fooevents_seating_number_seats")
          .each(function () {
            currentValue = jQuery(this).attr("data-current");

            while (
              currentUnavailableArray.indexOf(currentValue) > -1 &&
              currentValue != jQuery(this).attr("id")
            ) {
              currentUnavailableArray = currentUnavailableArray.replace(
                currentValue,
                jQuery(this).attr("id")
              );
            }

            jQuery(this).attr("data-current", jQuery(this).attr("id"));
          });
      }
    });

  jQuery("#fooevents_seats_unavailable_serialized").val(
    currentUnavailableArray
  );
}

function fooevents_serialize_blocked_seating() {
  var currentBlockedArray = jQuery("#fooevents_seats_blocked_serialized").val();
  var currentValue = "";

  jQuery("#fooevents_seating_options_table tbody")
    .find("tr")
    .each(function () {
      var id = jQuery(this).attr("id");
      if (id) {
        jQuery(this)
          .find(".fooevents_seating_number_seats")
          .each(function () {
            currentValue = jQuery(this).attr("data-current");

            while (
              currentBlockedArray.indexOf(currentValue) > -1 &&
              currentValue != jQuery(this).attr("id")
            ) {
              currentBlockedArray = currentBlockedArray.replace(
                currentValue,
                jQuery(this).attr("id")
              );
            }

            jQuery(this).attr("data-current", jQuery(this).attr("id"));
          });
      }
    });

  jQuery("#fooevents_seats_blocked_serialized").val(currentBlockedArray);
}

function fooevents_seating_make_id(length) {
  var result = "";
  var characters = "abcdefghijklmnopqrstuvwxyz";
  var charactersLength = characters.length;

  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function setContainerWidthForTables() {
  var tableRowWidth = 0;
  var tableRowWidths = [];
  var maxWidth = 0;
  /* Set width of seatContainer if tables are used */
  jQuery(".seat_container div.row_container.table").each(function () {
    tableRowWidth = tableRowWidth + jQuery(this).width();

    if (jQuery(this).next().hasClass("table_new_row")) {
      tableRowWidths.push(tableRowWidth);
      tableRowWidth = 0;
    }
    maxWidth = Math.max.apply(Math, tableRowWidths);
  });

  if (maxWidth > 0) {
    jQuery(".seat_container").css("width", maxWidth);
    jQuery(".fooevents_seating_chart_front").css("width", maxWidth - 25);
  }
}
