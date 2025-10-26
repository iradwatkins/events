(function ($) {
  jQuery(document).ready(function () {
    if (jQuery(".fooevents_seating_chart").length) {
      jQuery(".product").addClass("seating-event");
    }

    jQuery(".seating-event .qty").hide();
    jQuery(".theme-Avada .seating-event .quantity").hide();
    jQuery(".theme-astra .seating-event .quantity").hide();

    /* If this is a product page and a product with variations, only show the Choose Seats button if variations are selected */

    if (typeof variationsToShow !== "undefined") {
      if (
        variationsToShow != "none" &&
        jQuery(".variations_form").length > 0 &&
        jQuery(".fooevents_seating_chart").length
      ) {
        jQuery("a.fooevents_seating_chart").hide();
        jQuery(".seating-event .qty").show();
        jQuery(".theme-Avada .seating-event .quantity").show();
        jQuery(".theme-astra .seating-event .quantity").show();
        jQuery(".seating-event .single_add_to_cart_button")
          .prop("disabled", false)
          .removeClass("disabled");
      }
    }

    /* Disable Add to Cart and Select Seats button unless at least one seat is selected */
    if (
      jQuery(".seating-event .qty").val() != undefined &&
      jQuery(".fooevents_seating_chart").length
    ) {
      jQuery(".seating-event .single_add_to_cart_button")
        .prop("disabled", "disabled")
        .addClass("disabled");
    }

    /* Build seat dropdowns */

    jQuery(".seating-class-row").each(function () {
      setOtherDropdowns();
      var eventID = findIDs(jQuery(this));
      buildSeats(jQuery(this), eventID[0], eventID[1].substring(20));
      var currentP = jQuery(this);
      currentP.find("select").change(function () {
        if (
          jQuery(this).attr("data-value") == undefined ||
          jQuery(this).attr("data-value") != jQuery(this).val()
        ) {
          jQuery(this).attr("data-value", jQuery(this).val());
          setOtherDropdowns();
          buildSeats(currentP, eventID[0], eventID[1].substring(20));
        }
      });
    });

    jQuery(".seating-class-seat").each(function () {
      var paragraphContainer = jQuery(this);
      var eventID = findIDs(jQuery(this));
      eventID = eventID[0];
      paragraphContainer.find("select").change(function () {
        var changedSelect = jQuery(this);

        var alreadySelected = false;

        var selectedSeatVal = jQuery(this).val();
        if (selectedSeatVal == "") {
          return;
        }

        jQuery(".seating-class-seat select")
          .not(this)
          .each(function () {
            var thisEventID = findIDs(
              jQuery(this).closest(".seating-class-seat")
            );

            if (
              jQuery(this).val() == selectedSeatVal &&
              thisEventID[0] == eventID
            ) {
              alreadySelected = true;
            }
          });

        if (alreadySelected) {
          var selectedSeatNumber = changedSelect
            .find("option")
            .filter(":selected")
            .text();
          var selectedMessage = jQuery(
            "<p class='woocommerce-error seat_selected_message' style='display:none'>" +
              fooevents_seating_translations[eventID].chartSeat +
              selectedSeatNumber +
              " " +
              fooevents_seating_translations[eventID].chartAlreadySelected +
              "</p>"
          );
          paragraphContainer.append(selectedMessage);

          changedSelect.val("");

          selectedMessage
            .slideDown()
            .delay(3000)
            .slideUp(function () {
              jQuery(this).remove();
            });
        }
      });
    });

    jQuery(".seating-class-seat select").each(function () {
      var seatSelectID = jQuery(this).attr("id");
      var eventNr = seatSelectID.substr(
        22,
        seatSelectID.lastIndexOf("__") - 22
      );
      var attendeeNr = seatSelectID.substr(seatSelectID.lastIndexOf("__") + 2);
      if (typeof selectedSeat[eventNr] !== "undefined") {
        jQuery(this).val(selectedSeat[eventNr][attendeeNr]);
      }
    });
  });
})(jQuery);

/* Finds the ID of the current event */

