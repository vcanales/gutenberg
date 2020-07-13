/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../navigable-toolbar';
import { BlockToolbar } from '../';

function BlockContextualToolbar( { focusOnMount, ...props } ) {
	const { blockType, hasParent, isMultiToolbar } = useSelect( ( select ) => {
		const {
			getBlockName,
			getBlockParents,
			getSelectedBlockClientIds,
		} = select( 'core/block-editor' );
		const { getBlockType } = select( 'core/blocks' );
		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		return {
			blockType:
				selectedBlockClientId &&
				getBlockType( getBlockName( selectedBlockClientId ) ),
			hasParent:
				selectedBlockClientId &&
				getBlockParents( selectedBlockClientId ).length > 0,
			isMultiToolbar: selectedBlockClientIds.length > 1,
		};
	}, [] );
	if ( blockType ) {
		if ( ! hasBlockSupport( blockType, '__experimentalToolbar', true ) ) {
			return null;
		}
	}
	return (
		<div className="block-editor-block-contextual-toolbar-wrapper">
			<NavigableToolbar
				focusOnMount={ focusOnMount }
				className={ classnames(
					'block-editor-block-contextual-toolbar',
					{ 'has-parent-selector': hasParent && ! isMultiToolbar }
				) }
				/* translators: accessibility text for the block toolbar */
				aria-label={ __( 'Block tools' ) }
				{ ...props }
			>
				<BlockToolbar />
			</NavigableToolbar>
		</div>
	);
}

export default BlockContextualToolbar;
