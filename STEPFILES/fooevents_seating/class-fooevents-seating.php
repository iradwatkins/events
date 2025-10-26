<?php
/**
 * Main plugin class.
 *
 * @link https://www.fooevents.com
 * @package fooevents-seating
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;}

/**
 * Main plugin class.
 */
class Fooevents_Seating {

	/**
	 * Configuration object
	 *
	 * @var array $config contains paths and other configurations
	 */
	private $config;

	/**
	 * Update helper object
	 *
	 * @var object $update_helper Update helper object
	 */
	private $update_helper;

	/**
	 * On plugin load
	 */
	public function __construct() {

		add_action( 'admin_notices', array( $this, 'check_fooevents' ) );
		add_action( 'admin_notices', array( $this, 'seat_unavailable_error' ) );

		add_action( 'woocommerce_product_write_panel_tabs', array( $this, 'add_product_seating_options_tab' ), 25 );
		add_action( 'woocommerce_product_data_panels', array( $this, 'add_product_seating_options_tab_options' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'register_scripts_frontend' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'register_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'register_styles' ) );
		add_action( 'woocommerce_process_product_meta', array( $this, 'process_meta_box' ) );
		add_action( 'init', array( $this, 'load_text_domain' ) );
		add_action( 'save_post', array( &$this, 'save_ticket_meta_boxes' ), 1, 2 );

		$global_woocommerce_events_attendee_fields_pos = get_option( 'globalWooCommerceEventsAttendeeFieldsPos' );
		$theme_name                                    = wp_get_theme();

		$woocommerce_checkout_position = array(
			'default'           => 'woocommerce_after_order_notes',
			'beforeordernotes'  => 'woocommerce_before_order_notes',
			'afterbillingform'  => 'woocommerce_after_checkout_billing_form',
			'aftershippingform' => 'woocommerce_after_checkout_shipping_form',
		);

		if ( empty( $global_woocommerce_events_attendee_fields_pos ) && 'Divi' === $theme_name ) {

			$global_woocommerce_events_attendee_fields_pos = 'afterbillingform';

		}

		if ( empty( $global_woocommerce_events_attendee_fields_pos ) || 1 === (int) $global_woocommerce_events_attendee_fields_pos ) {

			$global_woocommerce_events_attendee_fields_pos = 'default';

		}

		if ( ! array_key_exists( $global_woocommerce_events_attendee_fields_pos, $woocommerce_checkout_position ) ) {

			$global_woocommerce_events_attendee_fields_pos = 'default';

		}

		add_action( $woocommerce_checkout_position[ $global_woocommerce_events_attendee_fields_pos ], array( $this, 'attendee_checkout_script_objects' ) );

		add_action( 'woocommerce_before_add_to_cart_button', array( $this, 'output_seating_fields_product' ) );
		add_action( 'admin_init', array( $this, 'register_seating_options' ) );
		add_action( 'wp_ajax_fooevents_fetch_add_ticket_seating_options', array( $this, 'fetch_add_ticket_seating_options' ) );
		add_action( 'wp_ajax_fooevents_refresh_seating_chart', array( $this, 'refresh_seating_chart' ) );
		add_action( 'wp_ajax_fetch_all_woocommerce_variation_attributes', array( $this, 'fetch_all_woocommerce_variation_attributes' ) );
		add_action( 'wp_ajax_nopriv_fetch_all_woocommerce_variation_attributes', array( $this, 'fetch_all_woocommerce_variation_attributes' ) );
		add_action( 'wp_ajax_fetch_selected_variation_attributes', array( $this, 'fetch_selected_variation_attributes' ) );
		add_action( 'wp_ajax_nopriv_fetch_selected_variation_attributes', array( $this, 'fetch_selected_variation_attributes' ) );
		add_action( 'woocommerce_add_cart_item_data', array( $this, 'add_seating_addtocart' ), 10, 4 );
		add_action( 'woocommerce_cart_item_removed', array( $this, 'remove_seating_removedfromcart' ), 10, 4 );
		add_action( 'woocommerce_after_cart_item_quantity_update', array( $this, 'remove_seating_quantity_update' ), 10, 4 );
		add_action( 'woocommerce_product_duplicate', array( $this, 'duplicate_seat_variation_options' ), 10, 2 );
		add_action( 'before_delete_post', array( $this, 'remove_unavailable_seats_from_event' ), 10, 2 );
		add_filter( 'woocommerce_add_to_cart_quantity', array( $this, 'check_if_seat_booked' ), 9, 2 );

		// WPML.
		add_action( 'woocommerce_checkout_order_created', array( $this, 'wpml_sync_seating_between_translations_new_order' ) );
		add_action( 'icl_make_duplicate', array( $this, 'wpml_adjust_seat_row_variation_ids' ), PHP_INT_MAX, 4 );
		add_action( 'wpml_make_duplicate', array( $this, 'wpml_adjust_seat_row_variation_ids' ), PHP_INT_MAX, 4 );

		$this->plugin_init();
	}

	/**
	 * Initializes plugin
	 */
	public function plugin_init() {

		// Main config.
		$this->config = new FooEvents_Seating_Config();

		// UpdateHelper.
		require_once $this->config->class_path . 'updatehelper.php';
		$this->update_helper = new Fooevents_Seating_Update_Helper( $this->config );
	}

	/**
	 * Registers scripts on the WordPress frontend.
	 */
	public function register_scripts_frontend() {

		wp_enqueue_script( 'fooevents-seating-frontend-script', $this->config->scripts_path . 'seating-frontend.js', array(), time(), true );
		wp_enqueue_style( 'fooevents-seating-style', $this->config->styles_path . 'seating.css', array(), $this->config->plugin_data['Version'] );
		wp_enqueue_style( 'wp-jquery-ui-dialog' );
		wp_enqueue_script( 'jquery-ui-dialog' );

		wp_localize_script( 'fooevents-seating-frontend-script', 'FooEventsSeatingObj', $this->get_translations() );
	}

	/**
	 * Initializes the WooCommerce meta box
	 */
	public function add_product_seating_options_tab() {

		echo '<li class="custom_tab_seating_options type_seating"><a href="#fooevents_seating_options">' . esc_html__( 'Event Seating', 'fooevents-seating' ) . '</a></li>';
	}

	/**
	 * Add seating tabs
	 */
	public function add_product_seating_options_tab_options() {

		global $post;

		$fooevents_seating_options_serialized = get_post_meta( $post->ID, 'fooevents_seating_options_serialized', true );
		$fooevents_seating_options            = $this->correct_legacy_options( json_decode( $fooevents_seating_options_serialized, true ) );
		$fooevents_seating_options_serialized = wp_json_encode( $fooevents_seating_options, true );

		$fooevents_seats_unavailable_serialized = get_post_meta( $post->ID, 'fooevents_seats_unavailable_serialized', true );
		if ( empty( $fooevents_seats_unavailable_serialized ) ) {
			$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_unavailable            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_unavailable_serialized, true ) );
		$fooevents_seats_unavailable_serialized = wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE );

		$fooevents_seats_blocked_serialized = get_post_meta( $post->ID, 'fooevents_seats_blocked_serialized', true );
		if ( empty( $fooevents_seats_blocked_serialized ) ) {
			$fooevents_seats_blocked_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_blocked            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_blocked_serialized, true ) );
		$fooevents_seats_blocked_serialized = wp_json_encode( $fooevents_seats_blocked, JSON_UNESCAPED_UNICODE );