function findIDs($element) {
  var theClasses = $element.attr("class").split(" ");
  var i = 0;
  var classEventID = 0;
  var classVariationID = 0;

  while (i < theClasses.length) {
    if (theClasses[i].indexOf("fooevents_event_") == 0) {
      classEventID = theClasses[i];
    }
    if (theClasses[i].indexOf("fooevents_variation_") == 0) {
      classVariationID = theClasses[i];
    }
    i++;
  }
  return [classEventID, classVariationID];
}

/* Finds the ID of the current event/variation on the event page */

function findIDOnEvent() {
  if (jQuery(".variation_id").val() != undefined) {
    var eventID = jQuery(".variation_id").val();
  } else {
    var eventID = jQuery(".single_add_to_cart_button").val();
  }
  return eventID;
}

var currentSelectedRowNameFull = "";
var currentSelectedRowName = "";
var selectedSeatDropdown = "";
var currentSelectedSeat = "";
var numberSeats = 0;
var variation = 0;
var currentSelectedAttendeeSeatID = "";
var optionsToRemove = [];
var selectedSeatsObject = {};
var the_variations = null;
var getAllVariationsResult = {};
var getSelectedVariationAttributesResult = {};
var matchedVarIDs = [];
var qtyOnEvent = jQuery(".qty").val();

if (qtyOnEvent >= 0) {
  var currentPage = "event";
} else {
  var currentPage = "checkout";
}

/* Builds seats dropdowns according to the number of seats in the "fooevents_seating_data" variable */

function buildSeats($element, eventID, varID) {
  currentSelectedRowNameFull = $element
    .find("option")
    .filter(":selected")
    .val();

  currentSelectedAttendeeSeatID = $element.attr("id");

  if (currentSelectedRowNameFull != 0) {
    numberSeats =
      fooevents_seating_data[eventID][currentSelectedRowNameFull][
        "number_seats"
      ];
  }

  $element.find("option").each(function () {
    var thisOptionVal = jQuery(this).val();

    if (thisOptionVal != 0) {
      variations = fooevents_seating_data[eventID][thisOptionVal]["variations"];

      if (
        (jQuery.isArray(variations) &&
          jQuery.inArray("default", variations) > -1) ||
        variations == "default"
      ) {
        variations = 0;
      }

      /* if the current variation has another variation in the array, use that one*/

      if (
        jQuery.isArray(variations) &&
        jQuery.inArray(variationsToShow[varID], variations) > -1
      ) {
        variations[0] = variationsToShow[varID];
      }

      if (variationsToShow[varID] == variations) {
        variations = variationsToShow[varID];
      }

      if (
        (jQuery.isArray(variations) &&
          jQuery.inArray(varID, variations) === -1 &&
          variations.length !== 0) ||
        (variations != varID && variations != 0)
      ) {
        if (
          (jQuery.isArray(variations) &&
            jQuery.inArray(varID, variations) === -1) ||
          (!jQuery.isArray(variations) && varID !== variations)
        ) {
          jQuery("#" + currentSelectedAttendeeSeatID).change();
          jQuery(
            "#" +
              currentSelectedAttendeeSeatID +
              " option[value='" +
              thisOptionVal +
              "']"
          ).remove();
          currentSelectedRowNameFull = $element
            .find("option")
            .filter(":selected")
            .val();
        }
      }
    }
  });

  if (currentSelectedRowNameFull != undefined) {
    currentSelectedRowName = currentSelectedRowNameFull.substring(
      0,
      currentSelectedRowNameFull.indexOf("_row_name")
    );

    currentSelectedSeatDropdown = $element
      .next(".seating-class-seat")
      .find("select");
    currentSelectedSeatDropdown.html(
      "<option value=''>" +
        fooevents_seating_translations[eventID].chartSelectSeat +
        "</option>"
    );

    if (currentSelectedRowNameFull != 0) {
      numberSeats =
        fooevents_seating_data[eventID][currentSelectedRowNameFull][
          "number_seats"
        ];

      var atLeastOneSeat = false;

      for (var i = 1; i <= numberSeats; i++) {
        var seatValueToAdd = currentSelectedRowName + "_number_seats_" + i;
        if (
          jQuery.inArray(
            seatValueToAdd,
            fooevents_seats_unavailable[eventID]
          ) === -1 &&
          jQuery.inArray(seatValueToAdd, fooevents_seats_blocked[eventID]) ===
            -1
        ) {
          if (
            typeof selectedSeat != undefined &&
            selectedSeat == seatValueToAdd
          ) {
            currentSelectedSeatDropdown.append(
              '<option selected value="' +
                seatValueToAdd +
                '">' +
                i +
                "</option>"
            );
          } else {
            currentSelectedSeatDropdown.append(
              '<option value="' + seatValueToAdd + '">' + i + "</option>"
            );
          }

          atLeastOneSeat = true;
        }
      }

      if (!atLeastOneSeat) {
        currentSelectedSeatDropdown.html(
          '<option value="">' +
            fooevents_seating_translations[eventID].chartNoSeatsAvailable +
            "</option>"
        );
        currentSelectedSeatDropdown
          .closest("select")
          .prop("disabled", "disabled");
      } else {
        currentSelectedSeatDropdown.closest("select").prop("disabled", false);
      }
      currentSelectedSeat = $element
        .next(".seating-class-seat")
        .find("option")
        .filter(":selected")
        .val();
      currentSelectedSeat = currentSelectedSeat.substring(
        currentSelectedSeat.indexOf("number_seats_")
      );
    }
  }
}

