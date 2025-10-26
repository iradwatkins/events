<?php
/**
 * Ticket detail template
 *
 * @link https://www.fooevents.com
 * @package fooevents-seating
 */

?>
<?php if ( ! empty( $seat_row_values ) ) : ?>
	<h3><?php echo esc_html( $seat_text ); ?></h3>
	<div class="ticket-details-row seating-class-row">
		<label><?php echo esc_html( $row_name_text ); ?></label>
		<select name="fooevents_seat_row_name" id="fooevents_seat_row_name" class="select" data-placeholder="Row Name">   
		<?php foreach ( $seat_row_values as $key => $field ) : ?>
			<?php
				$row_value = $field[0];
				$row_name  = $field[1];
				$selected  = $field[2];
			?>
			<option value="<?php echo esc_attr( $row_value ); ?>" <?php echo esc_attr( $selected ); ?>><?php echo esc_attr( $row_name ); ?></option>
		<?php endforeach; ?>
		</select>
	</div>
	<div class="ticket-details-row seating-class-seat">
		<label><?php echo esc_html( $seat_number_text ); ?></label>
		<select name="fooevents_seat_number" id="fooevents_seat_number" class="select" data-allow_clear="true" data-placeholder="Seat Number"></select>
	</div>
	<div id="fooevents_seating_dialog" title="<?php echo esc_attr( $seating_chart_text ); ?>"></div>
<?php endif; ?>
<div class="clear"></div>
