<?php
/**
 * Seating options for event
 *
 * @link https://www.fooevents.com
 * @package fooevents-seating
 */

?>

<?php echo '<script type="text/javascript"> var seatColor = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColor', true ) ) ) . '";</script>'; ?>
<?php echo '<script type="text/javascript"> var seatColorSelected = "#' . esc_js( str_replace( '#', '', get_option( 'globalWooCommerceEventsSeatingColorSelected', true ) ) ) . '";</script>'; ?>

<div id="fooevents_seating_options" class="panel woocommerce_options_panel fooevents_options_panel" style="display: block;">    
	<h2><?php esc_attr_e( 'Event Seating', 'woocommerce-events' ); ?></h2>
	<div class="fooevents_seating_wrap">

		<div class="options_group">
		<?php /* <p id="restart_numbers"><label for="restart_seat_numbers">Restart seat numbers for each row</label><input class="checkbox" style="" name="restart_seat_numbers" id="comment_status" value="open" checked="checked" type="checkbox"></p> */ ?>
			<table id="fooevents_seating_options_table" cellpadding="0" cellspacing="0">
				<thead>
					<tr>
						<th></th>
						<th><?php esc_attr_e( 'Area Name (e.g. Row 1, Table 1, etc.)', 'fooevents-seating' ); ?></th>
						<th><?php esc_attr_e( 'Available Seats / Spaces', 'fooevents-seating' ); ?></th>
						<th><?php esc_attr_e( 'Variation', 'fooevents-seating' ); ?></th>
						<th><?php esc_attr_e( 'Icon Type', 'fooevents-seating' ); ?></th>
						
						<th></th>
					</tr>
				</thead>
				<tbody>
						
				<?php $has_seating = false; ?>
				<?php foreach ( $fooevents_seating_options as $option_key => $option ) : ?>
					
					<?php
					$option_ids         = array_keys( $option );
					$option_values      = array_values( $option );
					$row_id             = $option_ids[0];
					$row_value          = $option_values[0];
					$number_seats_id    = $option_ids[1];
					$number_seats_value = $option_values[1];
					$variations_id      = $option_ids[2];
					$variations_values  = $option_values[2];
					if ( isset( $option_ids[3] ) ) {
						$type_id = $option_ids[3];
					} else {
						$type_id = $option_key . '_type';
					}
					if ( isset( $option_values[3] ) ) {
						$type_value = $option_values[3];
					} else {
						$type_value = 'seat1';
					}
							$remove_id = $option_key . '_remove';
					?>
						<?php
						$x                 = 0;
						$num_option_ids    = count( $option_ids );
						$num_option_values = count( $option_values );
						?>
					<?php if ( $num_option_ids === $num_option_values ) : ?>
						<?php $has_seating = true; ?>
					<tr id="<?php echo esc_attr( $option_key ); ?>">
						<td>
							<span class="dashicons dashicons-menu"></span>
						</td>
						<td><input type="text" id="<?php echo esc_attr( $row_id ); ?>" name="<?php echo esc_attr( $row_id ); ?>" class="fooevents_seating_row_name" value="<?php echo esc_attr( $row_value ); ?>" autocomplete="off" maxlength="70"/></td>
						<td>
								<input data-current="<?php echo esc_attr( $number_seats_id ); ?>" type="number" min="1" max="400" id="<?php echo esc_attr( $number_seats_id ); ?>" name="<?php echo esc_attr( $number_seats_id ); ?>" class="fooevents_seating_number_seats"  value="<?php echo esc_attr( $number_seats_value ); ?>" >
						</td>
						<td>
							<select id="<?php echo esc_attr( $variations_id ); ?>" name="<?php echo esc_attr( $variations_id ); ?>" class="fooevents_seating_variations" multiple>
							<?php
								echo '<option value="default"';
								echo ( ( is_array( $variations_values ) && ( in_array( 'default', $variations_values, true ) || empty( $variations_values ) ) ) || 'default' === $variations_values ) ? ' SELECTED' : '';
								echo '>Default</option>';
								$handle      = new WC_Product_Variable( $post->ID );
								$variations1 = $handle->get_children();
							foreach ( $variations1 as $value ) {
								$single_variation = new WC_Product_Variation( $value );
								$attributes       = implode( ' / ', $single_variation->get_variation_attributes() );
								echo '<option  value="' . esc_attr( $value ) . '"';
								echo ( ( is_array( $variations_values ) && in_array( strval( $value ), $variations_values, true ) ) || strval( $value ) === $variations_values ) ? ' SELECTED' : '';
								echo '>' . esc_attr( $attributes ) . ' - ' . esc_attr( get_woocommerce_currency_symbol() ) . esc_attr( $single_variation->get_price() ) . '</option>';
							}

							?>
							</select>
						</td>
						<td>
							<select id="<?php echo esc_attr( $type_id ); ?>" name="<?php echo esc_attr( $type_id ); ?>" class="fooevents_seating_type">
								<option value="default" <?php echo ( 'default' === $type_value ) ? ' SELECTED' : ''; ?>>Chairs</option>
								<option value="square" <?php echo ( 'square' === $type_value ) ? ' SELECTED' : ''; ?>>Squares</option>
								<option value="circle" <?php echo ( 'circle' === $type_value ) ? ' SELECTED' : ''; ?>>Circles</option>
								<option value="kiosk" <?php echo ( 'kiosk' === $type_value ) ? ' SELECTED' : ''; ?>>Kiosks</option>
								<option value="tent" <?php echo ( 'tent' === $type_value ) ? ' SELECTED' : ''; ?>>Tents</option>
								<option value="parking" <?php echo ( 'parking' === $type_value ) ? ' SELECTED' : ''; ?>>Parking</option>
								<option value="ticket" <?php echo ( 'ticket' === $type_value ) ? ' SELECTED' : ''; ?>>Tickets</option>
								<option value="table" <?php echo ( 'table' === $type_value ) ? ' SELECTED' : ''; ?>>Table</option>
								<option value="table_new_row" <?php echo ( 'table_new_row' === $type_value ) ? ' SELECTED' : ''; ?>>Table (New Row)</option>
							</select>
						</td>
						  
						<td><a href="#" id="<?php echo esc_attr( $remove_id ); ?>" name="<?php echo esc_attr( $remove_id ); ?>" class="fooevents_seating_remove" class="fooevents_seating_remove">[X]</a></td>
					</tr>
					<?php endif; ?>
					<?php endforeach; ?>
					
				</tbody>
			</table>    
		</div>
	</div>

	<div id="fooevents_seating_dialog" title="<?php echo esc_attr( $seating_chart_text ); ?>">
		  
	</div>

	<?php if ( $has_seating === false ) { ?>
	<p class="fooevents_notfound fooevents_notfound_seating"><?php echo esc_attr__( 'No Seating found.', 'fooevents-seating' ); ?></p>
	<?php } ?>	

	<div id="fooevents_seating_info">
		<p><a href="#" id="fooevents_seating_new_field" name="<?php echo esc_attr( $row_text ); ?>" class='button button-primary'>+ <?php echo esc_html( $new_row_text ); ?></a><a id="fooevents_seating_chart" class='button button-primary'><?php echo esc_html( $view_seating_chart_text ); ?></a></p>
	</div>
	<input type="hidden" id="fooevents_seating_options_serialized" name="fooevents_seating_options_serialized" value="<?php echo esc_attr( $fooevents_seating_options_serialized ); ?>" autocomplete="off" />
	<input type="hidden" id="fooevents_seats_unavailable_serialized" name="fooevents_seats_unavailable_serialized" value="<?php echo esc_attr( $fooevents_seats_unavailable_serialized ); ?>" autocomplete="off" />
	<input type="hidden" id="fooevents_seats_changed" name="fooevents_seats_changed" value="no" autocomplete="off" />
	<input type="hidden" id="fooevents_seats_blocked_serialized" name="fooevents_seats_blocked_serialized" value="<?php echo esc_attr( $fooevents_seats_blocked_serialized ); ?>" autocomplete="off" />
	<input type="hidden" id="fooevents_seats_aisles_serialized" name="fooevents_seats_aisles_serialized" value="<?php echo esc_attr( $fooevents_seats_aisles_serialized ); ?>" autocomplete="off" />
	<div id="fooevents_variations" style="display:none">
	<?php
					$handle      = new WC_Product_Variable( $post->ID );
					$variations1 = $handle->get_children();
					echo '<option value="default" selected>Default</option>';
	foreach ( $variations1 as $value ) {
			$single_variation = new WC_Product_Variation( $value );
			echo '<option  value="' . esc_attr( $value ) . '">' . implode( ' / ', $single_variation->get_variation_attributes() ) . ' - ' . esc_attr( get_woocommerce_currency_symbol() ) . esc_attr( $single_variation->get_price() ) . '</option>';
	}

	?>
	</div>
	<div id="fooevents_seat_types" style="display:none">
			<option value="default">Chairs</option>
			<option value="square">Squares</option>
			<option value="circle">Circles</option>
			<option value="kiosk">Kiosks</option>
			<option value="tent">Tents</option>
			<option value="parking">Parking</option>
			<option value="ticket">Tickets</option>
			<option value="table">Table</option>
			<option value="table_new_row">Table (New Row)</option>
	</div>
</div>