/* Builds the seat dropdowns for all other dropdowns that are not currently selected */

function setOtherDropdowns() {
  var thisSelectedSeat = "";
  jQuery(".seating-class-row").each(function () {
    var thisSelectedAttendeeSeatID = jQuery(this).attr("id");
    if (thisSelectedAttendeeSeatID != currentSelectedAttendeeSeatID) {
      var thisSelectedRowName = jQuery(this)
        .find("option")
        .filter(":selected")
        .val();
      if (thisSelectedRowName == currentSelectedRowNameFull) {
        thisSelectedSeat = jQuery(this)
          .next(".seating-class-seat")
          .find("option")
          .filter(":selected")
          .val();
        if (thisSelectedSeat != "") {
          if (jQuery.inArray(thisSelectedSeat, optionsToRemove) === -1) {
            optionsToRemove.push(thisSelectedSeat);
          }
        }
      }
    }
  });
}

/* Listen for variation changes on the event screen so that Choose Seats button can display or be hidden - no button if there are no seats set for that variation */

jQuery(".single_variation_wrap").on(
  "hide_variation",
  function (event, variation) {
    if (the_variations != undefined && the_variations != null) {
      the_variations.abort();
      the_variations = null;
    }

    jQuery("a.fooevents_seating_chart").hide();
    jQuery(".seating-event .qty").show();
    jQuery(".theme-Avada .seating-event .quantity").show();
    jQuery(".theme-astra .seating-event .quantity").show();
    jQuery(".seating-event .single_add_to_cart_button")
      .prop("disabled", false)
      .removeClass("disabled");
  }
);

function getAllVariations() {
  matchedVarIDs = [];

  var productID = jQuery("input[name=product_id]").val();

  var dataVariations = {
    action: "fetch_all_woocommerce_variation_attributes",
    productID: productID,
    dataType: "json",
  };

  if (the_variations != undefined && the_variations != null) {
    the_variations.abort();
    the_variations = null;
  }

  the_variations = jQuery.post(
    FooEventsSeatingObj.ajaxurl,
    dataVariations,
    function (response) {
      getAllVariationsResult = JSON.parse(response);
      getSelectedVariationAttributes();
    }
  );
}

function getSelectedVariationAttributes() {
  var productID = jQuery(".variation_id").val();
  var dataVariations = {
    action: "fetch_selected_variation_attributes",
    productID: productID,
    dataType: "json",
  };

  the_variations = jQuery.post(
    FooEventsSeatingObj.ajaxurl,
    dataVariations,
    function (response) {
      getSelectedVariationAttributesResult = JSON.parse(response);
      findCorrectVariation();
    }
  );
}

