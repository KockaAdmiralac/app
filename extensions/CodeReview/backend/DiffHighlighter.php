<?php

/**
 * Highlight a SVN diff for easier readibility
 */
class CodeDiffHighlighter {
	/* chunk line count for the original file */
	protected $left  = 0;
	/* chunk line count for the changed file */
	protected $right = 0;
	/* number of chunks */
	protected $chunk = 0;
	/* line number inside patch */
	protected $lineNumber = 0;

	/**
	 * Main entry point. Given a diff text, highlight it
	 * and wrap it in a div
	 *
	 * @param $text string Text to highlight
	 * @return string
	 */
	function render( $text ) {
		return '<table class="mw-codereview-diff">' .
			$this->splitLines( $text ) .
			"</table>\n";
	}

	/**
	 * Given a bunch of text, split it into individual
	 * lines, color them, then put it back into one big
	 * string
	 * @param $text string Text to split and highlight
	 * @return string
	 */
	function splitLines( $text ) {
		return implode( "\n",
			array_map( array( $this, 'parseLine' ),
				explode( "\n", $text ) ) );
	}

	/**
	 * Internal dispatcher to a handler depending on line
	 * Handles lines beginning with '-' '+' '@' and ' '
	 * @param string $line Diff line to parse
	 * @return string HTML table line (with <tr></tr>)
	 */
	function parseLine( $line ) {
		$this->lineNumber++;

		if( $line === '' ) { return ""; } // do not create bogus lines

		# Dispatch diff lines to the proper handler
		switch( substr( $line, 0, 1 ) ) {
		case '-':
			if( substr( $line, 0, 3 ) === '---' ) {
				return;
			}
			$r = $this->handleLineDeletion( $line );
			break;
		case '+':
			if( substr( $line, 0, 3 ) === '+++' ) {
				return;
			}
			$r = $this->handleLineAddition( $line );
			break;
		case '@':
			$r = $this->handleChunkDelimiter( $line );
			break;
		case ' ':
			$r = $this->handleUnchanged( $line );
			break;

		# Patch lines that will be skipped:
		case '=':
			return;

		# Remaining case should be the file name
		default:
			$r = $this->handleLineFile( $line );
		}

		# Return HTML generated by one of the handler
		return $r;
	}

	function formatLine( $content, $class = null ) {

		if( is_null($class) ) {
			return Html::rawElement( 'tr', $this->getLineIdAttr(),
					  Html::Element( 'td', array( 'class'=>'linenumbers' ), $this->left  )
					. Html::Element( 'td', array( 'class'=>'linenumbers' ), $this->right )
					. Html::Element( 'td', array() , $content )
			);
		}

		# Skip line number when they do not apply
		$left = $right = '&#160;';

		switch( $class ) {
		case 'chunkdelimiter':
			$left = $right = '&mdash;';
			break;
		case 'unchanged':
			$left  = $this->left;
			$right = $this->right;
			break;
		case 'del':
			$left  = $this->left;
			break;
		case 'ins':
			$right = $this->right;
			break;

		default:
			# Rely on $left, $right initialization above
		}

		$classAttr = is_null($class) ? array() : array( 'class' => $class );
		return Html::rawElement( 'tr', $this->getLineIdAttr(),
				  Html::rawElement( 'td', array( 'class'=>'linenumbers' ), $left  )
				. Html::rawElement( 'td', array( 'class'=>'linenumbers' ), $right )
				. Html::Element( 'td', $classAttr, $content )
		);
	}

	#### LINES HANDLERS ################################################
	function handleLineDeletion( $line ) {
		$this->left++;
		return $this->formatLine( $line, 'del' );
	}

	function handleLineAddition( $line ) {
		$this->right++;
		return $this->formatLine( $line, 'ins' );
	}

	function handleChunkDelimiter( $line ) {
		$this->chunk++;

		list(
			$this->left,
			$leftChanged,  # unused
			$this->right,
			$rightChanged  # unused
		) = $this->parseChunkDelimiter( $line );

		return self::formatLine( $line, 'chunkdelimiter' );
	}

	function handleUnchanged( $line ) {
		$this->left++;
		$this->right++;
		return $this->formatLine( $line, 'unchanged' );
	}

	function handleLineFile( $line ) {
		$this->chunk = 0;
		return Html::rawElement( 'tr',
			array_merge( $this->getLineIdAttr(), array( 'class' => 'patchedfile' ) ),
			Html::Element( 'td', array('colspan'=>3), $line )
		);
	}
	#### END OF LINES HANDLERS #########################################

	function getLineIdAttr() {
		return array( 'id' => $this->lineNumber );
	}

	/**
	 * Turn a diff line into a properly formatted string suitable
	 * for output
	 * @param $line string Line from a diff
	 * @return string
	 */
	function colorLine( $line ) {
		if ( $line == '' ) {
			return ""; // don't create bogus spans
		}
		list( $element, $attribs ) = $this->tagForLine( $line );
		return "<tr>".Xml::element( $element, $attribs, $line )."</tr>";
	}

	/**
	 * Take a line of a diff and apply the appropriate stylings
	 * @param $line string Line to check
	 * @return array
	 */
	function tagForLine( $line ) {
		static $default = array( 'td', array() );
		static $tags = array(
			'-' => array( 'td', array( 'class' => 'del' ) ),
			'+' => array( 'td', array( 'class' => 'ins' ) ),
			'@' => array( 'td', array( 'class' => 'meta' ) ),
			' ' => array( 'td', array() ),
			);
		$first = substr( $line, 0, 1 );
		if ( isset( $tags[$first] ) ) {
			return $tags[$first];
		} else {
			return $default;
		}
	}

	/**
	 * Parse unified diff change chunk header.
	 *
	 * The format represents two ranges for the left (prefixed with -) and right
	 * file (prefixed with +).
	 * The format looks like:
	 * @@ -l,s +l,s @@
	 *
	 * Where:
	 *  - l is the starting line number
	 *  - s is the number of lines the change hunk applies to
	 *
	 * NOTE: visibility is 'public' since the function covered by tests.
	 *
	 * @param $chunk string a one line chunk as described above
	 * @return array with the four values above as an array
	 */
	static function parseChunkDelimiter( $chunkHeader ) {
		$chunkHeader = rtrim( $chunkHeader );

		# regex snippet to capture a number
		$n = "(\d+)";

		$matches = preg_match( "/^@@ -$n,$n \+$n,$n @@$/", $chunkHeader, $m );
		array_shift( $m );

		if( $matches !== 1 ) {
			# We really really should have matched something!
			throw new MWException(
				__METHOD__ . " given an invalid chunk header: '$chunkHeader'\n"
			);
		}
		return $m;
	}
}
