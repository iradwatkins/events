<?php
/**
 * Template to display seating details on the tickets detail page.
 *
 * @link https://www.fooevents.com
 * @package fooevents-seating
 */

?>
<h2>Seats</h2>
<table class="form-table">
	<tbody>
		<?php foreach ( $custom_values as $key => $value ) : ?>
		<tr valign="top">  
			<td style="width: 200px;">
				<label><?php echo esc_html( $this->output_seating_field_name( $key ) ); ?>:</label><Br />
			</td>
			<td>
				<?php echo esc_html( $value ); ?>
			</td>
		</tr>
		<?php endforeach; ?>
	</tbody>
</table>
