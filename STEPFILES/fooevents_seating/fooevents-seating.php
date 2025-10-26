<?php
/**
 * Plugin Name: FooEvents Seating
 * Description: Manage seating arrangements using our flexible seating chart builder and let attendees select their seats based on the layout of your venue.
 * Version: 1.9.2
 * Author: FooEvents
 * Plugin URI: https://www.fooevents.com/
 * Author URI: https://www.fooevents.com/
 * Developer: FooEvents
 * Developer URI: https://www.fooevents.com/
 * Text Domain: fooevents-seating
 * WC requires at least: 7.0.0
 * WC tested up to: 9.5.2
 *
 * Copyright: © 2009-2025 FooEvents.
 * License: GNU General Public License v3.0
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 *
 * @package fooevents-seating
 */

add_action(
	'before_woocommerce_init',
	function() {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		}
	}
);

// include config.
require WP_PLUGIN_DIR . '/fooevents_seating/class-fooevents-seating-config.php';
require WP_PLUGIN_DIR . '/fooevents_seating/class-fooevents-seating.php';

$fooevents_seating = new FooEvents_Seating();

// Add extra custom field to variations to set seating for variation required or not.

add_action( 'woocommerce_product_after_variable_attributes', 'fooevents_seating_add_custom_field_to_variations', 10, 3 );

/**
 * Add custom field to variations to make seat selection required or not
 *
 * @param string     $loop Loop.
 * @param array      $variation_data Variation Data.
 * @param WC_Product $variation Variation.
 */
function fooevents_seating_add_custom_field_to_variations( $loop, $variation_data, $variation ) {

	$current_checkbox_value = get_post_meta( $variation->ID, 'fooevents_variation_seating_required', true );

	$product_variation = new WC_Product_Variation( $variation->ID );

	$seat_text = get_post_meta( $product_variation->get_parent_id(), 'WooCommerceEventsSeatingSeatOverride', true );

	if ( '' === $seat_text ) {
		$seat_text = __( 'Seat', 'fooevents-seating' );
	}

	$attendee_text = get_post_meta( $product_variation->get_parent_id(), 'WooCommerceEventsAttendeeOverride', true );

	if ( '' === $attendee_text ) {
		$attendee_text = __( 'Attendee', 'woocommerce-events' );
	}

	$label_text       = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, __( 'Make seat selection required for this variation ', 'woocommerce' ) );
	$description_text = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, str_ireplace( __( 'Attendee', 'woocommerce-events' ), $attendee_text, __( 'If an attendee is buying a FooEvents ticket for this variation, and there exists an "Area" associated with this variation, then the attendee will be required to select a seat if this option is checked.', 'woocommerce' ) ) );

	woocommerce_wp_checkbox(
		array(
			'id'          => 'fooevents_variation_seating_required[' . $loop . ']',
			'class'       => 'fooevents_variation_seating_required',
			'label'       => $label_text,
			'desc_tip'    => true,
			'description' => $description_text,
			'value'       => ( ! empty( $current_checkbox_value ) ? $current_checkbox_value : 'yes' ),

		)
	);

}

add_action( 'woocommerce_save_product_variation', 'fooevents_seating_save_custom_field_variations', 10, 2 );

/**
 * Save custom field to variations to make seat selection required or not
 *
 * @param int $variation_id Variation ID.
 * @param int $i Index.
 */
function fooevents_seating_save_custom_field_variations( $variation_id, $i ) {
	$fooevents_variation_seating_required = isset( $_POST['fooevents_variation_seating_required'][ $i ] ) ? 'yes' : 'no'; // phpcs:ignore WordPress.Security.NonceVerification.Missing
	if ( isset( $fooevents_variation_seating_required ) ) {
		update_post_meta( $variation_id, 'fooevents_variation_seating_required', $fooevents_variation_seating_required );
	}
}


// 3. Store custom field value into variation data.

add_filter( 'woocommerce_available_variation', 'fooevents_seating_add_custom_field_variation_data' );

/**
 * Add make seat selection required for variation HTML
 *
 * @param array $variations The variations.
 */
function fooevents_seating_add_custom_field_variation_data( $variations ) {

	$variations['fooevents_variation_seating_required'] = '<div class="woocommerce_custom_field"><span>' . get_post_meta( $variations['variation_id'], 'fooevents_variation_seating_required', true ) . '</span> Make seat selection required for this variation</div>';
	return $variations;

}

