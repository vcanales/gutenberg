/**
 * WordPress dependencies
 */
import { __unstableUseDropZone as useDropZone } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useOnFileDrop from './use-on-file-drop';
import useOnHTMLDrop from './use-on-html-drop';
import useOnBlockDrop from './use-on-block-drop';

/**
 * @typedef  {Object} WPBlockDragPosition
 * @property {number} x The horizontal position of a the block being dragged.
 * @property {number} y The vertical position of the block being dragged.
 */

/**
 * The orientation of a block list.
 *
 * @typedef {'horizontal'|'vertical'|undefined} WPBlockListOrientation
 */

function getDistanceFromPointToEdge( point, rect, edge ) {
	const isHorizontal = edge === 'left' || edge === 'right';
	const { x, y } = point;
	const pointLateralPosition = isHorizontal ? y : x;
	const pointForwardPosition = isHorizontal ? x : y;
	const edgeLateralStart = isHorizontal ? rect.top : rect.left;
	const edgeLateralEnd = isHorizontal ? rect.bottom : rect.right;
	const edgeForwardPosition = rect[ edge ];

	let edgeLateralPosition;
	if (
		pointLateralPosition >= edgeLateralStart &&
		pointLateralPosition <= edgeLateralEnd
	) {
		edgeLateralPosition = pointLateralPosition;
	} else if ( pointLateralPosition < edgeLateralStart ) {
		edgeLateralPosition = edgeLateralStart;
	} else {
		edgeLateralPosition = edgeLateralEnd;
	}

	return Math.sqrt(
		( pointLateralPosition - edgeLateralPosition ) ** 2 +
			( pointForwardPosition - edgeForwardPosition ) ** 2
	);
}

function getDistanceToNearestEdge(
	point,
	rect,
	allowedEdges = [ 'top', 'bottom', 'left', 'right' ]
) {
	let candidateDistance;
	let candidateEdge;

	allowedEdges.forEach( ( edge ) => {
		const distance = getDistanceFromPointToEdge( point, rect, edge );

		if ( candidateDistance === undefined || distance < candidateDistance ) {
			candidateDistance = distance;
			candidateEdge = edge;
		}
	} );

	return [ candidateDistance, candidateEdge ];
}

/**
 * Given a list of block DOM elements finds the index that a block should be dropped
 * at.
 *
 * This function works for both horizontal and vertical block lists and uses the following
 * terms for its variables:
 *
 * - Lateral, meaning the axis running horizontally when a block list is vertical and vertically when a block list is horizontal.
 * - Forward, meaning the axis running vertically when a block list is vertical and horizontally
 * when a block list is horizontal.
 *
 *
 * @param {Element[]}              elements    Array of DOM elements that represent each block in a block list.
 * @param {WPBlockDragPosition}    position    The position of the item being dragged.
 * @param {WPBlockListOrientation} orientation The orientation of a block list.
 *
 * @return {number|undefined} The block index that's closest to the drag position.
 */
export function getNearestBlockIndex( elements, position, orientation ) {
	const allowedEdges =
		orientation === 'horizontal'
			? [ 'left', 'right' ]
			: [ 'top', 'bottom' ];

	let candidateIndex;
	let candidateDistance;

	elements.forEach( ( element, index ) => {
		// Ensure the element is a block. It should have the `wp-block` class.
		if ( ! element.classList.contains( 'wp-block' ) ) {
			return;
		}

		const rect = element.getBoundingClientRect();
		const [ distance, edge ] = getDistanceToNearestEdge(
			position,
			rect,
			allowedEdges
		);

		if ( candidateDistance === undefined || distance < candidateDistance ) {
			// If the user is dropping to the trailing edge of the block
			// add 1 to the index to represent dragging after.
			const isTrailingEdge = edge === 'bottom' || edge === 'right';
			let offset = isTrailingEdge ? 1 : 0;

			// If the target is the dragged block itself and another 1 to
			// index as the dragged block is set to `display: none` and
			// should be skipped in the calculation.
			const isTargetDraggedBlock =
				isTrailingEdge &&
				elements[ index + 1 ] &&
				elements[ index + 1 ].classList.contains( 'is-dragging' );
			offset += isTargetDraggedBlock ? 1 : 0;

			// Update the currently known best candidate.
			candidateDistance = distance;
			candidateIndex = index + offset;
		}
	} );

	return candidateIndex;
}

/**
 * Retrieve the data for a block drop event.
 *
 * @param {WPSyntheticEvent} event The drop event.
 *
 * @return {Object} An object with block drag and drop data.
 */
function parseDropEvent( event ) {
	let result = {
		srcRootClientId: null,
		srcClientIds: null,
		type: null,
	};

	if ( ! event.dataTransfer ) {
		return result;
	}

	try {
		result = Object.assign(
			result,
			JSON.parse( event.dataTransfer.getData( 'text' ) )
		);
	} catch ( err ) {
		return result;
	}

	return result;
}

/**
 * @typedef  {Object} WPBlockDropZoneConfig
 * @property {Object} element      A React ref object pointing to the block list's DOM element.
 * @property {string} rootClientId The root client id for the block list.
 */

/**
 * A React hook that can be used to make a block list handle drag and drop.
 *
 * @param {WPBlockDropZoneConfig} dropZoneConfig configuration data for the drop zone.
 *
 * @return {number|undefined} The block index that's closest to the drag position.
 */
export default function useBlockDropZone( {
	element,
	rootClientId: targetRootClientId,
} ) {
	function selector( select ) {
		const {
			getBlockListSettings,
			getClientIdsOfDescendants,
			getSettings,
			getTemplateLock,
		} = select( 'core/block-editor' );
		return {
			orientation: getBlockListSettings( targetRootClientId )
				?.orientation,
			getClientIdsOfDescendants,
			hasUploadPermissions: !! getSettings().mediaUpload,
			isLockedAll: getTemplateLock( targetRootClientId ) === 'all',
		};
	}

	const { isLockedAll, orientation } = useSelect( selector, [
		targetRootClientId,
	] );

	const [ targetBlockIndex, setTargetBlockIndex ] = useState( null );
	const onFilesDrop = useOnFileDrop( targetRootClientId, targetBlockIndex );
	const onHTMLDrop = useOnHTMLDrop( targetRootClientId, targetBlockIndex );
	const onDrop = useOnBlockDrop( targetRootClientId, targetBlockIndex );

	const { position } = useDropZone( {
		element,
		onFilesDrop,
		onHTMLDrop,
		onDrop,
		isDisabled: isLockedAll,
		withPosition: true,
	} );

	useEffect( () => {
		if ( position ) {
			const blockElements = Array.from( element.current.children );

			const targetIndex = getNearestBlockIndex(
				blockElements,
				position,
				orientation
			);

			setTargetBlockIndex( targetIndex === undefined ? 0 : targetIndex );
		}
	}, [ position ] );

	if ( position ) {
		return targetBlockIndex;
	}
}
