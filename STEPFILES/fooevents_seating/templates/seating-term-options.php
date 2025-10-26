<?php
/**
 * Seating term option template
 *
 * @link https://www.fooevents.com
 * @package fooevents-seating
 */

?>
<div class="fooevents_seating_options type_seating">
<div class="options_group">
<p class="form-field fooevents-custom-text-inputs">
	<label><?php esc_attr_e( 'Row:', 'fooevents-seating' ); ?></label>
	<input type="text" id="WooCommerceEventsSeatingRowOverride" name="WooCommerceEventsSeatingRowOverride" value="<?php echo esc_attr( $woocommerce_events_seating_row_override ); ?>"/>
	<input type="text" id="WooCommerceEventsSeatingRowOverridePlural" name="WooCommerceEventsSeatingRowOverridePlural" value="<?php echo esc_attr( $woocommerce_events_seating_row_override_plural ); ?>"/>
	<img class="help_tip" data-tip="<?php esc_attr_e( "Change 'Row' to your own custom text for this event.", 'fooevents-seating' ); ?>" src="<?php echo esc_attr( plugins_url() ); ?>/woocommerce/assets/images/help.png" height="16" width="16" />
</p>
</div>
<div class="options_group">
<p class="form-field fooevents-custom-text-inputs">
	<label><?php esc_attr_e( 'Seat:', 'fooevents-seating' ); ?></label>
	<input type="text" id="WooCommerceEventsSeatingSeatOverride" name="WooCommerceEventsSeatingSeatOverride" value="<?php echo esc_attr( $woocommerce_events_seating_seat_override ); ?>"/>
	<input type="text" id="WooCommerceEventsSeatingSeatOverridePlural" name="WooCommerceEventsSeatingSeatOverridePlural" value="<?php echo esc_attr( $woocommerce_events_seating_seat_override_plural ); ?>"/>
	<img class="help_tip" data-tip="<?php esc_attr_e( "Change 'Seat' to your own custom text for this event.", 'fooevents-seating' ); ?>" src="<?php echo esc_attr( plugins_url() ); ?>/woocommerce/assets/images/help.png" height="16" width="16" />
</p>
</div>
<div class="options_group">
<p class="form-field fooevents-custom-text-inputs">
	<label><?php esc_attr_e( 'Seating Chart:', 'fooevents-seating' ); ?></label>
	<input type="text" id="WooCommerceEventsSeatingSeatingChartOverride" name="WooCommerceEventsSeatingSeatingChartOverride" value="<?php echo esc_attr( $woocommerce_events_seating_seating_chart_override ); ?>"/>
	<input type="text" id="WooCommerceEventsSeatingSeatingChartOverridePlural" name="WooCommerceEventsSeatingSeatingChartOverridePlural" value="<?php echo esc_attr( $woocommerce_events_seating_seating_chart_override_plural ); ?>"/>
	<img class="help_tip" data-tip="<?php esc_attr_e( "Change 'Seating Chart' to your own custom text for this event.", 'fooevents-seating' ); ?>" src="<?php echo esc_attr( plugins_url() ); ?>/woocommerce/assets/images/help.png" height="16" width="16" />
</p>
</div>
<div class="options_group">
<p class="form-field fooevents-custom-text-inputs">
	<label><?php esc_attr_e( 'Front:', 'fooevents-seating' ); ?></label>
	<input type="text" id="WooCommerceEventsSeatingFrontOverride" name="WooCommerceEventsSeatingFrontOverride" value="<?php echo esc_attr( $woocommerce_events_seating_front_override ); ?>"/>
	<input type="text" id="WooCommerceEventsSeatingFrontOverridePlural" name="WooCommerceEventsSeatingFrontOverridePlural" value="<?php echo esc_attr( $woocommerce_events_seating_front_override_plural ); ?>"/>
	<img class="help_tip" data-tip="<?php esc_attr_e( "Change 'Front' to your own custom text for this event.", 'fooevents-seating' ); ?>" src="<?php echo esc_attr( plugins_url() ); ?>/woocommerce/assets/images/help.png" height="16" width="16" />
</p>
</div>
</div>