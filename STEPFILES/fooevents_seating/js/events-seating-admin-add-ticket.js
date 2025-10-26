var fooevents_seating_translations = new Object();
var fooevents_seating_data = new Object();
var fooevents_seats_unavailable = new Object();
var fooevents_selected_seat = 0;
var fooevents_selected_row = "";

(function ($) {
  jQuery("#fooevents-add-ticket-container").on(
    "change",
    "#WooCommerceEventsEvent",
    function (e) {
      var event_id = jQuery(this).val();

      var data = {
        action: "get_event_variations",
        event_id: event_id,
      };

      jQuery.post(
        FooEventSeatingAddTicketObj.ajaxurl,
        data,
        function (response) {
          var variations = JSON.parse(response);

          if (variations.status) {
            var keys = Object.keys(variations.variations);

            fooevents_seating_admin_add_ticket(keys[0]);
          } else {
            fooevents_seating_admin_add_ticket(event_id);
          }
        }
      );
    }
  );

  jQuery("#fooevents-add-ticket-container").on(
    "change",
    "#WooCommerceEventsSelectedVariation",
    function (e) {
      var event_var_id = jQuery(this).val();

      fooevents_seating_admin_add_ticket(event_var_id);
    }
  );

  function fooevents_seating_admin_add_ticket(event_id) {
    jQuery("#fooevents_seating_dialog").empty();

    if (jQuery("#fooevents_seating_dialog").hasClass("ui-dialog-content")) {
      jQuery("#fooevents_seating_dialog").dialog("destroy");
    }
    var data = {
      action: "fooevents_fetch_add_ticket_seating_options",
      event_id: event_id,
    };

    jQuery.post(FooEventSeatingAddTicketObj.ajaxurl, data, function (response) {
      jQuery("#fooevents-add-ticket-seating-container").html(response);
      fooevents_selected_row = jQuery("#fooevents_seat_row_name")
        .find(":selected")
        .val();
      initSeats();
      initViewSeatingChart();
    });
  }
})(jQuery);