		$fooevents_seats_aisles_serialized = get_post_meta( $post->ID, 'fooevents_seats_aisles_serialized', true );
		if ( empty( $fooevents_seats_aisles_serialized ) ) {
			$fooevents_seats_aisles_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_aisles            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_aisles_serialized, true ) );
		$fooevents_seats_aisles_serialized = wp_json_encode( $fooevents_seats_aisles, JSON_UNESCAPED_UNICODE );

		if ( empty( $fooevents_seating_options ) ) {

			$fooevents_seating_options = array();

		}

		$row_text = get_post_meta( $post->ID, 'WooCommerceEventsSeatingRowOverride', true );

		if ( '' === $row_text ) {
			$row_text = __( 'Row', 'fooevents-seating' );
		}

		$seating_chart_text = get_post_meta( $post->ID, 'WooCommerceEventsSeatingSeatingChartOverride', true );

		if ( '' === $seating_chart_text ) {
			$seating_chart_text = __( 'Seating Chart', 'fooevents-seating' );
		}

		$view_seating_chart_text = str_ireplace( __( 'Seating Chart', 'fooevents-seating' ), $seating_chart_text, __( 'View seating chart', 'fooevents-seating' ) );
		$new_row_text            = str_ireplace( __( 'Row', 'fooevents-seating' ), $row_text, __( 'New Row', 'fooevents-seating' ) );

		require $this->config->template_path . 'seating-options.php';
	}

	/**
	 * Display seating options
	 */
	public function get_seating_options() {

		ob_start();

		$global_woocommerce_events_seating_color                        = get_option( 'globalWooCommerceEventsSeatingColor' );
		$global_woocommerce_events_seating_color_selected               = get_option( 'globalWooCommerceEventsSeatingColorSelected' );
		$global_woocommerce_events_seating_color_unavailable_selected   = get_option( 'globalWooCommerceEventsSeatingColorUnavailableSelected' );
		$global_woocommerce_events_seating_seats_available_order_status = get_option( 'globalWooCommerceEventsSeatingSeatsAvailableOrderStatus', array( 'wc-cancelled' ) );

		if ( empty( $global_woocommerce_events_seating_seats_available_order_status ) ) {

			$global_woocommerce_events_seating_seats_available_order_status   = array();
			$global_woocommerce_events_seating_seats_available_order_status[] = 'wc-cancelled';

		}

		require $this->config->template_path . 'seating-settings.php';

		return ob_get_clean();
	}

	/**
	 * Register seating options
	 */
	public function register_seating_options() {

		register_setting( 'fooevents-seating-settings', 'globalWooCommerceEventsSeatingColor' );
		register_setting( 'fooevents-seating-settings', 'globalWooCommerceEventsSeatingColorSelected' );
		register_setting( 'fooevents-seating-settings', 'globalWooCommerceEventsSeatingColorUnavailableSelected' );
		register_setting( 'fooevents-seating-settings', 'globalWooCommerceEventsSeatingSeatsAvailableOrderStatus' );
	}

	/**
	 * Processes the meta box form once the publish / update button is clicked.
	 *
	 * @global object $woocommerce_errors
	 * @param int $post_id id of the post.
	 */
	public function process_meta_box( $post_id ) {

		global $woocommerce_errors;

		if ( isset( $_POST['fooevents_seating_options_serialized'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			/* Data that comes from the seating form */

			$fooevents_seating_options_serialized = sanitize_text_field( wp_unslash( $_POST['fooevents_seating_options_serialized'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			if ( empty( $fooevents_seating_options_serialized ) ) {
				$fooevents_seating_options_serialized = wp_json_encode( array() );
			}
			$fooevents_seating_options            = $this->correct_legacy_options( json_decode( $fooevents_seating_options_serialized, true ) );
			$fooevents_seating_options_serialized = wp_json_encode( $fooevents_seating_options, JSON_UNESCAPED_UNICODE );

			if ( isset( $_POST['fooevents_seats_unavailable_serialized'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
				$fooevents_seats_unavailable_serialized = sanitize_text_field( wp_unslash( $_POST['fooevents_seats_unavailable_serialized'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			}

			if ( empty( $fooevents_seats_unavailable_serialized ) ) {
				$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
			}
			$fooevents_seats_unavailable            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_unavailable_serialized, true ) );
			$fooevents_seats_unavailable_serialized = wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE );

			if ( isset( $_POST['fooevents_seats_blocked_serialized'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing

				$fooevents_seats_blocked_serialized = sanitize_text_field( wp_unslash( $_POST['fooevents_seats_blocked_serialized'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

			}

			if ( empty( $fooevents_seats_blocked_serialized ) ) {
				$fooevents_seats_blocked_serialized = wp_json_encode( array() );
			}
			$fooevents_seats_blocked            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_blocked_serialized, true ) );
			$fooevents_seats_blocked_serialized = wp_json_encode( $fooevents_seats_blocked, JSON_UNESCAPED_UNICODE );

			if ( isset( $_POST['fooevents_seats_aisles_serialized'] ) ) {  // phpcs:ignore WordPress.Security.NonceVerification.Missing
				$fooevents_seats_aisles_serialized = sanitize_text_field( wp_unslash( $_POST['fooevents_seats_aisles_serialized'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			}
			if ( empty( $fooevents_seats_aisles_serialized ) ) {
				$fooevents_seats_aisles_serialized = wp_json_encode( array() );
			}
			$fooevents_seats_aisles            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_aisles_serialized, true ) );
			$fooevents_seats_aisles_serialized = wp_json_encode( $fooevents_seats_aisles, JSON_UNESCAPED_UNICODE );

			update_post_meta( $post_id, 'fooevents_seating_options_serialized', $fooevents_seating_options_serialized );
			update_post_meta( $post_id, 'fooevents_seats_unavailable_serialized', $fooevents_seats_unavailable_serialized );
			update_post_meta( $post_id, 'fooevents_seats_blocked_serialized', $fooevents_seats_blocked_serialized );
			update_post_meta( $post_id, 'fooevents_seats_aisles_serialized', $fooevents_seats_aisles_serialized );

		}
	}

	/**
	 * Register plugin scripts.
	 */
	public function register_scripts() {

		wp_enqueue_script( 'jquery' );
		wp_enqueue_script( 'fooevents-seating-script', $this->config->scripts_path . 'seating.js', array(), time(), true );
		wp_enqueue_script( 'jquery-ui-dialog' );

		if ( isset( $_GET['post_type'] ) && 'event_magic_tickets' === $_GET['post_type'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended

			wp_enqueue_script( 'events-seating-admin-add-ticket', $this->config->scripts_path . 'events-seating-admin-add-ticket.js', array( 'jquery' ), $this->config->plugin_data['Version'], true );
			wp_localize_script( 'events-seating-admin-add-ticket', 'FooEventSeatingAddTicketObj', array( 'ajaxurl' => admin_url( 'admin-ajax.php' ) ) );

		}

		wp_localize_script( 'fooevents-seating-script', 'FooEventsSeatingObj', $this->get_translations() );
	}

	/**
	 * Get translatable terms
	 *
	 * @param string $product_id The ID of the product for which to fetch terminology overrides.
	 */
	public function get_translations( $product_id = '' ) {

		global $post;

		$translations = array(
			'chartAvailable'            => esc_attr__( 'Available', 'fooevents-seating' ),
			'chartBooked'               => esc_attr__( 'Already Booked', 'fooevents-seating' ),
			'chartBlocked'              => esc_attr__( 'Blocked', 'fooevents-seating' ),
			'chartDifferentSelected'    => esc_attr__( 'Selected for another attendee in this order', 'fooevents-seating' ),
			'chartThisSelected'         => esc_attr__( 'Selected for this attendee', 'fooevents-seating' ),
			'chartFront'                => esc_attr__( 'FRONT', 'fooevents-seating' ),
			'chartSelectSeats'          => esc_attr__( 'Select seats', 'fooevents-seating' ),
			'chartSelectSeat'           => esc_attr__( 'Select seat', 'fooevents-seating' ),
			'chartNoSeatsToShow'        => esc_attr__( 'No seats to show. Add rows and seats by clicking on the <i>+ new Row</i> button.', 'fooevents-seating' ),
			'chartSelectedForAttendee'  => esc_attr__( 'Selected seat', 'fooevents-seating' ),
			'chartNoSeatsAvailable'     => esc_attr__( '(No seats available)', 'fooevents-seating' ),
			'chartSeat'                 => esc_attr__( 'Seat', 'fooevents-seating' ),
			'chartAlreadySelected'      => esc_attr__( 'is already selected. Please select another seat.', 'fooevents-seating' ),
			'selectedSeatsAvailable'    => esc_attr__( 'Make selected seats available', 'fooevents-seating' ),
			'refreshSeats'              => esc_attr__( 'Refresh seating chart', 'fooevents-seating' ),
			'selectedSeatsUnavailable'  => esc_attr__( 'Make selected seats unavailable', 'fooevents-seating' ),
			'selectedSeatsBlock'        => esc_attr__( 'Block selected seats', 'fooevents-seating' ),
			'selectedSeatsAddAisles'    => esc_attr__( 'Add aisle to the right of selected seats', 'fooevents-seating' ),
			'selectedSeatsRemoveAisles' => esc_attr__( 'Remove aisle from selected seats', 'fooevents-seating' ),
			'selectedSeatsApply'        => esc_attr__( 'Apply', 'fooevents-seating' ),
			'selectedSeatsDisclaimer1'  => esc_attr__( 'DISCLAIMER: Please note that the action of making seats available or unavailable cannot be reversed. You have to <i>Update</i> your event before changes will take effect. Making seats available will mean that your customers will be able to select these seats again. This could result in more than one attendee booking the same seat. Only use this functionality if you are sure that this will not result in double bookings. Before making any changes, click on the <i>Refresh seating chart</i> button to ensure that you are working with the latest seating chart.', 'fooevents-seating' ),
			'selectedSeatsDisclaimer2'  => esc_attr__( 'DISCLAIMER: Please note that the action of reassigning seats cannot be reversed. You have to <i>Update</i> this ticket before changes will take effect. Making seats available will mean that your customers will be able to select these seats again. This could result in more than one attendee booking the same seat. Only use this functionality if you are sure that this will not result in double bookings.', 'fooevents-seating' ),
			'ajaxurl'                   => admin_url( 'admin-ajax.php' ),
		);

		if ( '' === $product_id && null !== $post ) {
			$product_id = $post->ID;
		}

		if ( '' !== $product_id ) {

			$seating_chart_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatingChartOverride', true );

			if ( '' === $seating_chart_text ) {
				$seating_chart_text = __( 'Seating Chart', 'fooevents-seating' );
			}

			$refresh_seating_chart_text = str_ireplace( __( 'Seating Chart', 'fooevents-seating' ), $seating_chart_text, __( 'Refresh seating chart', 'fooevents-seating' ) );

			$row_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingRowOverride', true );

			if ( '' === $row_text ) {
				$row_text = __( 'Row', 'fooevents-seating' );
			}

			$rows_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingRowOverridePlural', true );

			if ( '' === $rows_text ) {
				$rows_text = __( 'Rows', 'fooevents-seating' );
			}

			$seat_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatOverride', true );

			if ( '' === $seat_text ) {
				$seat_text = __( 'Seat', 'fooevents-seating' );
			}

			$seats_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatOverridePlural', true );

			if ( '' === $seats_text ) {
				$seats_text = __( 'Seats', 'fooevents-seating' );
			}

			$front_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingFrontOverride', true );

			if ( '' === $front_text ) {
				$front_text = __( 'FRONT', 'fooevents-seating' );
			}

			$attendee_text = get_post_meta( $product_id, 'WooCommerceEventsAttendeeOverride', true );

			if ( '' === $attendee_text ) {
				$attendee_text = __( 'Attendee', 'woocommerce-events' );
			}

			$select_seat_text            = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, __( 'Select seat', 'fooevents-seating' ) );
			$select_seats_text           = str_ireplace( __( 'Seats', 'fooevents-seating' ), $seats_text, __( 'Select seats', 'fooevents-seating' ) );
			$selected_seat_text          = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, __( 'Selected seat', 'fooevents-seating' ) );
			$no_seats_text               = str_ireplace( __( 'Rows', 'fooevents-seating' ), $rows_text, str_ireplace( __( 'Row', 'fooevents-seating' ), $row_text, str_ireplace( __( 'Seats', 'fooevents-seating' ), $seats_text, __( 'No seats to show. Add rows and seats by clicking on the <i>+ new Row</i> button.', 'fooevents-seating' ) ) ) );
			$no_seats_available_text     = str_ireplace( __( 'Seats', 'fooevents-seating' ), $seats_text, __( '(No seats available)', 'fooevents-seating' ) );
			$already_selected_text       = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, __( 'is already selected. Please select another seat.', 'fooevents-seating' ) );
			$make_seats_available_text   = str_ireplace( __( 'Seats', 'fooevents-seating' ), $seats_text, __( 'Make selected seats available', 'fooevents-seating' ) );
			$make_seats_unavailable_text = str_ireplace( __( 'Seats', 'fooevents-seating' ), $seats_text, __( 'Make selected seats unavailable', 'fooevents-seating' ) );
			$block_seats_text            = str_ireplace( __( 'Seats', 'fooevents-seating' ), $seats_text, __( 'Block selected seats', 'fooevents-seating' ) );
			$add_aisle_text              = str_ireplace( __( 'Seats', 'fooevents-seating' ), $seats_text, __( 'Add aisle to the right of selected seats', 'fooevents-seating' ) );
			$remove_aisle_text           = str_ireplace( __( 'Seats', 'fooevents-seating' ), $seats_text, __( 'Remove aisle from selected seats', 'fooevents-seating' ) );
			$different_selected_text     = str_ireplace( __( 'Attendee', 'woocommerce-events' ), $attendee_text, __( 'Selected for another attendee in this order', 'fooevents-seating' ) );
			$this_selected_text          = str_ireplace( __( 'Attendee', 'woocommerce-events' ), $attendee_text, __( 'Selected for this attendee', 'fooevents-seating' ) );
			$disclaimer1                 = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, str_ireplace( __( 'Attendee', 'woocommerce-events' ), $attendee_text, str_ireplace( __( 'Seats', 'fooevents-seating' ), $seats_text, str_ireplace( __( 'Seating Chart', 'fooevents-seating' ), $seating_chart_text, __( 'DISCLAIMER: Please note that the action of making seats available or unavailable cannot be reversed. You have to <i>Update</i> your event before changes will take effect. Making seats available will mean that your customers will be able to select these seats again. This could result in more than one attendee booking the same seat. Only use this functionality if you are sure that this will not result in double bookings. Before making any changes, click on the <i>Refresh seating chart</i> button to ensure that you are working with the latest seating chart.', 'fooevents-seating' ) ) ) ) );
			$disclaimer2                 = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, str_ireplace( __( 'Attendee', 'woocommerce-events' ), $attendee_text, str_ireplace( __( 'Seats', 'fooevents-seating' ), $seats_text, str_ireplace( __( 'Seating Chart', 'fooevents-seating' ), $seating_chart_text, __( 'DISCLAIMER: Please note that the action of reassigning seats cannot be reversed. You have to Update this ticket before changes will take effect. Making seats available will mean that your customers will be able to select these seats again. This could result in more than one attendee booking the same seat. Only use this functionality if you are sure that this will not result in double bookings.', 'fooevents-seating' ) ) ) ) );

			$translations['chartDifferentSelected']    = esc_attr( $different_selected_text );
			$translations['chartThisSelected']         = esc_attr( $this_selected_text );
			$translations['chartFront']                = esc_attr( $front_text );
			$translations['chartSelectSeat']           = esc_attr( $select_seat_text );
			$translations['chartSelectSeats']          = esc_attr( $select_seats_text );
			$translations['chartNoSeatsToShow']        = esc_attr( $no_seats_text );
			$translations['chartSelectedForAttendee']  = esc_attr( $selected_seat_text );
			$translations['chartNoSeatsAvailable']     = esc_attr( $no_seats_available_text );
			$translations['chartSeat']                 = esc_attr( $seat_text );
			$translations['chartAlreadySelected']      = esc_attr( $already_selected_text );
			$translations['selectedSeatsAvailable']    = esc_attr( $make_seats_available_text );
			$translations['refreshSeats']              = esc_attr( $refresh_seating_chart_text );
			$translations['selectedSeatsUnavailable']  = esc_attr( $make_seats_unavailable_text );
			$translations['selectedSeatsBlock']        = esc_attr( $block_seats_text );
			$translations['selectedSeatsAddAisles']    = esc_attr( $add_aisle_text );
			$translations['selectedSeatsRemoveAisles'] = esc_attr( $remove_aisle_text );
			$translations['selectedSeatsDisclaimer1']  = esc_attr( $disclaimer1 );
			$translations['selectedSeatsDisclaimer2']  = esc_attr( $disclaimer2 );
		}

		return $translations;
	}

	/**
	 * Register plugin styles.
	 */
	public function register_styles() {

		wp_enqueue_style( 'fooevents-seating-style', $this->config->styles_path . 'seating.css', array(), $this->config->plugin_data['Version'] );
		wp_enqueue_style( 'wp-jquery-ui-dialog' );
	}

	/**
	 * Checks if FooEvents is installed
	 */
	public function check_fooevents() {

		$fooevents_path = WP_PLUGIN_DIR . '/fooevents/fooevents.php';

		$plugin_data = get_plugin_data( $fooevents_path, false, false );

		if ( ! function_exists( 'is_plugin_active' ) || ! function_exists( 'is_plugin_active_for_network' ) ) {

			require_once ABSPATH . '/wp-admin/includes/plugin.php';

		}

		if ( ! is_plugin_active( 'fooevents/fooevents.php' ) ) {

			$this->output_notices( array( __( 'The FooEvents Seating plugin requires FooEvents for WooCommerce to be installed.', 'fooevents-seating' ) ) );

		}
	}




	/**
	 * Sets correct new variations for each seating row when new WPML event translation is added
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post Post object.
	 * bool $update Whether this is an existing post being updated.
	 * null|WP_Post $post_before Null for new posts, the WP_Post object prior to the update for updated posts.
	 */
	public function wpml_adjust_seat_row_variation_ids( $master_post_id, $lang, $post_array, $id ) {

		$orig_translation_product      = wc_get_product( $master_post_id );
		$duplicate_translation_product = wc_get_product( $id );
		$this->duplicate_seat_variation_options( $duplicate_translation_product, $orig_translation_product );
	}



	/**
	 * Selects correct new variations for each seating row when product is duplicated
	 *
	 * @param WC_Product $duplicate new duplicated product object.
	 * @param WC_Product $product old product object that was duplicated.
	 */
	public function duplicate_seat_variation_options( $duplicate, $product ) {

		$new_var_ids  = $duplicate->get_children();
		$orig_var_ids = $product->get_children();

		$fooevents_seating_options = $this->correct_legacy_options( json_decode( get_post_meta( $duplicate->get_id(), 'fooevents_seating_options_serialized', true ), true ) );

		$fooevents_seats_blocked_serialized = get_post_meta( $duplicate->get_id(), 'fooevents_seats_blocked_serialized', true );
		if ( empty( $fooevents_seats_blocked_serialized ) ) {
			$fooevents_seats_blocked_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_blocked = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_blocked_serialized, true ) );

		$fooevents_seats_aisles_serialized = get_post_meta( $duplicate->get_id(), 'fooevents_seats_aisles_serialized', true );
		if ( empty( $fooevents_seats_aisles_serialized ) ) {
			$fooevents_seats_aisles_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_aisles = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_aisles_serialized, true ) );

		$fooevents_seating_options_new = array();
		$new_key                       = '';

		/* Loop through each new duplicated seating options array to match variation IDs */
		foreach ( array_keys( $fooevents_seating_options ) as $seat_option_key ) {
			$this_seat_var_ids = $fooevents_seating_options[ $seat_option_key ][ $seat_option_key . '_variations' ];
			$new_key           = $this->fooevents_seating_make_id();

			$fooevents_seats_blocked = str_replace( $seat_option_key, $new_key, $fooevents_seats_blocked );
			$fooevents_seats_aisles  = str_replace( $seat_option_key, $new_key, $fooevents_seats_aisles );

			$fooevents_seating_options_new[ $new_key ] = array(
				$new_key . '_row_name'     => $fooevents_seating_options[ $seat_option_key ][ $seat_option_key . '_row_name' ],
				$new_key . '_number_seats' => $fooevents_seating_options[ $seat_option_key ][ $seat_option_key . '_number_seats' ],
				$new_key . '_variations'   => array(),
				$new_key . '_type'         => $fooevents_seating_options[ $seat_option_key ][ $seat_option_key . '_type' ],
			);

			$nr_orig_var_ids = count( $orig_var_ids );
			for ( $x = 0; $x < $nr_orig_var_ids; $x++ ) {

				$orig_var_id = (string) $orig_var_ids[ $x ];

				if ( ( is_array( $this_seat_var_ids ) && in_array( (string) ( $orig_var_id ), $this_seat_var_ids, true ) ) || (string) ( $orig_var_id ) === (string) ( $this_seat_var_ids ) ) {

					$fooevents_seating_options_new[ $new_key ][ $new_key . '_variations' ][] = (string) ( $new_var_ids[ $x ] );
				}
			}
		}

		$fooevents_seating_options_serialized = wp_json_encode( $fooevents_seating_options_new );
		$fooevents_seats_blocked_serialized   = wp_json_encode( $fooevents_seats_blocked, JSON_UNESCAPED_UNICODE );
		$fooevents_seats_aisles_serialized    = wp_json_encode( $fooevents_seats_aisles, JSON_UNESCAPED_UNICODE );

		$duplicate->update_meta_data( 'fooevents_seating_options_serialized', $fooevents_seating_options_serialized );
		$duplicate->update_meta_data( 'fooevents_seats_blocked_serialized', $fooevents_seats_blocked_serialized );
		$duplicate->update_meta_data( 'fooevents_seats_aisles_serialized', $fooevents_seats_aisles_serialized );
		$duplicate->update_meta_data( 'fooevents_seats_unavailable_serialized', '' );
		$duplicate->save_meta_data();
	}

	/**
	 * Generates a new id for each seating row when events are duplicated
	 *
	 * @param int $length length of id.
	 */
	public function fooevents_seating_make_id( $length = 20 ) {
		$characters        = 'abcdefghijklmnopqrstuvwxyz';
		$characters_length = strlen( $characters );
		$random_string     = '';
		for ( $i = 0; $i < $length; $i++ ) {
			$random_string .= $characters[ wp_rand( 0, $characters_length - 1 ) ];
		}
		return $random_string;
	}


	/**
	 * Outputs the seating chart on the checkout screen
	 *
	 * @param int    $product_id the product ID.
	 * @param int    $x event counter.
	 * @param int    $y ticket counter.
	 * @param object $ticket ticket object.
	 * @param object $checkout checkout object.
	 * @param array  $tickets tickets.
	 */
	public function output_seating_fields( $product_id, $x, $y, $ticket, $checkout, $tickets ) {

		$seating_chart_other_vars = get_post_meta( $product_id, 'WooCommerceEventsViewSeatingOtherVariations', true );

		$row_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingRowOverride', true );

		if ( '' === $row_text ) {
			$row_text = __( 'Row', 'fooevents-seating' );
		}

		$rows_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingRowOverridePlural', true );

		if ( '' === $rows_text ) {
			$rows_text = __( 'Rows', 'fooevents-seating' );
		}

		$seat_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatOverride', true );

		if ( '' === $seat_text ) {
			$seat_text = __( 'Seat', 'fooevents-seating' );
		}

		$seats_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatOverridePlural', true );

		if ( '' === $seats_text ) {
			$seats_text = __( 'Seats', 'fooevents-seating' );
		}

		$seating_chart = get_post_meta( $product_id, 'WooCommerceEventsViewSeatingChart', true );

		echo '<script type="text/javascript"> if (!fooevents_seats_options_serialized) { var fooevents_seats_options_serialized = []; } </script>';
		echo '<script type="text/javascript"> if (!fooevents_seats_unavailable_serialized) { var fooevents_seats_unavailable_serialized = []; } </script>';
		echo '<script type="text/javascript"> if (!fooevents_seats_blocked_serialized) { var fooevents_seats_blocked_serialized = []; } </script>';
		echo '<script type="text/javascript"> if (!fooevents_seats_aisles_serialized) { var fooevents_seats_aisles_serialized = []; } </script>';
		echo '<script type="text/javascript"> var seatColor = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColor', true ) ) ) . '";</script>';
		echo '<script type="text/javascript"> var seatColorSelected = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColorSelected', true ) ) ) . '";</script>';
		echo '<script type="text/javascript"> var seatColorUnavailableSelected = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColorUnavailableSelected', true ) ) ) . '";</script>';

		echo '<script type="text/javascript"> if (!selectedSeat) { var selectedSeat = {}; }</script>';

		global $woocommerce;

		$required = true;

		if ( ! empty( $ticket['variation_id'] ) ) {

			$var_id = $ticket['variation_id'];

		} else {

			$var_id = 0;

		}

		$variations_to_show = '';

		$fooevents_seating_data      = array();
		$current_selected_var        = array();
		$selected_seating_var_option = '';

		$fooevents_seating_options_serialized = get_post_meta( $product_id, 'fooevents_seating_options_serialized', true );
		$fooevents_seating_options            = $this->correct_legacy_options( json_decode( $fooevents_seating_options_serialized, true ) );
		$fooevents_seating_options_serialized = wp_json_encode( $fooevents_seating_options, true );

		$fooevents_seats_unavailable_serialized = get_post_meta( $product_id, 'fooevents_seats_unavailable_serialized', true );
		if ( empty( $fooevents_seats_unavailable_serialized ) ) {
			$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_unavailable            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_unavailable_serialized, true ) );
		$fooevents_seats_unavailable_serialized = wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE );

		$fooevents_seats_blocked_serialized = get_post_meta( $product_id, 'fooevents_seats_blocked_serialized', true );
		if ( empty( $fooevents_seats_blocked_serialized ) ) {
			$fooevents_seats_blocked_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_blocked            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_blocked_serialized, true ) );
		$fooevents_seats_blocked_serialized = wp_json_encode( $fooevents_seats_blocked, JSON_UNESCAPED_UNICODE );

		$fooevents_seats_aisles_serialized = get_post_meta( $product_id, 'fooevents_seats_aisles_serialized', true );
		if ( empty( $fooevents_seats_aisles_serialized ) ) {
			$fooevents_seats_aisles_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_aisles            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_aisles_serialized, true ) );
		$fooevents_seats_aisles_serialized = wp_json_encode( $fooevents_seats_aisles, JSON_UNESCAPED_UNICODE );

		if ( ! empty( $fooevents_seating_options ) ) {

			foreach ( $fooevents_seating_options as $row_option_key => $row_object ) {

				$row_key = str_replace( '_option', '', $row_option_key );

				$fooevents_seating_data[ $row_key . '_row_name' ] = array(
					'number_seats' => $row_object[ $row_key . '_number_seats' ],
					'variations'   => $row_object[ $row_key . '_variations' ],
				);

			}

			echo '<script type="text/javascript">fooevents_seating_translations["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $this->get_translations( $product_id ) ) . '\');</script>';
			echo '<script type="text/javascript">fooevents_seating_data["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seating_data ) . '\');</script>';
			echo '<script type="text/javascript">fooevents_seats_unavailable["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_unavailable ) . '\');</script>';
			echo '<script type="text/javascript">fooevents_seats_blocked["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_blocked ) . '\');</script>';
			echo '<script type="text/javascript">fooevents_seats_aisles["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_aisles ) . '\');</script>';

			if ( ! empty( $fooevents_seats_unavailable_serialized ) ) {
				echo '<script type="text/javascript">fooevents_seats_unavailable_serialized[' . esc_js( $product_id ) . ']  = ' . wp_kses_post( $fooevents_seats_unavailable_serialized ) . '</script>';
			}

			if ( ! empty( $fooevents_seats_blocked_serialized ) ) {
				echo '<script type="text/javascript">fooevents_seats_blocked_serialized[' . esc_js( $product_id ) . ']  = ' . wp_kses_post( $fooevents_seats_blocked_serialized ) . '</script>';
			}

			if ( ! empty( $fooevents_seats_aisles_serialized ) ) {
				echo '<script type="text/javascript">fooevents_seats_aisles_serialized[' . esc_js( $product_id ) . ']  = ' . wp_kses_post( $fooevents_seats_aisles_serialized ) . '</script>';
			}

			echo '<script type="text/javascript"> fooevents_seats_options_serialized[' . esc_js( $product_id ) . '] = ' . wp_kses_post( $fooevents_seating_options_serialized ) . '</script>';

			/* The general event variation for the current attendee */
			$selected_seating_var_option = '';
			if ( ! empty( $ticket['variation_id'] ) ) {
				$selected_seating_var_option = new WC_Product_Variation( $ticket['variation_id'] );
				if ( get_post_meta( $ticket['variation_id'], 'fooevents_variation_seating_required', true ) === 'no' ) {
					$required = false;
				} else {
					$required = true;
				}
				$selected_seating_var_option = $selected_seating_var_option->get_attributes();

				$selected_seating_var_option_keys = array_keys( $selected_seating_var_option );
				foreach ( $selected_seating_var_option_keys as $key => $option ) {

					array_push( $current_selected_var, $selected_seating_var_option[ $option ] );

				}
			}

			if ( ! empty( $fooevents_seating_options ) && '{}' !== $fooevents_seating_options ) {

				$select_row_text = str_ireplace( __( 'Row', 'fooevents-seating' ), $row_text, __( 'Select row', 'fooevents-seating' ) );

				$select_values_row    = array( '' => $select_row_text );
				$completely_different = 0;
				$has_any_variations   = 0;

				$show_seats        = false;
				$variation_has_row = false;

				foreach ( $fooevents_seating_options as $option_key => $option ) {

					$option_ids    = array_keys( $option );
					$option_values = array_values( $option );

					$option_label_output = $seat_text;
					$select_label        = $option_label_output;

					$select_values_row[ $option_ids[0] ] = $option_values[0];

					/* This is the variation selected for this row in the seating tab */
					$this_var_option = new WC_Product_Variation( $option_values[2] );

					if ( ( is_array( $option_values[2] ) && ( in_array( 'default', $option_values[2], true ) || empty( $option_values[2] ) ) ) || 'default' === $option_values[2] ) {
						$show_seats = true;
					}

					if ( ( ( is_array( $option_values[2] ) && ( in_array( 'default', $option_values[2], true ) || empty( $option_values[2] )
					|| in_array( (string) $ticket['variation_id'], $option_values[2], true ) ) ) || 'default' === $option_values[2] )
					|| ( $ticket['variation_id'] === $option_values[2] ) ) {
						$variation_has_row = true;
					}

					foreach ( $this_var_option->get_attributes() as $key_var => $var_attr ) {

						if ( ! empty( $selected_seating_var_option ) && ( $selected_seating_var_option[ $key_var ] !== $var_attr ) && ! empty( $var_attr ) ) {
							$completely_different = 1;
						}

						if ( ! $completely_different && empty( $var_attr ) ) {
							$has_any_variations = 1;
						}
					}

					/* Make variable that says which variations should show */
					if ( ! ( $completely_different ) && $has_any_variations ) {

						if ( empty( $variations_to_show ) ) {

							$variations_to_show = $option_values[2];

						}
					}

					$completely_different = 0;
					$has_any_variations   = 0;

					$diff_between_vars = array_diff( $this_var_option->get_attributes(), $current_selected_var );

					/* Check if all elements in $this_var_option match all elements in $current_selected_val OR elements in $this_var_option is empty! */
					if ( empty( trim( implode( '', array_values( $diff_between_vars ) ) ) ) ) {

						$show_seats = true;

					}
				}

				$selected_seat_row      = '';
				$selected_seat_nr_array = array();
				$selected_seat_nr       = array();

				if ( ! empty( $ticket['seats'] ) ) {

					foreach ( $tickets as $single_ticket ) {

						$selected_seat_nr_array = explode( ',', $single_ticket['seats'] );
						foreach ( $selected_seat_nr_array as $seat ) {
							if ( ! in_array( $seat, $selected_seat_nr, true ) || $seat === '' ) {
								array_push( $selected_seat_nr, $seat );

							}
						}
					}

					if ( isset( $selected_seat_nr[ $y - 1 ] ) ) {
						$selected_seat_row = substr( $selected_seat_nr[ $y - 1 ], 0, strpos( $selected_seat_nr[ $y - 1 ], '_' ) ) . '_row_name';
					}
					array_unshift( $selected_seat_nr, '' );
					echo '<script type="text/javascript"> selectedSeat[' . esc_js( $x ) . '] = JSON.parse(\'' . wp_json_encode( $selected_seat_nr ) . '\');</script>';

				}

				if ( ! empty( $ticket['variation_id'] ) && false === $variation_has_row ) {
					$show_seats = false;
				}

				if ( $show_seats ) {

					$row_name_text    = str_ireplace( __( 'Row', 'fooevents-seating' ), $row_text, __( 'Row name', 'fooevents-seating' ) );
					$seat_number_text = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, __( 'Seat number', 'fooevents-seating' ) );
					$select_seat_text = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, __( 'Select seat', 'fooevents-seating' ) );

					$select_params_row = array(
						'type'              => 'select',
						'class'             => array( "seating-class seating-class-row form-row-wide fooevents_event_$product_id fooevents_variation_$var_id" ),
						'label'             => $select_label,
						'placeholder'       => $row_name_text,
						'options'           => $select_values_row,
						'default'           => $selected_seat_row,
						'custom_attributes' => array( 'data-value' => $selected_seat_row ),
						'required'          => $required,
					);

					$select_params_seat = array(
						'type'        => 'select',
						'class'       => array( "seating-class seating-class-seat form-row-wide fooevents_event_$product_id fooevents_variation_$var_id" ),
						'label'       => '',
						'placeholder' => $seat_number_text,
						'options'     => array( $select_seat_text ),
						'required'    => $required,
					);

					woocommerce_form_field( 'fooevents_seat_row_name_' . $x . '__' . $y, $select_params_row, $checkout->get_value( 'fooevents_seat_row_name_' . $x . '__' . $y ) );
					woocommerce_form_field( 'fooevents_seat_number_' . $x . '__' . $y, $select_params_seat, $checkout->get_value( 'fooevents_seat_number_' . $x . '__' . $y ) );

					if ( 'on' === $seating_chart ) {
						echo "<a href='javascript:void(0)' name='fooevents_variation_" . esc_attr( $var_id ) . "' class='fooevents_seating_chart button button-primary' id='fooevents_event_id_" . esc_attr( $product_id ) . "'>";

						$seating_chart_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatingChartOverride', true );

						if ( '' === $seating_chart_text ) {
							$seating_chart_text = __( 'Seating Chart', 'fooevents-seating' );
						}

						$view_seating_chart_text = str_ireplace( __( 'Seating Chart', 'fooevents-seating' ), $seating_chart_text, __( 'View seating chart', 'fooevents-seating' ) );

						echo esc_html( $view_seating_chart_text );

						echo "</a> <div id='fooevents_seating_dialog' title='" . esc_attr( $seating_chart_text ) . "'></div>";
					}

					if ( ! empty( $ticket['seat_number'] ) ) {

						echo '<script type="text/javascript"> selectedSeat = "' . esc_js( $ticket['seat_number'] ) . '";</script>';

					}
				}
			}
		}

		echo '<script type="text/javascript"> variationsToShow[' . esc_js( $var_id ) . '] = "' . esc_js( $variations_to_show ) . '";</script>';
		echo '<script type="text/javascript">var showOtherVars = "' . $seating_chart_other_vars . '"; </script>';
	}



	/**
	 * Get the row name
	 *
	 * @param int $event_id the event ID.
	 * @param int $code the generated unique code/seat name.
	 */
	public function get_row_name( $event_id, $code ) {

		$fooevents_seating_options_serialized = get_post_meta( $event_id, 'fooevents_seating_options_serialized', true );
		$fooevents_seating_options            = json_decode( $fooevents_seating_options_serialized, true );

		if ( ! empty( $fooevents_seating_options ) ) {

			foreach ( $fooevents_seating_options as $row_option_key => $row_object ) {

				if ( strpos( $row_option_key, $code ) === 0 ) {

					return $row_object[ $code . '_row_name' ];
				}
			}
		}
	}

	/**
	 * Saves tickets meta box settings
	 *
	 * @param int $post_ID the post ID.
	 * @global object $post
	 * @global object $woocommerce
	 */
	public function save_ticket_meta_boxes( $post_ID ) {

		global $post;
		global $woocommerce;

		$event_id = get_post_meta( $post_ID, 'WooCommerceEventsProductID', true );
		if ( empty( $event_id ) && isset( $_POST['WooCommerceEventsEvent'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			$event_id = sanitize_text_field( wp_unslash( $_POST['WooCommerceEventsEvent'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
		}

		if ( is_object( $post ) && isset( $_POST ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing

			if ( 'event_magic_tickets' === $post->post_type ) {

				foreach ( wp_unslash( $_POST ) as $key => $value ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing

					if ( 'fooevents_seat_row_name' === $key ) {

						$row_value          = sanitize_text_field( $value );
						$row_value_var_code = substr( $row_value, 0, strpos( $row_value, '_' ) );
						$row_name           = $this->get_row_name( $event_id, $row_value_var_code );

					}

					if ( strpos( $key, 'fooevents_seat_number' ) === 0 ) {

						$seat_value = substr( $value, strrpos( $value, '_' ) + 1 );
						$seat_value = sanitize_text_field( $seat_value );

					}
				}

				$unavailable_seat   = '';
				$should_update_seat = false;

				/* Check which seat is currently set and compare with POST seat to see if they are the same so that error message not shown */
				$all_post_meta = get_post_meta( $post_ID );
				foreach ( $all_post_meta as $key => $val ) {

					if ( strpos( $key, 'fooevents_seat_number_' ) === 0 ) {

						$current_seat = substr( $key, strrpos( $key, '_' ) + 1 ) . '_number_seats_' . $val[0];

					}
				}

				if ( ! empty( $row_value_var_code ) && ! empty( $seat_value ) ) {

					$unavailable_seat   = $row_value_var_code . '_number_seats_' . $seat_value;
					$should_update_seat = $this->check_required_field_availability_ticket_edit( $event_id, $unavailable_seat, $current_seat );

				}

				if ( $should_update_seat && ! empty( $row_name ) ) {

					$this->remove_unavailable_seats_from_event( $post_ID );

					if ( isset( $_POST['meta'] ) && ! empty( wp_unslash( $_POST['meta'] ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
						foreach ( wp_unslash( $_POST['meta'] ) as $field => $array_value ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing

							if ( strpos( $array_value['key'], 'fooevents_seat_row_name_' ) === 0 ) {

								delete_post_meta( $post_ID, $array_value['key'] );
							}
							if ( strpos( $array_value['key'], 'fooevents_seat_number_' ) === 0 ) {

								delete_post_meta( $post_ID, $array_value['key'] );
							}
						}
					}

					update_post_meta( $post_ID, 'fooevents_seat_row_name_' . $row_value_var_code, $row_name );
					update_post_meta( $post_ID, 'fooevents_seat_number_' . $row_value_var_code, $seat_value );
					$seating_fields_meta = array(
						'fooevents_seat_row_name_' . $row_value_var_code => $row_name,
						'fooevents_seat_number_' . $row_value_var_code   => $seat_value,
					);
					update_post_meta( $post_ID, 'WooCommerceEventsSeatingFields', $seating_fields_meta );

					$this->add_unavailable_seat_to_event( $post_ID );

				}
			}
		}
	}

	/**
	 * Checks if FooEvents is installed
	 */
	public function is_seat_already_booked() {

		echo '<div class="notice notice-error"><p>TEST</p></div>';
	}


	/**
	 * Checks a final time to see if the selected seating fields on checkout screen are available when the Checkout button is clicked.
	 *
	 * @param int $event_id the event ID.
	 * @param int $event the event object.
	 * @param int $x event counter.
	 * @param int $y ticket counter.
	 */
	public function check_required_field_availability( $event_id, $event, $x, $y ) {

		$GLOBALS['wp_object_cache']->delete( 'fooevents_seating_checkout_lock_availability', 'options' );
		$lock = get_option( 'fooevents_seating_checkout_lock_availability', '0' );

		if ( '1' === $lock ) {
			for ( $i = 0; $i < 10; $i++ ) {
				sleep( 1 );
				$GLOBALS['wp_object_cache']->delete( 'fooevents_seating_checkout_lock_availability', 'options' );
				$lock = get_option( 'fooevents_seating_checkout_lock_availability', '0' );

				if ( '0' === $lock ) {
					break;
				}
			}
		}

		update_option( 'fooevents_seating_checkout_lock_availability', '1', false );
		$GLOBALS['wp_object_cache']->delete( 'fooevents_seating_checkout_lock_availability', 'options' );
		$lock = get_option( 'fooevents_seating_checkout_lock_availability', '1' );

		sleep( 3 );

		global $wpdb;
		$unavailable_val = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->prepare(
				"SELECT meta_value FROM {$wpdb->prefix}postmeta WHERE post_id = %s AND meta_key = 'fooevents_seats_unavailable_serialized'",
				$event_id
			),
			'ARRAY_A'
		);

		$fooevents_seats_unavailable_serialized = $unavailable_val['meta_value'];

		$fooevents_seats_blocked_serialized = get_post_meta( $event_id, 'fooevents_seats_blocked_serialized', true );
		$fooevents_seats_aisles_serialized  = get_post_meta( $event_id, 'fooevents_seats_aisles_serialized', true );

		$attendee_text = get_post_meta( $event_id, 'WooCommerceEventsAttendeeOverride', true );

		if ( '' === $attendee_text ) {
			$attendee_text = __( 'Attendee', 'woocommerce-events' );
		}

		$seat_text = get_post_meta( $event_id, 'WooCommerceEventsSeatingSeatOverride', true );

		if ( '' === $seat_text ) {
			$seat_text = __( 'Seat', 'fooevents-seating' );
		}

		$event = get_the_title( $event );

		if ( empty( $fooevents_seats_unavailable_serialized ) ) {
			$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_unavailable = json_decode( $fooevents_seats_unavailable_serialized, true );

		if ( empty( $fooevents_seats_blocked_serialized ) ) {
			$fooevents_seats_blocked_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_blocked = json_decode( $fooevents_seats_blocked_serialized, true );

		if ( empty( $fooevents_seats_aisles_serialized ) ) {
			$fooevents_seats_aisles_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_aisles = json_decode( $fooevents_seats_aisles_serialized, true );

		$field_id = 'fooevents_seat_number_' . $x . '__' . $y;

		if ( ! empty( $fooevents_seats_unavailable ) && isset( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			if ( ! empty( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
				$key = array_search( $_POST[ $field_id ], $fooevents_seats_unavailable, true ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			}

			if ( false !== $key && null !== $key ) {
				// translators: Placeholders are for the attendee term and ticket number.
				$already_booked_text = str_ireplace( __( 'Attendee', 'woocommerce-events' ), $attendee_text, __( 'The seat for %1$s attendee %2$d has already been booked. Please select a different seat.', 'fooevents-seating' ) );
				$already_booked_text = str_ireplace( __( 'Seat', 'woocommerce-events' ), $seat_text, $already_booked_text );

				$notice = sprintf( $already_booked_text, $event, $y );
				wc_add_notice( $notice, 'error' );
			}
		}

		if ( ! empty( $fooevents_seats_blocked ) && isset( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			if ( ! empty( $_POST[ $field_id ] ) ) {  // phpcs:ignore WordPress.Security.NonceVerification.Missing
				$key = array_search( $_POST[ $field_id ], $fooevents_seats_blocked, true );  // phpcs:ignore WordPress.Security.NonceVerification.Missing
			}

			if ( false !== $key ) {
				// translators: Placeholders are for the attendee term and ticket number.
				$blocked_text = str_ireplace( __( 'Attendee', 'woocommerce-events' ), $attendee_text, __( 'The seat for %1$s attendee %2$d has been blocked and is not available for booking. Please select a different seat.', 'fooevents-seating' ) );
				$blocked_text = str_ireplace( __( 'Seat', 'woocommerce-events' ), $seat_text, $blocked_text );

				$notice = sprintf( $blocked_text, $event, $y );
				wc_add_notice( $notice, 'error' );
			}
		}

		update_option( 'fooevents_seating_checkout_lock_availability', '0', false );
		$GLOBALS['wp_object_cache']->delete( 'fooevents_seating_checkout_lock_availability', 'options' );
		$lock = get_option( 'fooevents_seating_checkout_lock_availability', '0' );
	}






	/**
	 * Checks if FooEvents is installed
	 */
	public function seat_unavailable_error() {

		if ( false !== get_option( 'seat_unavailable_error' ) ) {
			echo '<div class="notice notice-error"><p>' . esc_html( get_option( 'seat_unavailable_error' ) ) . '</p></div>';
			delete_option( 'seat_unavailable_error' );
		}
	}


	/**
	 * Checks a final time to see if the selected seat on the ticket edit screen is available when the Ticket Update button is clicked.
	 *
	 * @param int $event_id the event ID.
	 * @param int $event the event object.
	 */
	public function check_required_field_availability_ticket_edit( $event_id, $seat, $current_seat ) {

		global $woocommerce;

		$fooevents_seats_unavailable_serialized = get_post_meta( $event_id, 'fooevents_seats_unavailable_serialized', true );
		$fooevents_seats_blocked_serialized     = get_post_meta( $event_id, 'fooevents_seats_blocked_serialized', true );
		$fooevents_seats_aisles_serialized      = get_post_meta( $event_id, 'fooevents_seats_aisles_serialized', true );

		$attendee_text = get_post_meta( $event_id, 'WooCommerceEventsAttendeeOverride', true );

		if ( '' === $attendee_text ) {
			$attendee_text = __( 'Attendee', 'woocommerce-events' );
		}

		$seat_text = get_post_meta( $event_id, 'WooCommerceEventsSeatingSeatOverride', true );

		if ( '' === $seat_text ) {
			$seat_text = __( 'Seat', 'fooevents-seating' );
		}

		if ( empty( $fooevents_seats_unavailable_serialized ) ) {
			$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_unavailable = json_decode( $fooevents_seats_unavailable_serialized, true );

		if ( empty( $fooevents_seats_blocked_serialized ) ) {
			$fooevents_seats_blocked_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_blocked = json_decode( $fooevents_seats_blocked_serialized, true );

		if ( empty( $fooevents_seats_aisles_serialized ) ) {
			$fooevents_seats_aisles_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_aisles = json_decode( $fooevents_seats_aisles_serialized, true );

		if ( ! empty( $fooevents_seats_unavailable ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing

				$key = array_search( $seat, $fooevents_seats_unavailable, true ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

			if ( false !== $key && null !== $key && $seat !== $current_seat ) {

				// translators: Placeholders are for the attendee term and ticket number.
				$already_booked_text = str_ireplace( __( 'Attendee', 'woocommerce-events' ), $attendee_text, __( 'This seat has already been booked. Please select a different seat.', 'fooevents-seating' ) );
				$already_booked_text = str_ireplace( __( 'Seat', 'woocommerce-events' ), $seat_text, $already_booked_text );

				update_option( 'seat_unavailable_error', $already_booked_text );

				return false;

			}
		}

		if ( ! empty( $fooevents_seats_blocked ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing

				$key = array_search( $seat, $fooevents_seats_blocked, true );  // phpcs:ignore WordPress.Security.NonceVerification.Missing

			if ( false !== $key ) {

				// translators: Placeholders are for the attendee term and ticket number.
				$blocked_text = str_ireplace( __( 'Attendee', 'woocommerce-events' ), $attendee_text, __( 'This seat has been blocked and is not available for booking. Please select a different seat.', 'fooevents-seating' ) );
				$blocked_text = str_ireplace( __( 'Seat', 'woocommerce-events' ), $seat_text, $blocked_text );

				update_option( 'seat_unavailable_error', $blocked_text );

				return false;
			}
		}

		return true;
	}

	/**
	 * Checks the seating fields on checkout screen.
	 *
	 * @param array $ticket the ticket object.
	 * @param int   $event the event object.
	 * @param int   $x event counter.
	 * @param int   $y ticket counter.
	 */
	public function check_required_fields( $ticket, $event, $x, $y ) {

		global $woocommerce;
		$seat_selected = false;

		$event_title = get_the_title( $event );

		$fooevents_seating_options_serialized = get_post_meta( $ticket['product_id'], 'fooevents_seating_options_serialized', true );
		$fooevents_seating_options            = $this->correct_legacy_options( json_decode( $fooevents_seating_options_serialized, true ) );
		$fooevents_seating_options_serialized = wp_json_encode( $fooevents_seating_options, true );

		$fooevents_seats_unavailable_serialized = get_post_meta( $ticket['product_id'], 'fooevents_seats_unavailable_serialized', true );
		if ( empty( $fooevents_seats_unavailable_serialized ) ) {
			$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_unavailable            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_unavailable_serialized, true ) );
		$fooevents_seats_unavailable_serialized = wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE );

		$fooevents_seats_blocked_serialized = get_post_meta( $ticket['product_id'], 'fooevents_seats_blocked_serialized', true );
		if ( empty( $fooevents_seats_blocked_serialized ) ) {
			$fooevents_seats_blocked_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_blocked            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_blocked_serialized, true ) );
		$fooevents_seats_blocked_serialized = wp_json_encode( $fooevents_seats_blocked, JSON_UNESCAPED_UNICODE );

		$fooevents_seats_aisles_serialized = get_post_meta( $ticket['product_id'], 'fooevents_seats_aisles_serialized', true );
		if ( empty( $fooevents_seats_aisles_serialized ) ) {
			$fooevents_seats_aisles_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_aisles            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_aisles_serialized, true ) );
		$fooevents_seats_aisles_serialized = wp_json_encode( $fooevents_seats_aisles, JSON_UNESCAPED_UNICODE );

		if ( ! empty( $fooevents_seating_options ) ) {

			foreach ( $fooevents_seating_options as $option_key => $option ) {

				$option_ids    = array_keys( $option );
				$option_values = array_values( $option );
				$field_id      = 'fooevents_seat_number_' . $x . '__' . $y;

				if ( ! empty( $_POST[ $field_id ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
					$seat_selected = true;

				}
			}

			if ( ! $seat_selected && ( get_post_meta( $ticket['variation_id'], 'fooevents_variation_seating_required', true ) === 'yes' || empty( get_post_meta( $ticket['variation_id'], 'fooevents_variation_seating_required', true ) ) ) ) {
				// translators: Placeholders are for the attendee term and ticket number.
				$notice = sprintf( __( 'A row and seat number is required for %1$s attendee %2$d', 'fooevents-seating' ), $event_title, $y );
				wc_add_notice( $notice, 'error' );
			}
		}
	}

	/**
	 * Displays seating details on the tickets detail page.
	 *
	 * @param int $post the post object.
	 */
	public function display_tickets_meta_seat_options( $post ) {

		$post_meta     = get_post_meta( $post->ID );
		$custom_values = array();

		foreach ( $post_meta as $key => $meta ) {

			if ( strpos( $key, 'fooevents_seat_' ) === 0 ) {

				$custom_values[ $key ] = ucwords( str_replace( '_', ' ', $meta[0] ) );

			}
		}

		if ( ! empty( $custom_values ) ) {

			require $this->config->template_path . 'seating-tickets.php';

		}
	}

	/**
	 * Display seats on tickets.
	 *
	 * @param int $id the ticket ID.
	 * @return array
	 */
	public function display_tickets_meta_seat_options_output( $id ) {

		$post_meta   = get_post_meta( $id );
		$seat_values = array();

		$product_id = $post_meta['WooCommerceEventsProductID'][0];

		$row_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingRowOverride', true );

		if ( '' === $row_text ) {
			$row_text = __( 'Row', 'fooevents-seating' );
		}

		$row_name_text = str_ireplace( __( 'Row', 'fooevents-seating' ), $row_text, __( 'Row Name', 'fooevents-seating' ) );

		$seat_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatOverride', true );

		if ( '' === $seat_text ) {
			$seat_text = __( 'Seat', 'fooevents-seating' );
		}

		$seat_number_text = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, __( 'Seat Number', 'fooevents-seating' ) );

		foreach ( $post_meta as $key => $meta ) {

			if ( strpos( $key, 'fooevents_seat_' ) === 0 ) {

				$custom_values[ $key ] = $meta[0];
				$meta[0]               = str_replace( '_', ' ', $meta[0] );
				$meta[0]               = ucwords( $meta[0] );

				if ( strpos( $key, 'fooevents_seat_row_name' ) === 0 ) {

					$seat_values['row_name_label'] = $row_name_text;
					$seat_values['row_name']       = $meta[0];

				}

				if ( strpos( $key, 'fooevents_seat_number' ) === 0 ) {

					$seat_values['seat_number_label'] = $seat_text;
					$seat_values['seat_number']       = $meta[0];

				}
			}
		}

		return $seat_values;
	}


	/**
	 * Display seats on tickets legacy.
	 *
	 * @param int $id the ticket ID.
	 * @return string
	 */
	public function display_tickets_meta_seat_options_output_legacy( $id ) {

		// LEGACY: 20201028.

		$post_meta = get_post_meta( $id );
		$output    = '';

		foreach ( $post_meta as $key => $meta ) {

			if ( strpos( $key, 'fooevents_seat_' ) === 0 ) {

				$custom_values[ $key ] = $meta[0];
				$meta[0]               = str_replace( '_', ' ', $meta[0] );
				$meta[0]               = ucwords( $meta[0] );

				$output .= $this->output_seating_field_name( $key ) . ': ' . $meta[0] . '<br>';

			}
		}

		return $output;

		// ENDLEGACY: 20201028.
	}

	/**
	 * Formats custom attendee fields for CSV
	 *
	 * @param int $id the ticket ID.
	 * @return array
	 */
	public function display_tickets_meta_seat_options_array( $id ) {

		$post_meta     = get_post_meta( $id );
		$custom_values = array();

		foreach ( $post_meta as $key => $meta ) {

			if ( strpos( $key, 'fooevents_seat_' ) === 0 ) {

				if ( 'fooevents_seat_row_name' !== $key && 'fooevents_seat_number' !== $key ) {

					$key = substr( $key, 0, strrpos( $key, '_' ) );

				}

				$key                            = substr( $key, 10 );
				$key                            = str_replace( '_', ' ', $key );
				$option_label                   = ucwords( $key );
				$custom_values[ $option_label ] = esc_attr( $meta[0] );

			}
		}

		return $custom_values;
	}

	/**
	 * Captures seating options on checkout.
	 *
	 * @param int $product_id the product ID.
	 * @param int $x event counter.
	 * @param int $y ticket counter.
	 */
	public function capture_seating_options( $product_id, $x, $y, $ticket ) {
		
		$event_type = get_post_meta( $product_id, 'WooCommerceEventsType', true );

		if ($event_type === 'seating') {
			

			$GLOBALS['wp_object_cache']->delete( 'fooevents_seating_checkout_lock', 'options' );
			$lock = get_option( 'fooevents_seating_checkout_lock', '0' );

			if ( '1' === $lock ) {
				for ( $i = 0; $i < 10; $i++ ) {
					sleep( 1 );
					$GLOBALS['wp_object_cache']->delete( 'fooevents_seating_checkout_lock', 'options' );
					$lock = get_option( 'fooevents_seating_checkout_lock', '0' );
					if ( '0' === $lock ) {
						break;
					}
				}
			}

			update_option( 'fooevents_seating_checkout_lock', '1', false );
			$GLOBALS['wp_object_cache']->delete( 'fooevents_seating_checkout_lock', 'options' );
			$lock = get_option( 'fooevents_seating_checkout_lock', '1' );

			$custom_values = array();

			$fooevents_seating_options_serialized = get_post_meta( $product_id, 'fooevents_seating_options_serialized', true );
			$fooevents_seating_options            = $this->correct_legacy_options( json_decode( $fooevents_seating_options_serialized, true ) );
			$fooevents_seating_options_serialized = wp_json_encode( $fooevents_seating_options, true );

			global $wpdb;
			$unavailable_val = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$wpdb->prepare(
					"SELECT meta_value FROM {$wpdb->prefix}postmeta WHERE post_id = %s AND meta_key = 'fooevents_seats_unavailable_serialized'",
					$product_id
				),
				'ARRAY_A'
			);

			$fooevents_seats_unavailable_serialized = $unavailable_val['meta_value'];

			if ( empty( $fooevents_seats_unavailable_serialized ) ) {
				$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
			}
			$fooevents_seats_unavailable            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_unavailable_serialized, true ) );
			$fooevents_seats_unavailable_serialized = wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE );

			$seat_taken = '';
			$row_key    = 'fooevents_seat_row_name_' . $x . '__' . $y;

			if ( isset( $_POST[ $row_key ] ) ) {  // phpcs:ignore WordPress.Security.NonceVerification.Missing

				$row_value                        = sanitize_text_field( wp_unslash( $_POST[ $row_key ] ) );
				$id_value                         = substr( $row_value, 0, strpos( $row_value, '_row_name' ) );
				$row_field_name                   = preg_replace( '/' . preg_quote( '_' . $x . '__' . $y, '/' ) . '$/', '', $row_key ) . '_' . $id_value;
				$custom_values[ $row_field_name ] = $fooevents_seating_options[ $id_value ][ $id_value . '_row_name' ];
				$seat_taken                       = $id_value . '_number_seats_';
			}

			$seat_key = 'fooevents_seat_number_' . $x . '__' . $y;

			if ( isset( $_POST[ $seat_key ] ) ) {  // phpcs:ignore WordPress.Security.NonceVerification.Missing

				$seat_value                        = sanitize_text_field( wp_unslash( $_POST[ $seat_key ] ) );
				$seat_field_name                   = preg_replace( '/' . preg_quote( '_' . $x . '__' . $y, '/' ) . '$/', '', $seat_key ) . '_' . $id_value;
				$seat_value                        = substr( $seat_value, strrpos( $seat_value, '_' ) + 1 );
				$seat_taken                       .= $seat_value;
				$custom_values[ $seat_field_name ] = $seat_value;
			}

			if ( !isset($_POST[ $row_key ]) && !isset($_POST[ $seat_key ])) {
				
				$ticket_seats = explode(',', $ticket["seats"]);
				$id_value = substr( $ticket_seats[$y-1], 0, strpos( $ticket_seats[$y-1], '_number_seats' ) );
				$row_field_name = "fooevents_seat_row_name_" . $id_value;
				$custom_values[ $row_field_name ] = $fooevents_seating_options[ $id_value ][ $id_value . '_row_name' ];
				$seat_field_name = "fooevents_seat_number_" . $id_value;
				$seat_value = substr( $ticket_seats[$y-1], strrpos( $ticket_seats[$y-1], '_' ) + 1 );
				$seat_taken                       = $id_value . '_number_seats_' . $seat_value;
				$custom_values[ $seat_field_name ] = $seat_value;
				
			}

			array_push( $fooevents_seats_unavailable, $seat_taken );
			$fooevents_seats_unavailable_serialized = wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE );

			update_post_meta( $product_id, 'fooevents_seats_unavailable_serialized', $fooevents_seats_unavailable_serialized );

			/* Also remove seats from fooevents_temp_seats_unavailable_serialized */

			$fooevents_temp_seats_unavailable_serialized = get_post_meta( $product_id, 'fooevents_temp_seats_unavailable_serialized', true );

			if ( empty( $fooevents_temp_seats_unavailable_serialized ) ) {
				$fooevents_temp_seats_unavailable_serialized = wp_json_encode( array() );
			}

			$fooevents_temp_seats_unavailable_serialized = json_decode( $fooevents_temp_seats_unavailable_serialized, true );

			unset( $fooevents_temp_seats_unavailable_serialized[ $seat_taken ] );

			$fooevents_temp_seats_unavailable_serialized = wp_json_encode( $fooevents_temp_seats_unavailable_serialized, JSON_UNESCAPED_UNICODE );

			update_post_meta( $product_id, 'fooevents_temp_seats_unavailable_serialized', $fooevents_temp_seats_unavailable_serialized );

			update_option( 'fooevents_seating_checkout_lock', '0', false );
			$GLOBALS['wp_object_cache']->delete( 'fooevents_seating_checkout_lock', 'options' );
			$lock = get_option( 'fooevents_seating_checkout_lock', '0' );

			return $custom_values;
		}
		
	}

	/**
	 * Capture seating options
	 *
	 * @param int   $post_id the post ID.
	 * @param array $seating_fields the seats that were selected.
	 */
	public function process_capture_seating_options( $post_id, $seating_fields ) {

		foreach ( $seating_fields as $key => $value ) {

			if ( strpos( $key, 'fooevents_seat_' ) === 0 ) {

				update_post_meta( $post_id, $key, $value );

			}
		}

		update_post_meta( $post_id, 'WooCommerceEventsSeatingFields', $seating_fields );
	}


	/**
	 * Outputs seating options in admin
	 *
	 * @param int $product_id the event ID.
	 * @param int $ticket_post_id the ticket ID.
	 * @return string
	 */
	public function ticket_details_seating_fields( $product_id, $ticket_post_id ) {

		$seat_options = '';

		$fooevents_seating_options_serialized = get_post_meta( $product_id, 'fooevents_seating_options_serialized', true );
		$fooevents_seating_options            = $this->correct_legacy_options( json_decode( $fooevents_seating_options_serialized, true ) );
		$fooevents_seating_options_serialized = wp_json_encode( $fooevents_seating_options, true );

		$fooevents_seats_unavailable_serialized = get_post_meta( $product_id, 'fooevents_seats_unavailable_serialized', true );
		if ( empty( $fooevents_seats_unavailable_serialized ) ) {
			$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_unavailable            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_unavailable_serialized, true ) );
		$fooevents_seats_unavailable_serialized = wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE );

		$fooevents_seats_blocked_serialized = get_post_meta( $product_id, 'fooevents_seats_blocked_serialized', true );
		if ( empty( $fooevents_seats_blocked_serialized ) ) {
			$fooevents_seats_blocked_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_blocked            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_blocked_serialized, true ) );
		$fooevents_seats_blocked_serialized = wp_json_encode( $fooevents_seats_blocked, JSON_UNESCAPED_UNICODE );

		$fooevents_seats_aisles_serialized = get_post_meta( $product_id, 'fooevents_seats_aisles_serialized', true );
		if ( empty( $fooevents_seats_aisles_serialized ) ) {
			$fooevents_seats_aisles_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_aisles            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_aisles_serialized, true ) );
		$fooevents_seats_aisles_serialized = wp_json_encode( $fooevents_seats_aisles, JSON_UNESCAPED_UNICODE );

		echo '<script type="text/javascript">var seatColor = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColor', true ) ) ) . '";</script>';
		echo '<script type="text/javascript">var seatColorSelected = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColorSelected', true ) ) ) . '";</script>';
		echo '<script type="text/javascript">var seatColorUnavailableSelected = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColorUnavailableSelected', true ) ) ) . '";</script>';

		echo '<script type="text/javascript">var fooevents_seating_options_serialized = JSON.parse(\'' . wp_json_encode( $fooevents_seating_options ) . '\');</script>';
		echo '<script type="text/javascript">var fooevents_seats_options_serialized = new Object(); fooevents_seats_options_serialized[' . esc_js( $product_id ) . '] = ' . wp_kses_post( $fooevents_seating_options_serialized ) . '</script>';
		echo '<script type="text/javascript">var fooevents_seats_unavailable_serialized = JSON.parse(\'' . wp_json_encode( $fooevents_seats_unavailable ) . '\');</script>';
		echo '<script type="text/javascript">var fooevents_seats_blocked_serialized = JSON.parse(\'' . wp_json_encode( $fooevents_seats_blocked ) . '\');</script>';
		echo '<script type="text/javascript">var fooevents_seats_aisles_serialized = JSON.parse(\'' . wp_json_encode( $fooevents_seats_aisles ) . '\');</script>';

		$post_meta              = get_post_meta( $ticket_post_id );
		$seat_row_values        = array();
		$seat_number_values     = array();
		$selected_row           = '';
		$fooevents_seating_data = array();
		$selected_field_id      = 0;

		/* GET seat variable code. */
		foreach ( $post_meta as $key => $meta ) {

			if ( strpos( $key, 'fooevents_seat_row_name' ) === 0 ) {

				$field = explode( '_', $key );

				if ( isset( $field[4] ) ) {

					$selected_field_id = $field[4];

				} else {

					$selected_field_id = $meta[0];

				}
			}
		}

		/* See which variation options should show. */

		$var_id = get_post_meta( $ticket_post_id, 'WooCommerceEventsVariationID', true );

		if ( empty( $var_id ) || '' === $var_id ) {

			$var_id = 0;

		}

		echo '<script type="text/javascript">var event_id = ' . esc_js( $product_id ) . ';</script>';
		echo '<script type="text/javascript">var var_id = ' . esc_js( $var_id ) . ';</script>';

		/* The general event variation for the current attendee. */
		$current_selected_var        = array();
		$selected_seating_var_option = '';
		if ( ! empty( $var_id ) ) {
			$selected_seating_var_option = new WC_Product_Variation( $var_id );
			if ( get_post_meta( $var_id, 'fooevents_variation_seating_required', true ) === 'no' ) {
				$required = false;
			} else {
				$required = true;
			}
			$selected_seating_var_option = $selected_seating_var_option->get_attributes();

			$selected_seating_var_option_keys = array_keys( $selected_seating_var_option );
			foreach ( $selected_seating_var_option_keys as $key => $option ) {

				array_push( $current_selected_var, $selected_seating_var_option[ $option ] );

			}
		}

		if ( ! empty( $fooevents_seating_options ) && '{}' !== $fooevents_seating_options ) {

			foreach ( $fooevents_seating_options as $row_option_key => $row_object ) {

				$option_values = array_values( $row_object );
				$keys          = array_keys( $row_object );

				$row_variations = array();

				if ( is_array( $option_values[2] ) ) {
					$row_variations = $option_values[2];
				} else {
					$row_variations = array( $option_values[2] );
				}

				foreach ( $row_variations as $row_variation ) {
					/* This is one of the variations selected for this row in the seating tab */
					$this_var_option = new WC_Product_Variation( $row_variation );

					$this_var_attr      = $this_var_option->get_attributes();
					$this_var_attr_keys = array_keys( $this_var_attr );

					if ( empty( $this_var_attr_keys ) && ( ( is_array( $row_object[ $keys[2] ] ) && ! in_array( 'default', $row_object[ $keys[2] ], true ) && ! empty( $row_object[ $keys[2] ] ) ) || ( ! is_array( $row_object[ $keys[2] ] ) && 'default' !== $row_object[ $keys[2] ] ) ) ) {

						continue;

					}

					if ( ( is_array( $row_object[ $keys[2] ] ) && ( in_array( 'default', $row_object[ $keys[2] ], true ) || empty( $row_object[ $keys[2] ] ) ) ) || 'default' === $row_object[ $keys[2] ] ||
					(
						( count( $current_selected_var ) === 3 &&
							( $this_var_attr[ $this_var_attr_keys[0] ] === $current_selected_var[0] || '' === $this_var_attr[ $this_var_attr_keys[0] ] ) &&
							( $this_var_attr[ $this_var_attr_keys[1] ] === $current_selected_var[1] || '' === $this_var_attr[ $this_var_attr_keys[1] ] ) &&
							( $this_var_attr[ $this_var_attr_keys[2] ] === $current_selected_var[2] || '' === $this_var_attr[ $this_var_attr_keys[2] ] )
						) ||
						( count( $current_selected_var ) === 2 &&
							( $this_var_attr[ $this_var_attr_keys[0] ] === $current_selected_var[0] || '' === $this_var_attr[ $this_var_attr_keys[0] ] ) &&
							( $this_var_attr[ $this_var_attr_keys[1] ] === $current_selected_var[1] || '' === $this_var_attr[ $this_var_attr_keys[1] ] )
						) ||
						( count( $current_selected_var ) === 1 &&
							( $this_var_attr[ $this_var_attr_keys[0] ] === $current_selected_var[0] || '' === $this_var_attr[ $this_var_attr_keys[0] ] )
						)

					) ) {

						if ( ! empty( $selected_field_id ) && ( ( strpos( $keys[0], $selected_field_id . '_' ) === 0 ) || ( strpos( $keys[0], strtolower( $selected_field_id . '_' ) ) === 0 ) ) ) {

							$selected_row = 'selected';

						} else {

							$selected_row = '';

						}

						array_push( $seat_row_values, array( $keys[0], $row_object[ $keys[0] ], $selected_row ) );

					}
				}
			}

			foreach ( $fooevents_seating_options as $row_option_key => $row_object ) {

				$row_key = str_replace( '_option', '', $row_option_key );

				$fooevents_seating_data[ $row_key . '_row_name' ] = array(
					'number_seats' => $row_object[ $row_key . '_number_seats' ],
					'variations'   => $row_object[ $row_key . '_variations' ],
				);

			}

			if ( ! empty( $fooevents_seats_unavailable_serialized ) ) {
				echo '<script type="text/javascript">fooevents_seats_unavailable_serialized[' . esc_js( $product_id ) . ']  = ' . wp_kses_post( $fooevents_seats_unavailable_serialized ) . '</script>';
			}

			if ( ! empty( $fooevents_seats_blocked_serialized ) ) {
				echo '<script type="text/javascript">fooevents_seats_blocked_serialized[' . esc_js( $product_id ) . ']  = ' . wp_kses_post( $fooevents_seats_blocked_serialized ) . '</script>';
			}

			if ( ! empty( $fooevents_seats_aisles_serialized ) ) {
				echo '<script type="text/javascript">fooevents_seats_aisles_serialized[' . esc_js( $product_id ) . ']  = ' . wp_kses_post( $fooevents_seats_aisles_serialized ) . '</script>';
			}

			$selected_seat = get_post_meta( $ticket_post_id, 'fooevents_seat_number_' . $selected_field_id, true );

			if ( empty( $selected_seat ) ) {

				if ( ! empty( get_post_meta( $ticket_post_id, 'fooevents_seat_number', true ) ) ) {

					// LEGACY: 20201028.
					$selected_seat = get_post_meta( $ticket_post_id, 'fooevents_seat_number', true );
					// ENDLEGACY: 20201028.

				} else {

					$selected_seat = 0;

				}
			}

			echo '<script type="text/javascript">var fooevents_seating_translations = new Object(); fooevents_seating_translations["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $this->get_translations( $product_id ) ) . '\');</script>';
			echo '<script type="text/javascript">var fooevents_seating_data = new Object(); fooevents_seating_data["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seating_data ) . '\');</script>';
			echo '<script type="text/javascript">var fooevents_seats_unavailable = new Object(); fooevents_seats_unavailable["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_unavailable ) . '\');</script>';
			echo '<script type="text/javascript">var fooevents_seats_blocked = new Object(); fooevents_seats_blocked["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_blocked ) . '\');</script>';
			echo '<script type="text/javascript">var fooevents_seats_aisles = new Object(); fooevents_seats_aisles["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_aisles ) . '\');</script>';
			echo '<script type="text/javascript">var fooevents_selected_seat = 0; fooevents_selected_seat = ' . esc_js( $selected_seat ) . ';</script>';
			echo '<script type="text/javascript">var fooevents_selected_row = ""; fooevents_selected_row = "' . esc_js( $selected_field_id ) . '_row_name";</script>';

			$seating_chart_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatingChartOverride', true );

			if ( '' === $seating_chart_text ) {
				$seating_chart_text = __( 'Seating Chart', 'fooevents-seating' );
			}

			$row_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingRowOverride', true );

			if ( '' === $row_text ) {
				$row_text = __( 'Row', 'fooevents-seating' );
			}

			$row_name_text = str_ireplace( __( 'Row', 'fooevents-seating' ), $row_text, __( 'Row name:', 'fooevents-seating' ) );

			$seat_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatOverride', true );

			if ( '' === $seat_text ) {
				$seat_text = __( 'Seat', 'fooevents-seating' );
			}

			$seat_number_text = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, __( 'Seat number:', 'fooevents-seating' ) );

			ob_start();

			require $this->config->template_path . 'seating-ticket-detail.php';

			echo "<a href='javascript:void(0)' name='fooevents_variation_" . esc_attr( $var_id ) . "' class='fooevents_seating_chart fooevents_seating_chart_admin button button-primary' id='fooevents_event_id_" . esc_attr( $product_id ) . "'>";

			$seating_chart_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatingChartOverride', true );

			if ( '' === $seating_chart_text ) {
				$seating_chart_text = __( 'Seating Chart', 'fooevents-seating' );
			}

			$view_seating_chart_text = str_ireplace( __( 'Seating Chart', 'fooevents-seating' ), $seating_chart_text, __( 'View seating chart', 'fooevents-seating' ) );

			echo esc_html( $view_seating_chart_text );
			echo '</a>';

			$seat_options = ob_get_clean();

		}

		return $seat_options;
	}


	/**
	 * Loads text-domain for localization
	 */
	public function load_text_domain() {

		$path   = dirname( plugin_basename( __FILE__ ) ) . '/languages/';
		$loaded = load_plugin_textdomain( 'fooevents-seating', false, $path );
	}

	/**
	 * Formats field name
	 *
	 * @param string $field_name the field name.
	 * @return string
	 */
	private function output_seating_field_name( $field_name ) {

		if ( strpos( $field_name, 'fooevents_seat_number' ) !== false ) {

			$field_name = str_replace( 'fooevents_', '', $field_name );

		} else {

			$field_name = str_replace( 'fooevents_seat_', '', $field_name );

		}

		$field_name = substr( $field_name, 0, strrpos( $field_name, '_' ) );
		$field_name = str_replace( '_', ' ', $field_name );
		$field_name = ucwords( $field_name );

		return $field_name;
	}

	/**
	 * Outputs notices to screen.
	 *
	 * @param array $notices notices.
	 */
	private function output_notices( $notices ) {

		foreach ( $notices as $notice ) {

			echo "<div class='updated'><p>" . esc_html( $notice ) . '</p></div>';

		}
	}



	/**
	 * Fetch seating options for add ticket page
	 */
	public function fetch_add_ticket_seating_options() {

		$var_id = 0;
		if ( isset( $_POST['event_id'] ) ) {  // phpcs:ignore WordPress.Security.NonceVerification.Missing

			$product_id = sanitize_text_field( wp_unslash( $_POST['event_id'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

		}

		$variation = wc_get_product( $product_id );

		if ( $variation->get_parent_id() !== 0 ) {
			$var_id     = $product_id;
			$product_id = $variation->get_parent_id();
		}

		$seat_options = '';

		$fooevents_seating_options_serialized = get_post_meta( $product_id, 'fooevents_seating_options_serialized', true );
		$fooevents_seating_options            = $this->correct_legacy_options( json_decode( $fooevents_seating_options_serialized, true ) );
		$fooevents_seating_options_serialized = wp_json_encode( $fooevents_seating_options, true );

		$fooevents_seats_unavailable_serialized = get_post_meta( $product_id, 'fooevents_seats_unavailable_serialized', true );
		if ( empty( $fooevents_seats_unavailable_serialized ) ) {
			$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_unavailable            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_unavailable_serialized, true ) );
		$fooevents_seats_unavailable_serialized = wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE );

		$fooevents_seats_blocked_serialized = get_post_meta( $product_id, 'fooevents_seats_blocked_serialized', true );
		if ( empty( $fooevents_seats_blocked_serialized ) ) {
			$fooevents_seats_blocked_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_blocked            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_blocked_serialized, true ) );
		$fooevents_seats_blocked_serialized = wp_json_encode( $fooevents_seats_blocked, JSON_UNESCAPED_UNICODE );

		$fooevents_seats_aisles_serialized = get_post_meta( $product_id, 'fooevents_seats_aisles_serialized', true );
		if ( empty( $fooevents_seats_aisles_serialized ) ) {
			$fooevents_seats_aisles_serialized = wp_json_encode( array() );
		}
		$fooevents_seats_aisles            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_aisles_serialized, true ) );
		$fooevents_seats_aisles_serialized = wp_json_encode( $fooevents_seats_aisles, JSON_UNESCAPED_UNICODE );

		echo '<script type="text/javascript">var seatColor = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColor', true ) ) ) . '";</script>';
		echo '<script type="text/javascript">var seatColorSelected = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColorSelected', true ) ) ) . '";</script>';
		echo '<script type="text/javascript">var seatColorUnavailableSelected = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColorUnavailableSelected', true ) ) ) . '";</script>';

		echo '<script type="text/javascript">var fooevents_seating_options_serialized = JSON.parse(\'' . wp_json_encode( $fooevents_seating_options ) . '\');</script>';
		echo '<script type="text/javascript">var fooevents_seats_options_serialized = new Object(); fooevents_seats_options_serialized[' . esc_js( $product_id ) . '] = ' . wp_kses_post( $fooevents_seating_options_serialized ) . '</script>';
		echo '<script type="text/javascript">var fooevents_seats_unavailable_serialized = JSON.parse(\'' . wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE ) . '\');</script>';
		echo '<script type="text/javascript">var fooevents_seats_blocked_serialized = JSON.parse(\'' . wp_json_encode( $fooevents_seats_blocked ) . '\');</script>';
		echo '<script type="text/javascript">var fooevents_seats_aisles_serialized = JSON.parse(\'' . wp_json_encode( $fooevents_seats_aisles ) . '\');</script>';

		$seat_row_values        = array();
		$seat_number_values     = array();
		$selected_row           = '';
		$fooevents_seating_data = array();
		$selected_field_id      = 0;

		echo '<script type="text/javascript">var event_id = ' . esc_js( $product_id ) . ';</script>';
		echo '<script type="text/javascript">var var_id = ' . esc_js( $var_id ) . ';</script>';

		$current_selected_var = array();
		/* The general event variation for the current attendee. */
		$selected_seating_var_option = '';
		if ( ! empty( $var_id ) ) {
			$selected_seating_var_option = new WC_Product_Variation( $var_id );
			if ( get_post_meta( $var_id, 'fooevents_variation_seating_required', true ) === 'no' ) {
				$required = false;
			} else {
				$required = true;
			}
			$selected_seating_var_option = $selected_seating_var_option->get_attributes();

			$selected_seating_var_option_keys = array_keys( $selected_seating_var_option );
			foreach ( $selected_seating_var_option_keys as $key => $option ) {

				array_push( $current_selected_var, $selected_seating_var_option[ $option ] );

			}
		}

		if ( ! empty( $fooevents_seating_options ) && '{}' !== $fooevents_seating_options ) {

			foreach ( $fooevents_seating_options as $row_option_key => $row_object ) {

				$option_values = array_values( $row_object );
				$keys          = array_keys( $row_object );

				$row_variations = array();

				if ( is_array( $option_values[2] ) ) {
					$row_variations = $option_values[2];
				} else {
					$row_variations = array( $option_values[2] );
				}

				foreach ( $row_variations as $row_variation ) {
					/* This is the variation selected for this row in the seating tab. */
					$this_var_option = new WC_Product_Variation( $row_variation );

					$this_var_attr      = $this_var_option->get_attributes();
					$this_var_attr_keys = array_keys( $this_var_attr );

					if ( empty( $this_var_attr_keys ) && ( ( is_array( $row_object[ $keys[2] ] ) && ! in_array( 'default', $row_object[ $keys[2] ], true ) && ! empty( $row_object[ $keys[2] ] ) ) || ( ! is_array( $row_object[ $keys[2] ] ) && 'default' !== $row_object[ $keys[2] ] ) ) ) {

						continue;

					}

					if ( ( is_array( $row_object[ $keys[2] ] ) && ( in_array( 'default', $row_object[ $keys[2] ], true ) || empty( $row_object[ $keys[2] ] ) ) ) || 'default' === $row_object[ $keys[2] ] ||
					( ( count( $current_selected_var ) === 3 &&
					( $this_var_attr[ $this_var_attr_keys[0] ] === $current_selected_var[0] || '' === $this_var_attr[ $this_var_attr_keys[0] ] ) &&
					( $this_var_attr[ $this_var_attr_keys[1] ] === $current_selected_var[1] || '' === $this_var_attr[ $this_var_attr_keys[1] ] ) &&
					( $this_var_attr[ $this_var_attr_keys[2] ] === $current_selected_var[2] || '' === $this_var_attr[ $this_var_attr_keys[2] ] )
					) || ( count( $current_selected_var ) === 2 &&
						( $this_var_attr[ $this_var_attr_keys[0] ] === $current_selected_var[0] || '' === $this_var_attr[ $this_var_attr_keys[0] ] ) &&
						( $this_var_attr[ $this_var_attr_keys[1] ] === $current_selected_var[1] || '' === $this_var_attr[ $this_var_attr_keys[1] ] )
					) ||
					( count( $current_selected_var ) === 1 &&
						( $this_var_attr[ $this_var_attr_keys[0] ] === $current_selected_var[0] || '' === $this_var_attr[ $this_var_attr_keys[0] ] )
					) ) ) {

						array_push( $seat_row_values, array( $keys[0], $row_object[ $keys[0] ], $selected_row ) );

					}
				}
			}

			foreach ( $fooevents_seating_options as $row_option_key => $row_object ) {

				$row_key = str_replace( '_option', '', $row_option_key );
				$fooevents_seating_data[ $row_key . '_row_name' ] = array(
					'number_seats' => $row_object[ $row_key . '_number_seats' ],
					'variation'    => $row_object[ $row_key . '_variations' ],
				);

			}

			if ( ! empty( $fooevents_seats_unavailable_serialized ) ) {
				echo '<script type="text/javascript">fooevents_seats_unavailable_serialized[' . esc_js( $product_id ) . ']  = ' . wp_kses_post( $fooevents_seats_unavailable_serialized ) . '</script>';
			}

			if ( ! empty( $fooevents_seats_blocked_serialized ) ) {
				echo '<script type="text/javascript">fooevents_seats_blocked_serialized[' . esc_js( $product_id ) . ']  = ' . wp_kses_post( $fooevents_seats_blocked_serialized ) . '</script>';
			}

			if ( ! empty( $fooevents_seats_aisles_serialized ) ) {
				echo '<script type="text/javascript">fooevents_seats_aisles_serialized[' . esc_js( $product_id ) . ']  = ' . wp_kses_post( $fooevents_seats_aisles_serialized ) . '</script>';
			}

			echo '<script type="text/javascript">var fooevents_seating_translations = new Object(); fooevents_seating_translations["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $this->get_translations( $product_id ) ) . '\');</script>';
			echo '<script type="text/javascript">var fooevents_seating_data = new Object(); fooevents_seating_data["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seating_data ) . '\');</script>';
			echo '<script type="text/javascript">var fooevents_seats_unavailable = new Object(); fooevents_seats_unavailable["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE ) . '\');</script>';
			echo '<script type="text/javascript">var fooevents_seats_blocked = new Object(); fooevents_seats_blocked["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_blocked ) . '\');</script>';
			echo '<script type="text/javascript">var fooevents_seats_aisles = new Object(); fooevents_seats_aisles["fooevents_event_' . esc_js( $product_id ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_aisles ) . '\');</script>';
			echo '<script type="text/javascript">var fooevents_selected_seat = 0; </script>';
			echo '<script type="text/javascript">var fooevents_selected_row = ""; fooevents_selected_row = "' . esc_js( $selected_field_id ) . '_row_name";</script>';

			$seating_chart_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatingChartOverride', true );

			if ( '' === $seating_chart_text ) {
				$seating_chart_text = __( 'Seating Chart', 'fooevents-seating' );
			}

			$row_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingRowOverride', true );

			if ( '' === $row_text ) {
				$row_text = __( 'Row', 'fooevents-seating' );
			}

			$row_name_text = str_ireplace( __( 'Row', 'fooevents-seating' ), $row_text, __( 'Row name:', 'fooevents-seating' ) );

			$seat_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatOverride', true );

			if ( '' === $seat_text ) {
				$seat_text = __( 'Seat', 'fooevents-seating' );
			}

			$seat_number_text = str_ireplace( __( 'Seat', 'fooevents-seating' ), $seat_text, __( 'Seat number:', 'fooevents-seating' ) );

			require_once $this->config->template_path . 'seating-ticket-detail.php';

			echo "<a href='javascript:void(0)' name='fooevents_variation_" . esc_js( $var_id ) . "' class='fooevents_seating_chart_admin button button-primary' id='fooevents_event_id_" . esc_js( $product_id ) . "'>";

			$seating_chart_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatingChartOverride', true );

			if ( '' === $seating_chart_text ) {
				$seating_chart_text = __( 'Seating Chart', 'fooevents-seating' );
			}

			$view_seating_chart_text = str_ireplace( __( 'Seating Chart', 'fooevents-seating' ), $seating_chart_text, __( 'View seating chart', 'fooevents-seating' ) );

			echo esc_html( $view_seating_chart_text );
			echo '</a>';

		}

		exit();
	}


	/**
	 * Refreshes seating chart in the back-end
	 */
	public function refresh_seating_chart() {

		$response = array( 'status' => 'error' );

		if ( ! empty( $_POST['event_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing

			$product_id = sanitize_text_field( wp_unslash( $_POST['event_id'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

			$unavailable_seats = get_post_meta( $product_id, 'fooevents_seats_unavailable_serialized', true );

			if ( empty( $unavailable_seats ) ) {

				$unavailable_seats = wp_json_encode( array() );

			}

			$response = array(
				'status' => 'success',
				'data'   => $unavailable_seats,
			);

		}

		echo wp_json_encode( $response );

		exit();
	}

	/**
	 * Fetch all WooCommerce variations for seating options on product
	 */
	public function fetch_all_woocommerce_variation_attributes() {

		global $woocommerce;
		$attributes = array();

		if ( ! empty( $_POST['productID'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing

			$product_id = sanitize_text_field( wp_unslash( $_POST['productID'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			$product    = new WC_Product_Variable( $product_id );
			$variations = $product->get_children();
			foreach ( $variations as $value ) {
				$single_variation  = new WC_Product_Variation( $value );
				$var_id_attributes = array();
				array_push( $var_id_attributes, $value );
				foreach ( $single_variation->get_variation_attributes() as $attribute ) {
					array_push( $var_id_attributes, $attribute );
				}
				array_push( $attributes, $var_id_attributes );
			}
		}
		echo wp_json_encode( $attributes );

		exit();
	}

	/**
	 * Fetch attributes for selected WooCommerce variation for seating options on product
	 */
	public function fetch_selected_variation_attributes() {

		global $woocommerce;
		$attributes = array();

		if ( ! empty( sanitize_text_field( wp_unslash( $_POST['productID'] ) ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing

			$product_id     = sanitize_text_field( wp_unslash( $_POST['productID'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			$product        = new WC_Product_Variation( $product_id );
			$get_attributes = $product->get_attributes();

			foreach ( $get_attributes as $value ) {
				array_push( $attributes, $value );
			}
		}
		echo wp_json_encode( $attributes );

		exit();
	}

	/**
	 * Output JavaScript object initialization for use throughout the rest of the script
	 *
	 * @param object $checkout checkout.
	 */
	public function attendee_checkout_script_objects( $checkout ) {
		echo '<script type="text/javascript">if (typeof fooevents_seating_translations == "undefined") { var fooevents_seating_translations = new Object(); }</script>';
		echo '<script type="text/javascript">if (typeof fooevents_seating_data == "undefined") { var fooevents_seating_data = new Object(); }</script>';
		echo '<script type="text/javascript">if (typeof fooevents_seats_unavailable == "undefined") { var fooevents_seats_unavailable = new Object(); }</script>';
		echo '<script type="text/javascript">if (typeof fooevents_seats_blocked == "undefined") { var fooevents_seats_blocked = new Object(); }</script>';
		echo '<script type="text/javascript">if (typeof fooevents_seats_aisles == "undefined") { var fooevents_seats_aisles = new Object(); }</script>';
		echo '<script type="text/javascript">if (typeof variationsToShow == "undefined") { var variationsToShow = new Object(); }</script>';
	}

	/**
	 * Outputs the seating chart on the product screen
	 *
	 * @param object $checkout checkout.
	 */
	public function output_seating_fields_product( $checkout ) {

		global $woocommerce;
		global $post;
		global $product;

		$view_seating_options     = get_post_meta( $post->ID, 'WooCommerceEventsViewSeatingOptions', true );
		$seating_chart            = get_post_meta( $post->ID, 'WooCommerceEventsViewSeatingChart', true );
		$seating_chart_other_vars = get_post_meta( $post->ID, 'WooCommerceEventsViewSeatingOtherVariations', true );
		$event_type               = get_post_meta( $post->ID, 'WooCommerceEventsType', true );

		if ( 'on' === $view_seating_options && 'seating' === $event_type ) {
			echo '<script type="text/javascript"> if (!fooevents_seats_options_serialized) { var fooevents_seats_options_serialized = []; } </script>';
			echo '<script type="text/javascript"> if (!fooevents_seats_unavailable_serialized) { var fooevents_seats_unavailable_serialized = []; } </script>';
			echo '<script type="text/javascript"> if (!fooevents_seats_blocked_serialized) { var fooevents_seats_blocked_serialized = []; } </script>';
			echo '<script type="text/javascript"> if (!fooevents_seats_aisles_serialized) { var fooevents_seats_aisles_serialized = []; } </script>';
			echo '<script type="text/javascript"> var seatColor = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColor', true ) ) ) . '";</script>';
			echo '<script type="text/javascript"> var seatColorSelected = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColorSelected', true ) ) ) . '";</script>';
			echo '<script type="text/javascript"> var seatColorUnavailableSelected = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColorUnavailableSelected', true ) ) ) . '";</script>';

			$required = true;

			$var_id = 0;

			$variations_to_show     = '';
			$fooevents_seating_data = array();

			$fooevents_seating_options_serialized = get_post_meta( $post->ID, 'fooevents_seating_options_serialized', true );
			$fooevents_seating_options            = $this->correct_legacy_options( json_decode( $fooevents_seating_options_serialized, true ) );
			$fooevents_seating_options_serialized = wp_json_encode( $fooevents_seating_options, true );

			$fooevents_seats_unavailable_serialized = get_post_meta( $post->ID, 'fooevents_seats_unavailable_serialized', true );
			$fooevents_seats_unavailable_decoded    = '' === $fooevents_seats_unavailable_serialized ? array() : json_decode( $fooevents_seats_unavailable_serialized, true );

			/* Add seats to unavailable array that are added to the cart */

			$fooevents_temp_seats_unavailable_serialized = get_post_meta( $post->ID, 'fooevents_temp_seats_unavailable_serialized', true );
			$fooevents_temp_seats_unavailable_decoded    = '' === $fooevents_temp_seats_unavailable_serialized ? array() : json_decode( $fooevents_temp_seats_unavailable_serialized, true );

			if ( empty( $fooevents_temp_seats_unavailable_serialized ) ) {
				$fooevents_temp_seats_unavailable_serialized = wp_json_encode( array() );
			}

			$fooevents_temp_seats_unavailable_serialized = json_decode( $fooevents_temp_seats_unavailable_serialized, true );

			/* Loop through temporarily unavailable seats and remove entries older than 10 minutes (600 seconds) */

			foreach ( $fooevents_temp_seats_unavailable_serialized as $temp_seat => $timestamp ) {

				if ( ( time() - $timestamp ) >= 600 ) {

					unset( $fooevents_temp_seats_unavailable_serialized[ $temp_seat ] );
				}
			}

			$fooevents_temp_seats_unavailable_serialized = wp_json_encode( $fooevents_temp_seats_unavailable_serialized, JSON_UNESCAPED_UNICODE );

			update_post_meta( $post->ID, 'fooevents_temp_seats_unavailable_serialized', $fooevents_temp_seats_unavailable_serialized );

			$fooevents_seats_unavailable_decoded = array_merge( $fooevents_seats_unavailable_decoded, array_keys( $fooevents_temp_seats_unavailable_decoded ) );

			if ( empty( $fooevents_seats_unavailable_serialized ) ) {
				$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
			}
			$fooevents_seats_unavailable            = $this->correct_legacy_options_unavailable_seats( $fooevents_seats_unavailable_decoded );
			$fooevents_seats_unavailable_serialized = wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE );

			$fooevents_seats_blocked_serialized = get_post_meta( $post->ID, 'fooevents_seats_blocked_serialized', true );
			if ( empty( $fooevents_seats_blocked_serialized ) ) {
				$fooevents_seats_blocked_serialized = wp_json_encode( array() );
			}
			$fooevents_seats_blocked            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_blocked_serialized, true ) );
			$fooevents_seats_blocked_serialized = wp_json_encode( $fooevents_seats_blocked, JSON_UNESCAPED_UNICODE );

			$fooevents_seats_aisles_serialized = get_post_meta( $post->ID, 'fooevents_seats_aisles_serialized', true );
			if ( empty( $fooevents_seats_aisles_serialized ) ) {
				$fooevents_seats_aisles_serialized = wp_json_encode( array() );
			}
			$fooevents_seats_aisles            = $this->correct_legacy_options_unavailable_seats( json_decode( $fooevents_seats_aisles_serialized, true ) );
			$fooevents_seats_aisles_serialized = wp_json_encode( $fooevents_seats_aisles, JSON_UNESCAPED_UNICODE );

			if ( ! empty( $fooevents_seating_options ) ) {

				foreach ( $fooevents_seating_options as $row_option_key => $row_object ) {

					$row_key = str_replace( '_option', '', $row_option_key );

					$fooevents_seating_data[ $row_key . '_row_name' ] = array(
						'number_seats' => $row_object[ $row_key . '_number_seats' ],
						'variation'    => $row_object[ $row_key . '_variations' ],
					);

				}

				echo '<script type="text/javascript">var fooevents_seating_translations = new Object(); fooevents_seating_translations["fooevents_event_' . esc_js( $post->ID ) . '"] = JSON.parse(\'' . wp_json_encode( $this->get_translations( $post->ID ) ) . '\');</script>';
				echo '<script type="text/javascript">var fooevents_seating_data = new Object(); fooevents_seating_data["fooevents_event_' . esc_js( $post->ID ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seating_data ) . '\');</script>';
				echo '<script type="text/javascript">var fooevents_seats_unavailable = new Object(); fooevents_seats_unavailable["fooevents_event_' . esc_js( $post->ID ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE ) . '\');</script>';
				echo '<script type="text/javascript">var fooevents_seats_blocked = new Object(); fooevents_seats_blocked["fooevents_event_' . esc_js( $post->ID ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_blocked ) . '\');</script>';
				echo '<script type="text/javascript">var fooevents_seats_aisles = new Object(); fooevents_seats_aisles["fooevents_event_' . esc_js( $post->ID ) . '"] = JSON.parse(\'' . wp_json_encode( $fooevents_seats_aisles ) . '\');</script>';

				if ( ! empty( $fooevents_seats_unavailable_serialized ) ) {
					echo '<script type="text/javascript">fooevents_seats_unavailable_serialized[' . esc_js( $post->ID ) . ']  = ' . wp_kses_post( $fooevents_seats_unavailable_serialized ) . '</script>';
				}

				if ( ! empty( $fooevents_seats_blocked_serialized ) ) {
					echo '<script type="text/javascript">fooevents_seats_blocked_serialized[' . esc_js( $post->ID ) . ']  = ' . wp_kses_post( $fooevents_seats_blocked_serialized ) . '</script>';
				}

				if ( ! empty( $fooevents_seats_aisles_serialized ) ) {
					echo '<script type="text/javascript">fooevents_seats_aisles_serialized[' . esc_js( $post->ID ) . ']  = ' . wp_kses_post( $fooevents_seats_aisles_serialized ) . '</script>';
				}

				echo '<script type="text/javascript"> fooevents_seats_options_serialized[' . esc_js( $post->ID ) . '] = ' . wp_kses_post( $fooevents_seating_options_serialized ) . '</script>';

				if ( ! empty( $fooevents_seating_options ) && '{}' !== $fooevents_seating_options ) {
					$select_values_row = array();

					foreach ( $fooevents_seating_options as $option_key => $option ) {

						$option_ids                          = array_keys( $option );
						$option_values                       = array_values( $option );
						$option_label_output                 = __( 'Seat', 'fooevents-seating' );
						$select_label                        = $option_label_output;
						$select_values_row[ $option_ids[0] ] = $option_values[0];

					}

					woocommerce_form_field( 'fooevents_seats__trans', '', '' );

					if ( 'on' === $view_seating_options ) {
						echo "<p><a href='javascript:void(0)' name='fooevents_variation_" . esc_attr( $var_id ) . "' class='fooevents_seating_chart' id='fooevents_event_id_" . esc_attr( $post->ID ) . "'><u>";

						$seats_text = get_post_meta( $post->ID, 'WooCommerceEventsSeatingSeatOverridePlural', true );

						if ( '' === $seats_text ) {
							$seats_text = __( 'Seats', 'fooevents-seating' );
						}

						$choose_seats_text = str_ireplace( __( 'Seats', 'fooevents-seating' ), $seats_text, __( 'Choose seats', 'fooevents-seating' ) );
						echo esc_html( $choose_seats_text );

						$seating_chart_text = get_post_meta( $post->ID, 'WooCommerceEventsSeatingSeatingChartOverride', true );

						if ( '' === $seating_chart_text ) {
							$seating_chart_text = __( 'Seating Chart', 'fooevents-seating' );
						}

						echo " <span>(0)</span></u></a></p><div class='clear clearfix'></div><div id='fooevents_seating_dialog' title='" . esc_attr( $seating_chart_text ) . "'></div>";
					}
				}
			}

			if ( $product->is_type( 'variable' ) ) {

				echo '<script type="text/javascript">var variationsToShow = []; variationsToShow[' . esc_js( $var_id ) . '] = "all";</script>';

			} else {

				echo '<script type="text/javascript">var variationsToShow = []; variationsToShow[' . esc_js( $var_id ) . '] = "none";</script>';

			}

			echo '<script type="text/javascript">var showOtherVars = "' . $seating_chart_other_vars . '"; </script>';

		}
	}



	function check_if_seat_booked( $quantity, $product_id ) {

		if ( isset( $_POST['fooevents_seats__trans'] ) ) {

			/* Check first to see if these seats were not added to someone else's cart */
			$seats_text = get_post_meta( $product_id, 'WooCommerceEventsSeatingSeatOverridePlural', true );

			if ( '' === $seats_text ) {
				$seats_text = __( 'Seats', 'fooevents-seating' );
			}

			$fooevents_seats_unavailable_serialized = get_post_meta( $product_id, 'fooevents_seats_unavailable_serialized', true );

			if ( empty( $fooevents_seats_unavailable_serialized ) ) {
				$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
			}
			$fooevents_seats_unavailable = json_decode( $fooevents_seats_unavailable_serialized, true );

			$fooevents_temp_seats_unavailable_serialized = get_post_meta( $product_id, 'fooevents_temp_seats_unavailable_serialized', true );

			if ( empty( $fooevents_temp_seats_unavailable_serialized ) ) {
				$fooevents_temp_seats_unavailable_serialized = wp_json_encode( array() );
			}

			$fooevents_temp_seats_unavailable_serialized = json_decode( $fooevents_temp_seats_unavailable_serialized, true );

			$fooevents_seats_unavailable = array_merge( $fooevents_seats_unavailable, array_keys( $fooevents_temp_seats_unavailable_serialized ) );

			if ( ! empty( $fooevents_seats_unavailable ) && isset( $_POST['fooevents_seats__trans'] ) && ! empty( $_POST['fooevents_seats__trans'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing

				foreach ( explode( ',', $_POST['fooevents_seats__trans'] ) as $seat ) {
					if ( '' !== $seat ) {
						$key = array_search( $seat, $fooevents_seats_unavailable, true ); // phpcs:ignore WordPress.Security.NonceVerification.Missing

						if ( false !== $key && null !== $key ) {

							$already_booked_text = str_ireplace( __( 'Seats', 'woocommerce-events' ), $seats_text, __( 'The selected seats are unfortunately not available anymore. Please select different seats.', 'fooevents-seating' ) );

							$notice = sprintf( $already_booked_text );
							wc_clear_notices();
							wc_add_notice( $notice, 'error' );
							$quantity = 0;

						}
					}
				}
			}
		}

		return $quantity;
	}






	/**
	 * Add trans fields as item data to the cart object and to temporary unavailable seat meta field
	 *
	 * @since 1.0.0
	 * @param Array $cart_item_data item data in cart.
	 * @param int   $product_id the product ID.
	 * @param int   $variation_id the variation ID.
	 * @param int   $quantity the quantity.
	 */
	public function add_seating_addtocart( $cart_item_data, $product_id, $variation_id, $quantity ) {

		/* Store the selected seats (trans variable) in temporary unavailable seat meta field on product */
		if ( isset( $_POST['fooevents_seats__trans'] ) ) {
			$fooevents_temp_seats_unavailable_serialized = get_post_meta( $product_id, 'fooevents_temp_seats_unavailable_serialized', true );

			if ( empty( $fooevents_temp_seats_unavailable_serialized ) ) {
				$fooevents_temp_seats_unavailable_serialized = wp_json_encode( array() );
			}

			$fooevents_temp_seats_unavailable_serialized = json_decode( $fooevents_temp_seats_unavailable_serialized, true );

			foreach ( explode( ',', $_POST['fooevents_seats__trans'] ) as $seat ) {
				$fooevents_temp_seats_unavailable_serialized[ $seat ] = time();
			}

			/* Loop through temporarily unavailable seats and remove entries older than 10 minutes (600 seconds) */

			foreach ( $fooevents_temp_seats_unavailable_serialized as $temp_seat => $timestamp ) {

				if ( ( time() - $timestamp ) >= 600 ) {

					unset( $fooevents_temp_seats_unavailable_serialized[ $temp_seat ] );
				}
			}

			$fooevents_temp_seats_unavailable_serialized = wp_json_encode( $fooevents_temp_seats_unavailable_serialized, JSON_UNESCAPED_UNICODE );

			update_post_meta( $product_id, 'fooevents_temp_seats_unavailable_serialized', $fooevents_temp_seats_unavailable_serialized );

			/* Add trans field as item data to the cart object */

			if ( ! empty( $_POST['fooevents_seats__trans'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
				$cart_item_data['fooevents_seats'] = sanitize_text_field( wp_unslash( $_POST['fooevents_seats__trans'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			}
		}

		return $cart_item_data;
	}



	/**
	 * Remove seat from temporary unavailable seat meta field when item removed from cart
	 *
	 * @since 1.0.0
	 * @param Array $removed_cart_item_key item data in cart.
	 * @param int   $cart the product ID.
	 */
	public function remove_seating_removedfromcart( $removed_cart_item_key, $cart ) {

		$product_id    = $cart->removed_cart_contents[ $removed_cart_item_key ]['product_id'];
		$removed_seats = $cart->removed_cart_contents[ $removed_cart_item_key ]['fooevents_seats'];

		$fooevents_temp_seats_unavailable_serialized = get_post_meta( $product_id, 'fooevents_temp_seats_unavailable_serialized', true );

		if ( empty( $fooevents_temp_seats_unavailable_serialized ) ) {
			$fooevents_temp_seats_unavailable_serialized = wp_json_encode( array() );
		}

		$fooevents_temp_seats_unavailable_serialized = json_decode( $fooevents_temp_seats_unavailable_serialized, true );

		foreach ( explode( ',', $removed_seats ) as $seat ) {
			unset( $fooevents_temp_seats_unavailable_serialized[ $seat ] );
		}

		$fooevents_temp_seats_unavailable_serialized = wp_json_encode( $fooevents_temp_seats_unavailable_serialized, JSON_UNESCAPED_UNICODE );

		update_post_meta( $product_id, 'fooevents_temp_seats_unavailable_serialized', $fooevents_temp_seats_unavailable_serialized );
		$cart->removed_cart_contents[ $removed_cart_item_key ]['fooevents_seats'] = '';

		return $cart;
	}


	/**
	 * Remove last seat from temporary unavailable seat meta field when quantity reduced in the cart
	 *
	 * @since 1.0.0
	 * @param Array $removed_cart_item_key item data in cart.
	 * @param int   $cart the product ID.
	 */
	public function remove_seating_quantity_update( $cart_item_key, $quantity, $old_quantity, $cart ) {

		$product_id = $cart->cart_contents[ $cart_item_key ]['product_id'];

		$removed_quantity = $old_quantity - $quantity;

		$fooevents_temp_seats_unavailable_serialized = get_post_meta( $product_id, 'fooevents_temp_seats_unavailable_serialized', true );

		if ( empty( $fooevents_temp_seats_unavailable_serialized ) ) {
			$fooevents_temp_seats_unavailable_serialized = wp_json_encode( array() );
		}

		$fooevents_temp_seats_unavailable_serialized = json_decode( $fooevents_temp_seats_unavailable_serialized, true );

		$seats = '';

		/* if this item's quantity was reduced */
		if ( $removed_quantity > 0 ) {
			$seats           = explode( ',', $cart->cart_contents[ $cart_item_key ]['fooevents_seats'] );
			$seats_to_remove = array_slice( $seats, -( $removed_quantity ) );
			foreach ( $seats_to_remove as $seat ) {
				unset( $fooevents_temp_seats_unavailable_serialized[ $seat ] );
				$findKey = array_search( $seat, $seats );
				unset( $seats[ $findKey ] );
			}
			$cart->cart_contents[ $cart_item_key ]['fooevents_seats'] = implode( ',', $seats );
		}

		$fooevents_temp_seats_unavailable_serialized = wp_json_encode( $fooevents_temp_seats_unavailable_serialized, JSON_UNESCAPED_UNICODE );

		update_post_meta( $product_id, 'fooevents_temp_seats_unavailable_serialized', $fooevents_temp_seats_unavailable_serialized );

		return $cart;
	}





	/**
	 * Converts legacy seating field options to new format
	 *
	 * @param array $fooevents_seating_options seating options.
	 * @return array $fooevents_seating_options seating options.
	 */
	private function correct_legacy_options( $fooevents_seating_options ) {

		$processed_fooevents_seating_options = array();

		$starts_with_number = false;

		if ( ! empty( $fooevents_seating_options ) ) {

			$x = 0;
			foreach ( $fooevents_seating_options as $option_key => $option ) {

				$keys = array_keys( $option );

				if ( strpos( $option_key, 'option' ) !== false ) {

					$corrected_id = str_replace( '_', '', substr( $keys[0], 0, strpos( $keys[0], '_row_name' ) ) );

					/* If the corrected ID is only a number then this causes the custom field to be sorted incorrectly. */
					if ( preg_match( '/^\d/', $corrected_id ) === 1 ) {
						$corrected_id       = 'r' . $corrected_id;
						$starts_with_number = true;
					}

					if ( strpos( $keys[0], '_row_name' ) !== 0 && ( substr_count( $keys[0], '_' ) > 2 || $starts_with_number ) ) {

						$processed_fooevents_seating_options[ $corrected_id ][ $corrected_id . '_row_name' ] = $option[ $keys[0] ];

					} else {

						$processed_fooevents_seating_options[ $corrected_id ] = $option;

					}

					if ( strpos( $keys[1], '_number_seats' ) !== 0 && ( substr_count( $keys[0], '_' ) > 2 || $starts_with_number ) ) {

						$processed_fooevents_seating_options[ $corrected_id ][ $corrected_id . '_number_seats' ] = $option[ $keys[1] ];

					} else {

						$processed_fooevents_seating_options[ $corrected_id ] = $option;

					}

					if ( strpos( $keys[2], '_variations' ) !== 0 && ( substr_count( $keys[0], '_' ) > 2 || $starts_with_number ) ) {

						$processed_fooevents_seating_options[ $corrected_id ][ $corrected_id . '_variations' ] = $option[ $keys[2] ];

					} else {

						$processed_fooevents_seating_options[ $corrected_id ] = $option;

					}
				} else {

					$processed_fooevents_seating_options[ $option_key ] = $option;

				}
			}
		}

		return $processed_fooevents_seating_options;
	}


	/**
	 * Converts legacy unavailable seats to new format
	 *
	 * @param array $fooevents_seats_unavailable unavailable seats.
	 * @return array $processed_fooevents_seats_unavailable new unavailable seats.
	 */
	private function correct_legacy_options_unavailable_seats( $fooevents_seats_unavailable ) {

		$processed_fooevents_seats_unavailable = array();

		if ( ! empty( $fooevents_seats_unavailable ) ) {

			foreach ( $fooevents_seats_unavailable as $unavailabe_seat ) {

				$corrected_id = str_replace( '_', '', substr( $unavailabe_seat, 0, strpos( $unavailabe_seat, '_number_seats' ) ) );
				$seat_nr      = substr( $unavailabe_seat, strrpos( $unavailabe_seat, '_' ) + 1 );
				$corrected_id = $corrected_id . '_number_seats_' . $seat_nr;

				if ( preg_match( '/^\d/', $corrected_id ) === 1 ) {
					$corrected_id = 'r' . $corrected_id;
				}

				array_push( $processed_fooevents_seats_unavailable, $corrected_id );

			}
		}

		return $processed_fooevents_seats_unavailable;
	}


	/**
	 * Adds unavailable seat to the event
	 *
	 * @param array $post_id the event ID.
	 */
	private function add_unavailable_seat_to_event( $post_id ) {

		$post_type   = get_post_type( $post_id );
		$post_status = get_post_status( $post_id );
		$seat_row    = '';

		if ( 'event_magic_tickets' === $post_type && in_array( $post_status, array( 'publish', 'draft', 'auto-draft', 'future', 'trash' ), true ) ) {
			$event_id = get_post_meta( $post_id, 'WooCommerceEventsProductID', true );
			if ( empty( $event_id ) && isset( $_POST['WooCommerceEventsEvent'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
				$event_id = sanitize_text_field( wp_unslash( $_POST['WooCommerceEventsEvent'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			}
			$fooevents_seats_unavailable_serialized = get_post_meta( $event_id, 'fooevents_seats_unavailable_serialized', true );
			if ( empty( $fooevents_seats_unavailable_serialized ) ) {
				$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
			}
			$fooevents_seats_unavailable = json_decode( $fooevents_seats_unavailable_serialized, true );

			$all_post_meta = get_post_meta( $post_id );

			foreach ( $all_post_meta as $key => $val ) {

				if ( strpos( $key, 'fooevents_seat_number_' ) === 0 ) {

					$seat_row = substr( $key, strrpos( $key, '_' ) + 1 ) . '_number_seats_' . $val[0];

				}
			}

			if ( ! in_array( $seat_row, $fooevents_seats_unavailable, true ) ) {

				array_push( $fooevents_seats_unavailable, $seat_row );

			}
			/* hidden fields, individual custom fields, add_post_meta instead of update_post_meta, get_post_meta with false gives array of unavailable seats. */
			$fooevents_seats_unavailable_serialized = wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE );

			update_post_meta( $event_id, 'fooevents_seats_unavailable_serialized', $fooevents_seats_unavailable_serialized );

		}
	}


	/**
	 * Removes unavailable seat from the event
	 *
	 * @param array $post_id the event ID.
	 * @param array $specific_seat specific seat to be removed (optional).
	 */
	public function remove_unavailable_seats_from_event( $post_id, $specific_seat = '' ) {

		$post_type   = get_post_type( $post_id );
		$post_status = get_post_status( $post_id );
		$seat_row    = '';

		if ( ( 'event_magic_tickets' === $post_type && in_array( $post_status, array( 'publish', 'draft', 'future', 'trash' ), true ) ) || 'product' === $post_type ) {
			if ( 'event_magic_tickets' === $post_type ) {
				$event_id = get_post_meta( $post_id, 'WooCommerceEventsProductID', true );

				$all_post_meta = get_post_meta( $post_id );

				foreach ( $all_post_meta as $key => $val ) {

					if ( strpos( $key, 'fooevents_seat_number_' ) === 0 ) {

						$seat_row = substr( $key, strrpos( $key, '_' ) + 1 ) . '_number_seats_' . $val[0];

						break;

					}
				}
			}

			if ( 'product' === $post_type ) {

				$event_id = $post_id;
				$seat_row = $specific_seat;

			}

			if ( '' !== $seat_row ) {

				$fooevents_seats_unavailable_serialized = get_post_meta( $event_id, 'fooevents_seats_unavailable_serialized', true );
				if ( empty( $fooevents_seats_unavailable_serialized ) ) {
					$fooevents_seats_unavailable_serialized = wp_json_encode( array() );
				}
				$fooevents_seats_unavailable = json_decode( $fooevents_seats_unavailable_serialized, true );

				$key = array_search( $seat_row, $fooevents_seats_unavailable, true );
				if ( false !== $key ) {
					unset( $fooevents_seats_unavailable[ $key ] );
					$fooevents_seats_unavailable = array_values( $fooevents_seats_unavailable );
				}
				/* hidden fields, individual custom fields, add_post_meta instead of update_post_meta, get_post_meta with false gives array of unavailable seats */
				$fooevents_seats_unavailable_serialized = wp_json_encode( $fooevents_seats_unavailable, JSON_UNESCAPED_UNICODE );

				if ( update_post_meta( $event_id, 'fooevents_seats_unavailable_serialized', $fooevents_seats_unavailable_serialized ) !== false ) {
					$this->wpml_sync_seating_between_translations( $event_id );
				}
			}
		}
	}

	/**
	 * If WPML is active sync seating between translations on new order
	 *
	 * @param int $order_id order ID.
	 */
	public function wpml_sync_seating_between_translations_new_order( $order ) {

		if ( ! function_exists( 'is_plugin_active' ) || ! function_exists( 'is_plugin_active_for_network' ) ) {

			require_once ABSPATH . '/wp-admin/includes/plugin.php';

		}

		if ( is_plugin_active( 'sitepress-multilingual-cms/sitepress.php' ) || is_plugin_active_for_network( 'sitepress-multilingual-cms/sitepress.php' ) ) {

			$order = wc_get_order( $order->data['id'] );

			foreach ( $order->get_items() as $id => $item ) {

				$product_id = $item->get_product_id();

				$unavailable_seats = get_post_meta( $product_id, 'fooevents_seats_unavailable_serialized', true );
				$blocked_seats     = get_post_meta( $product_id, 'fooevents_seats_blocked_serialized', true );

				if ( ! empty( $unavailable_seats ) ) {

					do_action( 'wpml_sync_custom_field', $product_id, 'fooevents_seats_unavailable_serialized' );

				}

				if ( ! empty( $blocked_seats ) ) {

					do_action( 'wpml_sync_custom_field', $product_id, 'fooevents_seats_blocked_serialized' );

				}
			}
		}
	}

	/**
	 * If WPML is active sync seating between translations
	 *
	 * @param int $product_id product ID.
	 */
	public function wpml_sync_seating_between_translations( $product_id ) {

		if ( ! function_exists( 'is_plugin_active' ) || ! function_exists( 'is_plugin_active_for_network' ) ) {

			require_once ABSPATH . '/wp-admin/includes/plugin.php';

		}

		if ( is_plugin_active( 'sitepress-multilingual-cms/sitepress.php' ) || is_plugin_active_for_network( 'sitepress-multilingual-cms/sitepress.php' ) ) {

			do_action( 'wpml_sync_custom_field', $product_id, 'fooevents_seats_unavailable_serialized' );
			do_action( 'wpml_sync_custom_field', $product_id, 'fooevents_seats_blocked_serialized' );

		}
	}




	/**
	 * Displays event seating term options
	 *
	 * @param object $post post.
	 * @return string
	 */
	public function generate_seating_term_options( $post ) {

		ob_start();

		$woocommerce_events_seating_row_override                  = get_post_meta( $post->ID, 'WooCommerceEventsSeatingRowOverride', true );
		$woocommerce_events_seating_row_override_plural           = get_post_meta( $post->ID, 'WooCommerceEventsSeatingRowOverridePlural', true );
		$woocommerce_events_seating_seat_override                 = get_post_meta( $post->ID, 'WooCommerceEventsSeatingSeatOverride', true );
		$woocommerce_events_seating_seat_override_plural          = get_post_meta( $post->ID, 'WooCommerceEventsSeatingSeatOverridePlural', true );
		$woocommerce_events_seating_seating_chart_override        = get_post_meta( $post->ID, 'WooCommerceEventsSeatingSeatingChartOverride', true );
		$woocommerce_events_seating_seating_chart_override_plural = get_post_meta( $post->ID, 'WooCommerceEventsSeatingSeatingChartOverridePlural', true );
		$woocommerce_events_seating_front_override                = get_post_meta( $post->ID, 'WooCommerceEventsSeatingFrontOverride', true );
		$woocommerce_events_seating_front_override_plural         = get_post_meta( $post->ID, 'WooCommerceEventsSeatingFrontOverridePlural', true );

		require $this->config->template_path . 'seating-term-options.php';

		$seating_term_options = ob_get_clean();

		return $seating_term_options;
	}
}
