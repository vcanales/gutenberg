/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { Button, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { POST_FORMAT_TITLES } from '../post-format';

const PostFormatSuggestion = ( {
	suggestedPostFormat,
	suggestionText,
	onUpdatePostFormat,
} ) => (
	<Button isLink onClick={ () => onUpdatePostFormat( suggestedPostFormat ) }>
		{ suggestionText }
	</Button>
);

export default function PostFormatPanel() {
	const suggestedFormat = useSelect( ( select ) => {
		const supportedFormats =
			select( 'core' ).getThemeSupports().formats ?? [];
		const { getEditedPostAttribute, getSuggestedPostFormat } = select(
			'core/editor'
		);
		const currentFormat = getEditedPostAttribute( 'format' );
		const potentialSuggestedFormat = getSuggestedPostFormat();

		// If the suggested format isn't null, isn't already applied, and is
		// supported by the theme, return it.
		if (
			potentialSuggestedFormat &&
			potentialSuggestedFormat !== currentFormat &&
			supportedFormats.includes( potentialSuggestedFormat )
		) {
			return potentialSuggestedFormat;
		}
		return null;
	}, [] );

	const { editPost } = useDispatch( 'core/editor' );

	if ( ! suggestedFormat ) {
		return null;
	}

	function updatePostFormat( format ) {
		editPost( { format } );
	}

	return (
		<PanelBody
			initialOpen={ false }
			title={
				<>
					{ __( 'Suggestion:' ) }
					<span className="editor-post-publish-panel__link">
						{ __( 'Use a post format' ) }
					</span>
				</>
			}
		>
			<p>
				{ __(
					'Your theme uses post formats to highlight different kinds of content, like images or videos. Apply a post format to see this special styling.'
				) }
			</p>
			<p>
				<PostFormatSuggestion
					onUpdatePostFormat={ updatePostFormat }
					suggestedPostFormat={ suggestedFormat }
					suggestionText={ sprintf(
						/* translators: %s: post format */
						__( 'Apply the "%1$s" format.' ),
						POST_FORMAT_TITLES[ suggestedFormat ]
					) }
				/>
			</p>
		</PanelBody>
	);
}
