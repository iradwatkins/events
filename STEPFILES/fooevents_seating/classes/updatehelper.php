<?php if ( ! defined( 'ABSPATH' ) ) {
	exit;}

/**
 * Update Helper class.
 *
 * @link https://www.fooevents.com
 * @package fooevents-bookings
 */
class Fooevents_Seating_Update_Helper {

	/**
	 * Configuration object
	 *
	 * @var array $config contains paths and other configurations
	 */
	private $config;

	/**
	 * Slug
	 *
	 * @var string $slug
	 */
	private $slug;

	/**
	 * Plugin data
	 *
	 * @var array $plugin_data
	 */
	private $plugin_data;

	/**
	 * FooEvents API Key
	 *
	 * @var string $fooevents_api_key
	 */
	private $fooevents_api_key;

	/**
	 * Envato API Key
	 *
	 * @var string $envato_api_key
	 */
	private $envato_api_key;

	/**
	 * Site URL
	 *
	 * @var string $home_url
	 */
	private $home_url;

	/**
	 * Response
	 *
	 * @var array $fooevents_reponse
	 */
	private $fooevents_reponse;


	public function __construct( $config ) {

		$this->config = $config;

		$this->fooevents_api_key = get_option( 'globalWooCommerceEventsAPIKey', true );
		$this->envato_api_key    = get_option( 'globalWooCommerceEnvatoAPIKey', true );
		$this->home_url          = get_home_url();

		if ( 1 === (int) $this->fooevents_api_key ) {

			$this->fooevents_api_key = '';

		}

		add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'set_transitent' ) );
		add_filter( 'plugins_api', array( $this, 'plugin_update_information' ), 20, 3 );
		add_action( 'in_plugin_update_message-fooevents_seating/fooevents-seating.php', array( $this, 'show_upgrade_notification' ), 10, 2 );
		add_action( 'upgrader_process_complete', array( $this, 'after_plugin_update' ), 10, 2 );
	}

	public function plugin_update_information( $res, $action, $args ) {

		if ( 'plugin_information' !== $action ) {

				return $res;

		}

		$plugin_slug = 'fooevents_seating/fooevents-seating.php';

		if ( $plugin_slug !== $args->slug ) {

			return $res;

		}

		if ( false == $remote = get_transient( 'fooevents_update_' . $plugin_slug ) ) {

			$remote = wp_remote_get(
				'https://www.fooevents.com/update_info/fooevents_seating.json',
				array(
					'timeout' => 10,
					'headers' => array(
						'Accept' => 'application/json',
					),
				)
			);

			if ( ! is_wp_error( $remote ) && isset( $remote['response']['code'] ) && $remote['response']['code'] == 200 && ! empty( $remote['body'] ) ) {

				set_transient( 'fooevents_update_' . $plugin_slug, $remote, 43200 ); // 12 hours cache

			}
		}

		if ( ! is_wp_error( $remote ) && isset( $remote['response']['code'] ) && $remote['response']['code'] == 200 && ! empty( $remote['body'] ) ) {

			$remote = json_decode( $remote['body'] );
			$res    = new stdClass();

			$res->name           = $remote->name;
			$res->slug           = $plugin_slug;
			$res->version        = $remote->version;
			$res->tested         = $remote->tested;
			$res->requires       = $remote->requires;
			$res->author         = '<a href="https://www.fooevents.com">FooEvents</a>';
			$res->author_profile = 'https://www.fooevents.com';
			$res->download_link  = '';
			$res->trunk          = '';
			$res->requires_php   = $remote->requires_php;
			$res->last_updated   = $remote->last_updated;
			$res->sections       = array(
				// 'description' => $remote->description,
				'changelog' => $remote->changelog,
			);

			$res->banners = array(
				'low'  => 'https://www.fooevents.com/update_info/fooevents_for_woocommerce-772x250.jpg',
				'high' => 'https://www.fooevents.com/update_info/fooevents_for_woocommerce-1544x500.jpg',
			);

			return $res;

		}

		return $res;
	}

	public function set_transitent( $transient ) {

		/*
		if (empty($transient->checked)) {
			return $transient;
		}*/

		$this->init_plugin_data();
		$this->get_latest_plugin_details_fooevents();

		if ( isset( $this->fooevents_reponse['update_available'] ) && $this->fooevents_reponse['update_available'] == 'yes' ) {

			$obj              = new stdClass();
			$obj->slug        = $this->slug;
			$obj->new_version = $this->fooevents_reponse['version'];
			$obj->url         = $this->fooevents_reponse['url'];
			$obj->package     = $this->fooevents_reponse['url'];

			$transient->response[ $this->slug ] = $obj;

		}

		return $transient;
	}

	public function init_plugin_data() {

		$this->slug        = plugin_basename( $this->config->plugin_file );
		$this->plugin_data = get_plugin_data( $this->config->plugin_file, false, false );
	}

	private function get_latest_plugin_details_fooevents() {

		if ( empty( $this->fooevents_api_key ) ) {

			return;

		}

		if ( empty( $this->plugin_data ) ) {

			$this->plugin_data = get_plugin_data( $this->config->plugin_file, false, false );

		}

		$url = 'https://updates.fooevents.com';

		$last_update_check    = get_option( '_fooevents_seating_last_update_check', true );
		$last_update_response = get_option( '_fooevents_seating_last_update_response', true );
		$expire_check         = current_time( 'timestamp' ) - 7200;

		if ( empty( $last_update_check ) || 1 === (int) $last_update_check || $last_update_check <= $expire_check ) {

			$params = array(
				'api'         => $this->fooevents_api_key,
				'envato_api'  => $this->envato_api_key,
				'plugin_name' => $this->plugin_data['Name'],
				'version'     => $this->plugin_data['Version'],
				'home_url'    => $this->home_url,
			);

			$response = wp_remote_post( $url, array( 'body' => $params ) );

			if ( ! is_wp_error( $response ) ) {

				$response                = $response['body'];
				$this->fooevents_reponse = json_decode( $response, true );
				update_option( '_fooevents_seating_last_update_response', $response );

			} else {

				$this->fooevents_reponse = '';

			}

			$timestamp = current_time( 'timestamp' );
			update_option( '_fooevents_seating_last_update_check', $timestamp );

		} else {

			$this->fooevents_reponse = json_decode( $last_update_response, true );

		}
	}

	public function set_plugin_info( $false, $action, $response ) {

		if ( empty( $response->slug ) || $response->slug != $this->slug ) {
			return false;
		}

		$this->init_plugin_data();

		$response->sections = array(
			'description' => $this->plugin_data['Name'],
		);

		$response->requires = '';

		$response->tested = '';

		$response->name = $this->plugin_data['Name'];

		return $response;
	}

	public function show_upgrade_notification( $current_plugin_metadata, $new_plugin_metadata ) {

		if ( empty( $this->fooevents_reponse ) ) {

			$this->get_latest_plugin_details_fooevents();

		}

		if ( ! empty( $this->fooevents_reponse ) ) {

			if ( 'error' === $this->fooevents_reponse['status'] || 'error_license' === $this->fooevents_reponse['status'] ) {

				echo '<span class="fooevents-update-notice" style="display: block">';
				echo '<strong>' . esc_attr( __( 'Important:', 'fooevents-for-woocommerce' ) ) . '</strong> ';
				echo esc_html( $this->fooevents_reponse['message'] ) . ' ';
				if ( isset( $this->fooevents_reponse['cta'] ) ) {

					echo '<strong>' . wp_kses_post( $this->fooevents_reponse['cta'] ) . '</strong> ';

				}
				echo '</span>';

			}

			if ( 'success' === $this->fooevents_reponse['status'] ) {

				echo ' <strong><u>' . esc_attr( __( 'Please backup your files and database before updates!', 'fooevents-for-woocommerce' ) ) . '</u></strong>';

			}
		}
	}

	public function after_plugin_update() {

		update_option( '_fooevents_seating_last_update_check', '' );
		update_option( '_fooevents_seating_last_update_response', '' );
	}
}
