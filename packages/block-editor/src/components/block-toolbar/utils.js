/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';

const {
	clearTimeout,
	requestAnimationFrame,
	cancelAnimationFrame,
	setTimeout,
} = window;
const DEBOUNCE_TIMEOUT = 250;

/**
 * Hook that creates debounced activate/deactivate callbacks.
 *
 * @param {Object}   props                       Component props.
 * @param {Object}   props.ref                   Element reference.
 * @param {boolean}  props.isFocused             Whether the component has
 *                                               current focus.
 * @param {number}   [props.debounceTimeout=250] Debounce timeout in
 *                                               milliseconds.
 * @param {Function} [props.onChange=noop]       Callback function.
 */
export function useDebouncedActivateCallbacks( {
	ref,
	isFocused,
	debounceTimeout = DEBOUNCE_TIMEOUT,
	onChange = noop,
} ) {
	const [ active, setActive ] = useState( false );
	const timeoutRef = useRef();

	const handleOnChange = ( nextIsFocused ) => {
		setActive( nextIsFocused );
		onChange( nextIsFocused );
	};

	const getIsHovered = () => {
		return ref?.current && ref.current.matches( ':hover' );
	};

	const shouldHideMovers = () => {
		const isHovered = getIsHovered();

		return ! isFocused && ! isHovered;
	};

	const clearTimeoutRef = () => {
		const timeout = timeoutRef.current;

		if ( timeout && clearTimeout ) {
			clearTimeout( timeout );
		}
	};

	const debouncedActivate = ( event ) => {
		if ( event ) {
			event.stopPropagation();
		}

		clearTimeoutRef();

		if ( ! active ) {
			handleOnChange( true );
		}
	};

	const debouncedDeactivate = ( event ) => {
		if ( event ) {
			event.stopPropagation();
		}

		clearTimeoutRef();

		timeoutRef.current = setTimeout( () => {
			if ( shouldHideMovers() ) {
				handleOnChange( false );
			}
		}, debounceTimeout );
	};

	useEffect( () => () => clearTimeoutRef(), [] );

	return {
		debouncedActivate,
		debouncedDeactivate,
	};
}

/**
 * Hook that provides hover/focus gesture events for a given DOM element.
 *
 * @param {Object}   props                       Component props.
 * @param {Object}   props.ref                   Element reference.
 * @param {number}   [props.debounceTimeout=250] Debounce timeout in milliseconds.
 * @param {Function} [props.onChange=noop]       Callback function.
 */
export function useElementHoverFocusGestures( {
	ref,
	debounceTimeout = DEBOUNCE_TIMEOUT,
	onChange = noop,
} ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const {
		debouncedActivate,
		debouncedDeactivate,
	} = useDebouncedActivateCallbacks( {
		ref,
		debounceTimeout,
		isFocused,
		onChange,
	} );

	const registerRef = useRef( false );

	const isFocusedWithin = () => {
		return ref?.current && ref.current.contains( document.activeElement );
	};

	useEffect( () => {
		const node = ref.current;

		const handleOnFocus = () => {
			if ( isFocusedWithin() ) {
				setIsFocused( true );
				debouncedActivate();
			}
		};

		const handleOnBlur = () => {
			if ( ! isFocusedWithin() ) {
				setIsFocused( false );
				debouncedDeactivate();
			}
		};

		/**
		 * Events are added via DOM events (vs. React synthetic events),
		 * as the child React components swallow mouse events.
		 */
		if ( node && ! registerRef.current ) {
			node.addEventListener( 'focus', handleOnFocus, true );
			node.addEventListener( 'blur', handleOnBlur, true );
			registerRef.current = true;
		}

		return () => {
			if ( node ) {
				node.removeEventListener( 'focus', handleOnFocus );
				node.removeEventListener( 'blur', handleOnBlur );
			}
		};
	}, [
		ref,
		registerRef,
		setIsFocused,
		debouncedActivate,
		debouncedDeactivate,
	] );

	return {
		onMouseMove: debouncedActivate,
		onMouseLeave: debouncedDeactivate,
	};
}

let requestAnimationFrameId;

/**
 * Hook that toggles the highlight (outline) state of a block
 *
 * @param {string} clientId The block's clientId
 *
 * @return {Function} Callback function to toggle highlight state.
 */
export function useToggleBlockHighlight( clientId ) {
	const { toggleBlockHighlight } = useDispatch( 'core/block-editor' );

	const updateBlockHighlight = useCallback(
		( isFocused ) => {
			toggleBlockHighlight( clientId, isFocused );
		},
		[ clientId ]
	);

	useEffect( () => {
		// On mount, we make sure to cancel any pending animation frame request
		// that hasn't been completed yet. Components like NavigableToolbar may
		// mount and unmount quickly.
		if ( requestAnimationFrameId ) {
			cancelAnimationFrame( requestAnimationFrameId );
		}
		return () => {
			// Sequences state change to enable editor updates (e.g. cursor
			// position) to render correctly.
			requestAnimationFrameId = requestAnimationFrame( () => {
				updateBlockHighlight( false );
			} );
		};
	}, [] );

	return updateBlockHighlight;
}