function findCorrectVariation() {
  var selectedAttr1 = getSelectedVariationAttributesResult[0];
  var selectedAttr2 = getSelectedVariationAttributesResult[1];
  var selectedAttr3 = getSelectedVariationAttributesResult[2];

  jQuery.each(getAllVariationsResult, function (unusedKey, valueAll) {
    var keysAll = Object.keys(valueAll);
    var thisVarID = valueAll[keysAll[0]];
    var thisAttr1 = valueAll[keysAll[1]];
    var thisAttr2 = valueAll[keysAll[2]];
    var thisAttr3 = valueAll[keysAll[3]];

    // Check to see if the selected variation matches a variation where one attribute is "Any..." or where both attributes are the same
    if (
      (thisAttr1 == "" &&
        thisAttr2 == selectedAttr2 &&
        thisAttr3 == selectedAttr3) ||
      (thisAttr1 == "" && thisAttr2 == "" && thisAttr3 == selectedAttr3) ||
      (thisAttr1 == selectedAttr1 &&
        thisAttr2 == "" &&
        thisAttr3 == selectedAttr3) ||
      (thisAttr1 == selectedAttr1 && thisAttr2 == "" && thisAttr3 == "") ||
      (thisAttr1 == selectedAttr1 &&
        thisAttr2 == selectedAttr2 &&
        thisAttr3 == "") ||
      (thisAttr1 == "" && thisAttr2 == selectedAttr2 && thisAttr3 == "") ||
      (thisAttr1 == "" && thisAttr2 == "" && thisAttr3 == "") ||
      (thisAttr1 == selectedAttr1 &&
        thisAttr2 == selectedAttr2 &&
        thisAttr3 == selectedAttr3)
    ) {
      matchedVarIDs.push(thisVarID);
    }
  });

  if (currentPage == "event") {
    jQuery("a.fooevents_seating_chart")
      .show()
      .removeClass("fooevents_seating_chart_wait");
    seatsShowVariation();
  }
}

function seatsShowVariation() {
  /* Check to see if there are seats set up for this variation */
  var eventID = jQuery("input[name=product_id]").val();
  var chooseSeatsShouldShow = false;

  if (typeof fooevents_seats_options_serialized !== "undefined") {
    jQuery.each(
      fooevents_seats_options_serialized[eventID],
      function (unusedKey, value) {
        var keys = Object.keys(value);

        if (jQuery.isArray(value[keys[2]])) {
          jQuery.each(value[keys[2]], function (unusedKey, valueValue) {
            if (
              jQuery.inArray(parseInt("" + valueValue), matchedVarIDs) > -1 ||
              valueValue[keys[2]] == "default" ||
              valueValue == "default"
            ) {
              chooseSeatsShouldShow = true;
            }
          });
        } else {
          if (
            jQuery.inArray(parseInt(value[keys[2]]), matchedVarIDs) > -1 ||
            value[keys[2]] == "default"
          ) {
            chooseSeatsShouldShow = true;
          }
        }
      }
    );
  }

  if (chooseSeatsShouldShow) {
    jQuery(".seating-event .single_add_to_cart_button")
      .prop("disabled", true)
      .addClass("disabled");
    jQuery(".fooevents_seating_chart span").html("(0)");
    jQuery("a.fooevents_seating_chart").show();
    jQuery(".seating-event .qty").val(1).hide().change();
    jQuery(".theme-Avada .seating-event .quantity").hide();
    jQuery(".theme-astra .seating-event .quantity").hide();
  } else {
    jQuery("a.fooevents_seating_chart").hide();
    jQuery(".seating-event .qty").show();
    jQuery(".theme-Avada .seating-event .quantity").show();
    jQuery(".theme-astra .seating-event .quantity").show();
    jQuery(".seating-event .single_add_to_cart_button")
      .prop("disabled", false)
      .removeClass("disabled");
  }
}

