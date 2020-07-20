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

export const POST_FORMATS = [
	{ id: 'aside', caption: __( 'Aside' ) },
	{ id: 'gallery', caption: __( 'Gallery' ) },
	{ id: 'link', caption: __( 'Link' ) },
	{ id: 'image', caption: __( 'Image' ) },
	{ id: 'quote', caption: __( 'Quote' ) },
	{ id: 'standard', caption: __( 'Standard' ) },
	{ id: 'status', caption: __( 'Status' ) },
	{ id: 'video', caption: __( 'Video' ) },
	{ id: 'audio', caption: __( 'Audio' ) },
	{ id: 'chat', caption: __( 'Chat' ) },
];

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

	const { postFormat, suggestedFormat, supportedFormats } = useSelect(
		( select ) => {
			const themeSupportedFormats =
				select( 'core' ).getThemeSupports().formats ?? [];
			const { getEditedPostAttribute, getSuggestedPostFormat } = select(
				'core/editor'
			);
			const _postFormat = getEditedPostAttribute( 'format' );

			// Ensure current format is always in the set.
			// The current format may not be a format supported by the theme.
			const _supportedFormats = union(
				[ _postFormat ],
				themeSupportedFormats
			);

			// The suggested format may not be supported by the theme, so we have
			// to check to make sure.
			const potentialSuggestedFormat = getSuggestedPostFormat();

			let supportedSuggestedFormat = null;

			if (
				potentialSuggestedFormat &&
				_supportedFormats.includes( potentialSuggestedFormat )
			) {
				supportedSuggestedFormat = potentialSuggestedFormat;
			}

			return {
				postFormat: _postFormat ?? 'standard',
				supportedFormats: _supportedFormats,
				suggestedFormat: supportedSuggestedFormat,
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
						value={ postFormat }
						onChange={ ( format ) => updatePostFormat( format ) }
						id={ postFormatSelectorId }
						options={ supportedFormats.map( ( format ) => ( {
							label: POST_FORMAT_TITLES[ format ],
							value: format,
						} ) ) }
					/>
				</div>

				{ suggestedFormat && suggestedFormat !== postFormat && (
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
