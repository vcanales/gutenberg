/**
 * External dependencies
 */
import { union } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, SelectControl } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PostFormatCheck from './check';

export const POST_FORMAT_TITLES = {
	aside: __( 'Aside' ),
	audio: __( 'Audio' ),
	chat: __( 'Chat' ),
	gallery: __( 'Gallery' ),
	image: __( 'Image' ),
	link: __( 'Link' ),
	quote: __( 'Quote' ),
	standard: __( 'Standard' ),
	status: __( 'Status' ),
	video: __( 'Video' ),
};

export default function PostFormat() {
	const instanceId = useInstanceId( PostFormat );
	const postFormatSelectorId = `post-format-selector-${ instanceId }`;

	const { currentFormat, listedFormats, suggestedFormat } = useSelect(
		( select ) => {
			const supportedFormats =
				select( 'core' ).getThemeSupports().formats ?? [];
			const { getEditedPostAttribute, getSuggestedPostFormat } = select(
				'core/editor'
			);
			const _currentFormat =
				getEditedPostAttribute( 'format' ) ?? 'standard';

			const potentialSuggestedFormat = getSuggestedPostFormat();

			// If the suggested format isn't null, isn't already applied, and is
			// supported by the theme, return it. Otherwise, return null.
			const suggestionIsValid =
				potentialSuggestedFormat &&
				potentialSuggestedFormat !== _currentFormat &&
				supportedFormats.includes( potentialSuggestedFormat );

			const _suggestedFormat = suggestionIsValid
				? potentialSuggestedFormat
				: null;

			return {
				currentFormat: _currentFormat,
				// The current format may not be supported by the theme.
				// Ensure it is always shown in the select control.
				listedFormats: union( [ _currentFormat ], supportedFormats ),
				suggestedFormat: _suggestedFormat,
			};
		},
		[]
	);

	const { editPost } = useDispatch( 'core/editor' );

	function updatePostFormat( format ) {
		editPost( { format } );
	}

	return (
		<PostFormatCheck>
			<div className="editor-post-format">
				<div className="editor-post-format__content">
					<label htmlFor={ postFormatSelectorId }>
						{ __( 'Post Format' ) }
					</label>
					<SelectControl
						value={ currentFormat }
						onChange={ ( format ) => updatePostFormat( format ) }
						id={ postFormatSelectorId }
						options={ listedFormats.map( ( format ) => ( {
							label: POST_FORMAT_TITLES[ format ],
							value: format,
						} ) ) }
					/>
				</div>

				{ suggestedFormat && (
					<div className="editor-post-format__suggestion">
						{ __( 'Suggestion:' ) }{ ' ' }
						<Button
							isLink
							onClick={ () =>
								updatePostFormat( suggestedFormat )
							}
						>
							{ POST_FORMAT_TITLES[ suggestedFormat ] }
						</Button>
					</div>
				) }
			</div>
		</PostFormatCheck>
	);
}