jQuery(".single_variation_wrap").on(
  "show_variation",
  function (event, variation) {
    setTimeout(function () {
      jQuery(".seating-event .single_add_to_cart_button")
        .prop("disabled", true)
        .addClass("disabled");
      jQuery(".fooevents_seating_chart span").html("(0)");
      jQuery("a.fooevents_seating_chart")
        .show()
        .addClass("fooevents_seating_chart_wait");
      jQuery(".seating-event .qty").val(1).hide().change();
      jQuery(".theme-Avada .seating-event .quantity").hide();
      jQuery(".theme-astra .seating-event .quantity").hide();
      getAllVariations();
    }, 100);
  }
);

jQuery(".fooevents_seating_chart").on("click", function () {
  if (jQuery(this).hasClass("fooevents_seating_chart_wait")) {
    return;
  }

  var seatingChartButton = jQuery(this);
  var currentSelect = seatingChartButton.prev().attr("id");

  var currentVariationID = findIDOnEvent();

  if (currentVariationID == undefined) {
    currentVariationID = seatingChartButton.attr("name").substring(20);
  }

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
  var currentRow = "";
  var seatClass = "available";
  var otherSeatsSelected = [];

  if (currentPage == "checkout") {
    matchedVarIDs = [];
  }

  /* Get rows to show on seating chart */
  var rowsToShowOnChartArray = [];
  var rowsToShowOnChart = jQuery(this).siblings(".seating-class-row");
  rowsToShowOnChart.find("select option").each(function () {
    rowsToShowOnChartArray.push(this.value);
  });

  if (seatColor == "#") seatColor = "#549E39";

  seatColorStyleAvailable = " style='background-color:" + seatColor + "'";

  if (seatColorSelected == "#") seatColorSelected = "#be3737";

  seatColorStyleSelected =
    " style='background-color:" + seatColorSelected + "'";

  if (seatColorUnavailableSelected == "#")
    seatColorUnavailableSelected = "#be7337";

  seatColorStyleUnavailableSelected =
    " style='background-color:" + seatColorUnavailableSelected + "'";

  var seatColorStyle = seatColorStyleAvailable;

  /* Check the seats selected in the other dropdowns */

  jQuery(".seating-class-seat").each(function () {
    /* Get currentSelect's event ID */
    var currentEventID = findIDs(seatingChartButton.prev());
    currentEventID = currentEventID[0];

    /* Check all other dropdowns regardless of event ID */
    if (jQuery(this).attr("id") != currentSelect) {
      var innerEventID = findIDs(jQuery(this));
      innerEventID = innerEventID[0];

      if (
        currentEventID == innerEventID &&
        jQuery(this).find("select").val() != ""
      ) {
        otherSeatsSelected.push(jQuery(this).find("select").val());
      }
    }
  });

  if (jQuery(".qty").val() != undefined) {
    var attendeeLabel =
      fooevents_seating_translations["fooevents_event_" + eventID]
        .chartSelectedForAttendee;
  } else {
    var attendeeLabel =
      fooevents_seating_translations["fooevents_event_" + eventID]
        .chartThisSelected;
  }

  jQuery("#fooevents_seating_dialog").append(
    "<div class='fooevents_seating_chart_legend'><div id='fooevents_seating_available'" +
      seatColorStyleAvailable +
      "></div> " +
      fooevents_seating_translations["fooevents_event_" + eventID]
        .chartAvailable +
      "<div id='fooevents_seating_unavailable'></div> " +
      fooevents_seating_translations["fooevents_event_" + eventID].chartBooked +
      "<div id='fooevents_seating_blocked'></div> " +
      fooevents_seating_translations["fooevents_event_" + eventID]
        .chartBlocked +
      "<div id='fooevents_seating_unavailable_selected'" +
      seatColorStyleUnavailableSelected +
      "></div> " +
      fooevents_seating_translations["fooevents_event_" + eventID]
        .chartDifferentSelected +
      "<div id='fooevents_seating_selected'" +
      seatColorStyleSelected +
      "></div> " +
      attendeeLabel +
      "</div>"
  );
  jQuery("#fooevents_seating_dialog").append(
    "<div class='fooevents_seating_chart_front'>" +
      fooevents_seating_translations["fooevents_event_" + eventID].chartFront +
      "</div>"
  );

  var seatContainer = jQuery("<div class='seat_container' />");

  jQuery.each(
    fooevents_seats_options_serialized[eventID],
    function (unusedKey, value) {
      var keys = Object.keys(value);
      if (
        jQuery.inArray(keys[0], rowsToShowOnChartArray) > -1 &&
        value[keys[2]] != "default"
      ) {
        if (value[keys[2]].length > 1) matchedVarIDs.push(value[keys[2]]);
        else matchedVarIDs.push(parseInt(value[keys[2]]));
      }
    }
  );

  jQuery.each(
    fooevents_seats_options_serialized[eventID],
    function (unusedKey, value) {
      var keys = Object.keys(value);
      seatType = value[keys[3]];
      seatTypeClass = value[keys[3]];
      var otherVarClass = "";

      if (seatType == "table_new_row") {
        seatTypeClass = "table table_new_row";
      }

      var shouldAddRow = false;

      if (jQuery.isArray(value[keys[2]])) {
        jQuery.each(value[keys[2]], function (unusedKey, variationID) {
          if (
            jQuery.inArray(parseInt("" + variationID), matchedVarIDs) > -1 ||
            variationID == "default"
          ) {
            shouldAddRow = true;
          }
        });
      } else {
        if (
          jQuery.inArray(parseInt(value[keys[2]]), matchedVarIDs) > -1 ||
          value[keys[2]] == "default"
        ) {
          shouldAddRow = true;
        }
      }

      if (!shouldAddRow) {
        otherVarClass = "unavailable_variation";
      } else {
        otherVarClass = "";
      }

      if (shouldAddRow || showOtherVars == "on") {
        var rowContainer = jQuery(
          "<div id='fooevents_variation_" +
            value[keys[2]] +
            "' class='row_container row_container_event_" +
            eventID +
            " " +
            seatTypeClass +
            " " +
            otherVarClass +
            "' />"
        );

        rowID = keys[0];
        rowName = value[keys[0]];

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
        if (
          typeof fooevents_seats_unavailable_serialized[eventID] != undefined
        ) {
          unavailableSeats = JSON.stringify(
            fooevents_seats_unavailable_serialized[eventID]
          );
        } else {
          unavailableSeats = JSON.stringify(
            fooevents_seats_unavailable_serialized
          );
        }

        if (typeof fooevents_seats_blocked_serialized[eventID] != undefined) {
          blockedSeats = JSON.stringify(
            fooevents_seats_blocked_serialized[eventID]
          );
        } else {
          blockedSeats = JSON.stringify(fooevents_seats_blocked_serialized);
        }

        if (typeof fooevents_seats_aisles_serialized[eventID] != undefined) {
          aisleSeats = JSON.stringify(
            fooevents_seats_aisles_serialized[eventID]
          );
        } else {
          aisleSeats = JSON.stringify(fooevents_seats_aisles_serialized);
        }

        currentRow =
          rowID.substr(0, rowID.indexOf("_row_name")) + "_number_seats_";

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
            (unavailableSeats !== undefined &&
              unavailableSeats.indexOf(currentRow + i + '"') > -1) ||
            !shouldAddRow
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
            otherSeatsSelected !== undefined &&
            jQuery.inArray(currentRow + i, otherSeatsSelected) > -1
          ) {
            seatClass = "unavailable_selected";
            seatColorStyle = seatColorStyleUnavailableSelected;
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

  function setContainerWidthForTables() {
    var tableRowWidth = 0;
    var tableRowWidths = [];
    var maxWidth = 0;
    /* Set width of seatContainer if tables are used */
    jQuery(".seat_container div.row_container.table").each(function () {
      tableRowWidth = tableRowWidth + jQuery(this).width();
      tableRowWidths.push(tableRowWidth);

      if (jQuery(this).next().hasClass("table_new_row")) {
        tableRowWidth = 0;
      }
      maxWidth = Math.max.apply(Math, tableRowWidths);
    });

    if (maxWidth > 0) {
      jQuery(".seat_container").css("width", maxWidth + 17);
      jQuery(".fooevents_seating_chart_front").css("width", maxWidth);
    }
  }

  appendSeats();

  setTimeout(function () {
    setContainerWidthForTables();
  }, 100);

  if (selectedSeatsObject[findIDOnEvent()] != undefined) {
    selectedSeats = selectedSeatsObject[findIDOnEvent()];
  } else {
    selectedSeats = [];
  }

  if (jQuery(".qty").val() != undefined && jQuery(".qty").val() > 0) {
    jQuery("#fooevents_seating_dialog").append(
      "<button id='fooevents_seating_select_seats' class='button'>" +
        fooevents_seating_translations["fooevents_event_" + eventID]
          .chartSelectSeats +
        " (" +
        selectedSeats.length +
        ")</button>"
    );
  } else {
    jQuery("#fooevents_seating_dialog").append(
      "<button id='fooevents_seating_select_seats' class='button'>" +
        fooevents_seating_translations["fooevents_event_" + eventID]
          .chartSelectSeat +
        "</button>"
    );
  }

  jQuery(".qty").on("change", function () {
    selectedSeatsObject[findIDOnEvent()] = [];
  });

  jQuery("#fooevents_seating_select_seats").on("click", function () {
    jQuery(this).closest(".ui-dialog-content").dialog("close");
  });

  if (jQuery("#fooevents_seating_dialog").is(":empty")) {
    jQuery("#fooevents_seating_dialog").append(
      "<div style='margin-top:20px'>" +
        fooevents_seating_translations["fooevents_event_" + eventID]
          .chartNoSeatsToShow +
        "</div>"
    );
  }

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
      var productID = 0;
      var qtyOnEvent = 0;
      var selectedSeats = [];
      var quantityNr = jQuery(".qty").val();
      var isSoldIndividually = false;

      /* If qtyOnEvent is 1 or more then this is the product page, otherwise it is the Checkout page. If the qty div is hidden then the product is sold individually. */

      if (jQuery(".qty").val() != undefined) {
        qtyOnEvent = jQuery(".qty").val();

        if (jQuery(".qty").attr("type") == "hidden") {
          isSoldIndividually = true;
        }

        jQuery("#fooevents_seating_unavailable_selected")
          .get(0)
          .nextSibling.remove();
        jQuery("#fooevents_seating_unavailable_selected").remove();

        if (jQuery("input[name=product_id]").val() != undefined) {
          productID = jQuery(".variation_id").val();
        } else {
          productID = jQuery(".single_add_to_cart_button").val();
        }
      }

      if (selectedSeatsObject[productID] != undefined) {
        selectedSeats = selectedSeatsObject[productID];
      }

      thisDialog
        .find(
          'span[name="' + seatingChartButton.prev().find("select").val() + '"]'
        )
        .addClass("selected")
        .css("backgroundColor", seatColorSelected);

      /* See if seats were selected before on this page and select them */

      if (selectedSeats.length > 0) {
        jQuery("#fooevents_seating_select_seats")
          .prop("disabled", false)
          .removeClass("disabled");
      }
      if (qtyOnEvent > 0) {
        for (var i = 0; i < selectedSeats.length; i++) {
          jQuery("span[name='" + selectedSeats[i] + "']")
            .css("backgroundColor", seatColorSelected)
            .addClass("selected");
        }
      }

      /* Making seats selectable */
      thisDialog.find(".available").on("click", function () {
        if (!jQuery(this).hasClass("unavailable")) {
          if (!jQuery(this).hasClass("selected")) {
            /* If qtyOnEvent is 1 or more then this is the product page, otherwise it is the Checkout page OR the item is sold individually */

            if (qtyOnEvent == 0) {
              thisDialog
                .find(".available")
                .removeClass("selected")
                .css("backgroundColor", seatColor);
              jQuery(this).addClass("selected");
              jQuery(this).css("backgroundColor", seatColorSelected);
              seatingChartButton
                .prev()
                .prev()
                .find("select")
                .val(jQuery(this).parent().prev().attr("id"));
              seatingChartButton.prev().prev().find("select").change();
              seatingChartButton
                .prev()
                .find("select")
                .val(jQuery(this).attr("name"));
            } else {
              /* If seats are selected, update the quantity picker */

              if (selectedSeats.length >= quantityNr) {
                quantityNr++;
                jQuery(".qty").val(quantityNr).change();
              }

              if (!isSoldIndividually) {
                selectedSeats.push(jQuery(this).attr("name"));
              } else {
                selectedSeats = [];
                selectedSeats.push(jQuery(this).attr("name"));

                jQuery(".fooevents_seating_chart_view_row span").each(
                  function () {
                    if (!jQuery(this).hasClass("unavailable")) {
                      if (jQuery(this).hasClass("selected")) {
                        jQuery(this)
                          .removeClass("selected")
                          .css("backgroundColor", seatColor);
                      }

                      if (
                        blockedSeats.indexOf(jQuery(this).attr("name")) === -1
                      ) {
                        jQuery(this)
                          .removeClass("fe-blocked")
                          .css("backgroundColor", seatColor);
                      }
                    }
                  }
                );
              }

              selectedSeatsObject[productID] = selectedSeats;

              jQuery(this)
                .css("backgroundColor", seatColorSelected)
                .addClass("selected");
            }
          } else {
            if (quantityNr > 1) {
              quantityNr--;
              jQuery(".qty").val(quantityNr).change();
            }

            if (!isSoldIndividually) {
              selectedSeats.splice(
                jQuery.inArray(jQuery(this).attr("name"), selectedSeats),
                1
              );
            } else {
              selectedSeats = [];
            }

            jQuery(this)
              .css("backgroundColor", seatColorSelected)
              .removeClass("selected")
              .css("backgroundColor", seatColor);
          }

          if (jQuery(".qty").val() != undefined && jQuery(".qty").val() > 0) {
            jQuery("#fooevents_seating_select_seats").html(
              fooevents_seating_translations["fooevents_event_" + eventID]
                .chartSelectSeats +
                " (" +
                selectedSeats.length +
                ")"
            );
            jQuery(".fooevents_seating_chart span").html(
              "(" + selectedSeats.length + ")"
            );
          } else {
            jQuery("#fooevents_seating_select_seats").html(
              fooevents_seating_translations["fooevents_event_" + eventID]
                .chartSelectSeat
            );
          }
        }

        /* Disable Add to Cart and Select Seats buttons if 0 seats are selected, otherwise enable */

        if (jQuery(".qty").val() != undefined) {
          if (selectedSeats.length > 0) {
            jQuery(".single_add_to_cart_button")
              .prop("disabled", false)
              .removeClass("disabled");
            jQuery("#fooevents_seating_select_seats")
              .prop("disabled", false)
              .removeClass("disabled");
          } else {
            jQuery(".single_add_to_cart_button")
              .prop("disabled", "disabled")
              .addClass("disabled");
            jQuery("#fooevents_seating_select_seats")
              .prop("disabled", "disabled")
              .addClass("disabled");
          }
        }
      });
    },
  });
});

/* Stop add to cart from sending details through, if seats were not selected */

(function ($) {
  jQuery(document).on("click", ".single_add_to_cart_button", function (e) {
    /* Stop add to cart and show seating chart if selectedSeatsObject is empty, fewer seats than the quantity is selected or no seating chart button is visible */

    var findIDOnEvent;

    if (jQuery(".variation_id").val() != undefined) {
      findIDOnEvent = jQuery(".variation_id").val();
    } else {
      findIDOnEvent = jQuery(".single_add_to_cart_button").val();
    }

    if (!Object.keys(selectedSeatsObject).includes(findIDOnEvent)) {
      findIDOnEvent = Object.keys(selectedSeatsObject)[0];
    }

    if (
      (selectedSeatsObject[findIDOnEvent] == undefined ||
        selectedSeatsObject[findIDOnEvent].length == 0) &&
      jQuery("a.fooevents_seating_chart").is(":visible")
    ) {
      e.preventDefault();
      jQuery(".fooevents_seating_chart").trigger("click");
    } else {
      jQuery("#fooevents_seats__trans").val(selectedSeatsObject[findIDOnEvent]);
      jQuery(".fooevents_seating_chart span").html("(0)");
    }
  });
})(jQuery);
